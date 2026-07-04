import { and, eq, isNull, inArray } from 'drizzle-orm';
import type { DbConnection } from '@/core/db/connection';
import type {
  ImportSchedulesBodyDTO,
  ImportSchedulesOverwriteDTO,
  ImportSchedulesResultDTO,
  ScheduleDTO,
  ScheduleTimeConfigDTO,
} from '@tfg-horarios/shared';
import { schedulesTable, type DrizzleSchedule } from '../db/drizzle.schedule.schema';
import {
  type NewDrizzleScheduleSlotInclusion,
  scheduleSlotInclusionsTable,
  scheduleSlotsTable,
  type DrizzleScheduleSlotInclusion
} from '@/modules/schedule-slot/infrastructure/db/drizzle.schedule-slot.schema';
import { scheduleTimeConfigsTable, type DrizzleScheduleTimeConfig } from '@/modules/schedule-time-config/infrastructure/db/drizzle.schedule-time-config.schema';
import type { IScheduleImportProvider } from '../../domain/providers/schedule-import.provider';

export class ScheduleImportAdapter implements IScheduleImportProvider {
  constructor(private readonly db: DbConnection) {}

  async checkOverwrite(
    organizationId: string,
    input: ImportSchedulesBodyDTO
  ): Promise<ImportSchedulesOverwriteDTO> {
    const sourceSchedules = await this.findSchedulesByYear(
      this.db,
      organizationId,
      input.sourceAcademicYearId
    );
    const sourceConfigs = await this.findTimeConfigsByYear(
      this.db,
      organizationId,
      input.sourceAcademicYearId
    );

    const [targetSchedules, targetConfigs] = await Promise.all([
      this.findMatchingTargetSchedules(
        this.db,
        organizationId,
        input.targetAcademicYearId,
        sourceSchedules
      ),
      this.findMatchingTargetConfigs(
        this.db,
        organizationId,
        input.targetAcademicYearId,
        sourceConfigs
      ),
    ]);

    return {
      schedules: targetSchedules.map((row) => this.scheduleToDTO(row)),
      timeConfigs: targetConfigs.map((row) => this.timeConfigToDTO(row)),
    };
  }

  async importSchedules(
    organizationId: string,
    input: ImportSchedulesBodyDTO
  ): Promise<ImportSchedulesResultDTO> {
    return this.db.transaction(async (tx) => {
      const database = this.asDb(tx);
      const sourceConfigs = await this.findTimeConfigsByYear(
        database,
        organizationId,
        input.sourceAcademicYearId
      );
      const targetConfigMap = await this.upsertTimeConfigs(
        database,
        organizationId,
        input.targetAcademicYearId,
        sourceConfigs
      );

      const sourceSchedules = await this.findSchedulesByYear(
        database,
        organizationId,
        input.sourceAcademicYearId
      );
      const targetSchedules = await this.findMatchingTargetSchedules(
        database,
        organizationId,
        input.targetAcademicYearId,
        sourceSchedules
      );
      const targetByScope = new Map(
        targetSchedules.map((row) => [this.scheduleScopeKey(row), row])
      );

      const sourceScheduleIds = sourceSchedules.map((row) => row.id);
      const sourceSlots =
        sourceScheduleIds.length > 0
          ? await database
              .select()
              .from(scheduleSlotsTable)
              .where(inArray(scheduleSlotsTable.scheduleId, sourceScheduleIds))
          : [];
      const sourceInclusions =
        sourceScheduleIds.length > 0
          ? await database
              .select()
              .from(scheduleSlotInclusionsTable)
              .where(
                inArray(
                  scheduleSlotInclusionsTable.scheduleId,
                  sourceScheduleIds
                )
              )
          : [];

      const targetScheduleIdBySource = new Map<string, string>();
      const slotIdBySource = new Map<string, string>();
      const now = new Date();

      for (const source of sourceSchedules) {
        const existing = targetByScope.get(this.scheduleScopeKey(source));
        const targetId = existing?.id ?? crypto.randomUUID();
        targetScheduleIdBySource.set(source.id, targetId);

        const timeConfigId = source.timeConfigId
          ? (targetConfigMap.get(source.timeConfigId) ??
            (await this.findEffectiveTargetConfigId(
              database,
              organizationId,
              input.targetAcademicYearId,
              source
            )))
          : await this.findEffectiveTargetConfigId(
              database,
              organizationId,
              input.targetAcademicYearId,
              source
            );

        if (existing) {
          await database
            .update(schedulesTable)
            .set({
              timeConfigId,
              isCanonicalCommon: source.isCanonicalCommon,
              status: 'draft',
              conflicts: source.conflicts,
              unassigned: source.unassigned,
              updatedAt: now,
            })
            .where(eq(schedulesTable.id, targetId));

          await database
            .delete(scheduleSlotInclusionsTable)
            .where(eq(scheduleSlotInclusionsTable.scheduleId, targetId));
          await database
            .delete(scheduleSlotsTable)
            .where(eq(scheduleSlotsTable.scheduleId, targetId));
        } else {
          await database.insert(schedulesTable).values({
            id: targetId,
            organizationId,
            degreeId: source.degreeId,
            itineraryId: source.itineraryId,
            academicYearId: input.targetAcademicYearId,
            timeConfigId,
            shift: source.shift,
            courseYear: source.courseYear,
            period: source.period,
            isCanonicalCommon: source.isCanonicalCommon,
            conflicts: source.conflicts,
            unassigned: source.unassigned,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      for (const slot of sourceSlots) {
        const targetScheduleId = targetScheduleIdBySource.get(slot.scheduleId);
        if (!targetScheduleId) continue;
        const targetSlotId = crypto.randomUUID();
        slotIdBySource.set(slot.id, targetSlotId);
        await database.insert(scheduleSlotsTable).values({
          id: targetSlotId,
          scheduleId: targetScheduleId,
          subjectGroupId: slot.subjectGroupId,
          classroomId: slot.classroomId,
          dayOfWeek: slot.dayOfWeek,
          slotIndex: slot.slotIndex,
          duration: slot.duration,
          conflicts: slot.conflicts,
          createdAt: now,
          updatedAt: now,
        });
      }

      const inclusionsToInsert: NewDrizzleScheduleSlotInclusion[] = [];
      for (const inclusion of sourceInclusions) {
        const copied = this.copyInclusion(
          inclusion,
          targetScheduleIdBySource,
          slotIdBySource,
          now
        );
        if (copied) inclusionsToInsert.push(copied);
      }
      if (inclusionsToInsert.length > 0) {
        await database
          .insert(scheduleSlotInclusionsTable)
          .values(inclusionsToInsert);
      }

      const targetScheduleIds = [...targetScheduleIdBySource.values()];
      for (const scheduleId of targetScheduleIds) {
        await this.recalculateMetrics(database, scheduleId);
      }

      const importedSchedules =
        targetScheduleIds.length > 0
          ? await database
              .select()
              .from(schedulesTable)
              .where(inArray(schedulesTable.id, targetScheduleIds))
          : [];
      const importedConfigs = await this.findTimeConfigsByYear(
        database,
        organizationId,
        input.targetAcademicYearId
      );
      const importedConfigIds = new Set(targetConfigMap.values());

      return {
        schedules: importedSchedules.map((row) => this.scheduleToDTO(row)),
        timeConfigs: importedConfigs
          .filter((row) => importedConfigIds.has(row.id))
          .map((row) => this.timeConfigToDTO(row)),
      };
    });
  }

  private asDb(value: unknown): DbConnection {
    return value as DbConnection;
  }

  private async findSchedulesByYear(
    db: DbConnection,
    organizationId: string,
    academicYearId: string
  ) {
    return db
      .select()
      .from(schedulesTable)
      .where(
        and(
          eq(schedulesTable.organizationId, organizationId),
          eq(schedulesTable.academicYearId, academicYearId)
        )
      );
  }

  private async findTimeConfigsByYear(
    db: DbConnection,
    organizationId: string,
    academicYearId: string
  ) {
    return db
      .select()
      .from(scheduleTimeConfigsTable)
      .where(
        and(
          eq(scheduleTimeConfigsTable.organizationId, organizationId),
          eq(scheduleTimeConfigsTable.academicYearId, academicYearId)
        )
      );
  }

  private async findMatchingTargetSchedules(
    db: DbConnection,
    organizationId: string,
    targetAcademicYearId: string,
    sourceSchedules: DrizzleSchedule[]
  ) {
    const result: DrizzleSchedule[] = [];
    for (const source of sourceSchedules) {
      const found = await this.findScheduleByScope(
        db,
        organizationId,
        targetAcademicYearId,
        source
      );
      if (found && !result.some((row) => row.id === found.id)) {
        result.push(found);
      }
    }
    return result;
  }

  private async findMatchingTargetConfigs(
    db: DbConnection,
    organizationId: string,
    targetAcademicYearId: string,
    sourceConfigs: DrizzleScheduleTimeConfig[]
  ) {
    const result: DrizzleScheduleTimeConfig[] = [];
    for (const source of sourceConfigs) {
      const found = await this.findTimeConfigByScope(
        db,
        organizationId,
        targetAcademicYearId,
        source
      );
      if (found && !result.some((row) => row.id === found.id)) {
        result.push(found);
      }
    }
    return result;
  }

  private async upsertTimeConfigs(
    db: DbConnection,
    organizationId: string,
    targetAcademicYearId: string,
    sourceConfigs: DrizzleScheduleTimeConfig[]
  ) {
    const sourceToTarget = new Map<string, string>();
    for (const source of sourceConfigs) {
      const existing = await this.findTimeConfigByScope(
        db,
        organizationId,
        targetAcademicYearId,
        source
      );
      const now = new Date();
      if (existing) {
        await db
          .update(scheduleTimeConfigsTable)
          .set({
            startTime: this.trimTime(source.startTime),
            endTime: this.trimTime(source.endTime),
            hasBreak: source.hasBreak,
            breakAfterSlot: source.breakAfterSlot,
            updatedAt: now,
          })
          .where(eq(scheduleTimeConfigsTable.id, existing.id));
        sourceToTarget.set(source.id, existing.id);
      } else {
        const targetId = crypto.randomUUID();
        await db.insert(scheduleTimeConfigsTable).values({
          id: targetId,
          organizationId,
          academicYearId: targetAcademicYearId,
          degreeId: source.degreeId,
          itineraryId: source.itineraryId,
          courseYear: source.courseYear,
          period: source.period,
          shift: source.shift,
          startTime: this.trimTime(source.startTime),
          endTime: this.trimTime(source.endTime),
          hasBreak: source.hasBreak,
          breakAfterSlot: source.breakAfterSlot,
          createdAt: now,
          updatedAt: now,
        });
        sourceToTarget.set(source.id, targetId);
      }
    }
    return sourceToTarget;
  }

  private async findScheduleByScope(
    db: DbConnection,
    organizationId: string,
    academicYearId: string,
    scope: Pick<
      DrizzleSchedule,
      'degreeId' | 'itineraryId' | 'courseYear' | 'period' | 'shift'
    >
  ) {
    const conditions = [
      eq(schedulesTable.organizationId, organizationId),
      eq(schedulesTable.academicYearId, academicYearId),
      eq(schedulesTable.degreeId, scope.degreeId),
      eq(schedulesTable.courseYear, scope.courseYear),
      eq(schedulesTable.period, scope.period),
      eq(schedulesTable.shift, scope.shift),
    ];
    conditions.push(
      scope.itineraryId
        ? eq(schedulesTable.itineraryId, scope.itineraryId)
        : isNull(schedulesTable.itineraryId)
    );

    const [row] = await db
      .select()
      .from(schedulesTable)
      .where(and(...conditions))
      .limit(1);
    return row ?? null;
  }

  private async findTimeConfigByScope(
    db: DbConnection,
    organizationId: string,
    academicYearId: string,
    scope: Pick<
      DrizzleScheduleTimeConfig,
      'degreeId' | 'itineraryId' | 'courseYear' | 'period' | 'shift'
    >
  ) {
    const conditions = [
      eq(scheduleTimeConfigsTable.organizationId, organizationId),
      eq(scheduleTimeConfigsTable.academicYearId, academicYearId),
      eq(scheduleTimeConfigsTable.degreeId, scope.degreeId),
      eq(scheduleTimeConfigsTable.courseYear, scope.courseYear),
      eq(scheduleTimeConfigsTable.period, scope.period),
      eq(scheduleTimeConfigsTable.shift, scope.shift),
    ];
    conditions.push(
      scope.itineraryId
        ? eq(scheduleTimeConfigsTable.itineraryId, scope.itineraryId)
        : isNull(scheduleTimeConfigsTable.itineraryId)
    );

    const [row] = await db
      .select()
      .from(scheduleTimeConfigsTable)
      .where(and(...conditions))
      .limit(1);
    return row ?? null;
  }

  private async findEffectiveTargetConfigId(
    db: DbConnection,
    organizationId: string,
    academicYearId: string,
    schedule: DrizzleSchedule
  ) {
    if (schedule.itineraryId) {
      const specific = await this.findTimeConfigByScope(
        db,
        organizationId,
        academicYearId,
        schedule
      );
      if (specific) return specific.id;
    }
    const base = await this.findTimeConfigByScope(
      db,
      organizationId,
      academicYearId,
      {
        ...schedule,
        itineraryId: null,
      }
    );
    return base?.id ?? null;
  }

  private copyInclusion(
    inclusion: DrizzleScheduleSlotInclusion,
    targetScheduleIdBySource: Map<string, string>,
    slotIdBySource: Map<string, string>,
    now: Date
  ): NewDrizzleScheduleSlotInclusion | null {
    const targetScheduleId = targetScheduleIdBySource.get(inclusion.scheduleId);
    const targetSlotId = slotIdBySource.get(inclusion.slotId);
    if (!targetScheduleId || !targetSlotId) return null;

    return {
      id: crypto.randomUUID(),
      scheduleId: targetScheduleId,
      slotId: targetSlotId,
      conflicts: inclusion.conflicts,
      createdAt: now,
      updatedAt: now,
    };
  }

  private async recalculateMetrics(db: DbConnection, scheduleId: string) {
    const slots = await db
      .select()
      .from(scheduleSlotsTable)
      .where(eq(scheduleSlotsTable.scheduleId, scheduleId));
    const inclusions = await db
      .select({
        conflicts: scheduleSlotInclusionsTable.conflicts,
        classroomId: scheduleSlotsTable.classroomId,
        dayOfWeek: scheduleSlotsTable.dayOfWeek,
        slotIndex: scheduleSlotsTable.slotIndex,
      })
      .from(scheduleSlotInclusionsTable)
      .innerJoin(
        scheduleSlotsTable,
        eq(scheduleSlotInclusionsTable.slotId, scheduleSlotsTable.id)
      )
      .where(eq(scheduleSlotInclusionsTable.scheduleId, scheduleId));

    const ownConflicts = slots.flatMap((slot) => slot.conflicts ?? []);
    const includedConflicts = inclusions.flatMap(
      (inclusion) => inclusion.conflicts ?? []
    );
    const conflicts = [...ownConflicts, ...includedConflicts].filter(
      (conflict) => !conflict.type.startsWith('UNASSIGNED')
    ).length;
    const unassigned =
      slots.filter(
        (slot) =>
          !slot.classroomId ||
          slot.dayOfWeek === null ||
          slot.slotIndex === null
      ).length +
      inclusions.filter(
        (inclusion) =>
          !inclusion.classroomId ||
          inclusion.dayOfWeek === null ||
          inclusion.slotIndex === null
      ).length;

    await db
      .update(schedulesTable)
      .set({ conflicts, unassigned, updatedAt: new Date() })
      .where(eq(schedulesTable.id, scheduleId));
  }

  private scheduleScopeKey(schedule: DrizzleSchedule) {
    return [
      schedule.degreeId,
      schedule.itineraryId ?? 'common',
      schedule.courseYear,
      schedule.period,
      schedule.shift,
    ].join(':');
  }

  private trimTime(value: string) {
    return value.slice(0, 5);
  }

  private scheduleToDTO(row: DrizzleSchedule): ScheduleDTO {
    return {
      id: row.id,
      organizationId: row.organizationId,
      degreeId: row.degreeId,
      itineraryId: row.itineraryId ?? undefined,
      academicYearId: row.academicYearId,
      timeConfigId: row.timeConfigId ?? undefined,
      shift: row.shift,
      courseYear: row.courseYear,
      period: row.period,
      conflicts: row.conflicts,
      unassigned: row.unassigned,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private timeConfigToDTO(row: DrizzleScheduleTimeConfig): ScheduleTimeConfigDTO {
    return {
      id: row.id,
      organizationId: row.organizationId,
      academicYearId: row.academicYearId,
      degreeId: row.degreeId,
      itineraryId: row.itineraryId,
      courseYear: row.courseYear,
      period: row.period,
      shift: row.shift,
      startTime: this.trimTime(row.startTime),
      endTime: this.trimTime(row.endTime),
      hasBreak: row.hasBreak,
      breakAfterSlot: row.breakAfterSlot,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
