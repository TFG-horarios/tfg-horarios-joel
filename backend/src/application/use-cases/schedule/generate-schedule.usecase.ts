import { GenerateScheduleRequestDTO } from '@tfg-horarios/shared';
import { TabuSearchEngine } from '../../../domain/solver/tabu-search';
import { InitialSolution, GroupInitialData } from '../../../domain/solver/initial-solution';
import { PenaltyCalculator } from '../../../domain/solver/penalty-calculator';
import { calculateTotalSlots, slotToTime, ShiftConfig } from '../../../domain/solver/time.utils';
import { ClassroomMap } from '../../../domain/solver/types';

import { db } from '../../../infrastructure/db/connection'; 
import { organization, classroom, schedule, scheduleEntry } from '../../../infrastructure/db/schema';
import { eq } from 'drizzle-orm';

export class GenerateScheduleUseCase {
  
  public async execute(request: GenerateScheduleRequestDTO): Promise<string> {
    // 1. Obtener datos de la organización y turnos
    const org = await db.select().from(organization).where(eq(organization.id, request.organizationId)).limit(1).then(res => res[0]);
    if (!org) throw new Error('Organization not found');

    // Configurar los tiempos usando tu utilidad
    const shiftConfig: ShiftConfig = {
      startTime: request.shift === 'morning' ? org.morningStart : org.afternoonStart,
      endTime: request.shift === 'morning' ? org.morningEnd : org.afternoonEnd,
      slotDurationMinutes: org.slotDurationMinutes
    };

    const maxSlotsPerDay = calculateTotalSlots(shiftConfig);
    // Asumimos que el límite mañana/tarde es la mitad o lo calculas según tu lógica
    const maxMorningSlots = calculateTotalSlots({ startTime: org.morningStart, endTime: org.morningEnd, slotDurationMinutes: org.slotDurationMinutes });

    // 2. Obtener todas las aulas disponibles y crear el ClassroomMap para el evaluador
    const availableClassrooms = await db.select().from(classroom).where(eq(classroom.organizationId, org.id));
    const classroomIds = availableClassrooms.map(c => c.id);
    
    const classroomsCache: ClassroomMap = {};
    availableClassrooms.forEach(c => {
      classroomsCache[c.id] = { capacity: c.capacity };
    });

    // 3. Obtener los grupos de asignaturas que coincidan con la petición del DTO
    // (Filtramos por Curso, Periodo y Turno)
    // const groupsToAssign = await db.select().from(subjectGroup)
      // .innerJoin(subjects, eq(subjectGroups.subjectId, subjects.id)) -> Asegúrate de traer isCommon, itineraryName, etc.
      // Aquí asumo que construyes tu array de GroupInitialData mapeando los resultados de Drizzle
      // .where(...) 

    // MOCK: Suponemos que ya tienes el array `domainGroups` mapeado desde Drizzle
    const domainGroups: GroupInitialData[] = [
      /* datos mapeados de la DB */
    ];

    if (domainGroups.length === 0) throw new Error('There are no groups to assign for the given criteria');

    // Instanciamos el cerebro
    const penaltyCalculator = new PenaltyCalculator(classroomsCache, maxMorningSlots);
    const initialSolutionGen = new InitialSolution(penaltyCalculator, classroomIds, maxSlotsPerDay);
    const tabuEngine = new TabuSearchEngine(penaltyCalculator, initialSolutionGen, classroomIds, maxSlotsPerDay);

    // ¡Arrancamos la IA!
    const bestSolution = tabuEngine.run(domainGroups);

    console.log(`GENERATION COMPLETE. Final Penalty: ${bestSolution.penalty}`);

    // 1. Crear la cabecera del horario en la base de datos
    const [newSchedule] = await db.insert(schedule).values({
      organizationId: org.id,
      academicYear: request.academicYear,
      shift: request.shift,
      courseYear: request.courseYear,
      period: request.period,
      status: 'draft',
      version: 'v1.0'
    }).returning({ id: schedule.id });

    // 2. Traducir el resultado matemático a horas reales usando `time.utils.ts`
    const entriesToInsert = bestSolution.assignments.map(assignment => {
      
      const realStartTime = slotToTime(assignment.startSlot, shiftConfig);
      const realEndTime = slotToTime(assignment.startSlot + 1, shiftConfig); // 1 slot después

      return {
        scheduleId: newSchedule.id,
        subjectGroupId: assignment.subjectGroupId,
        classroomId: assignment.classroomId,
        dayOfWeek: assignment.dayOfWeek,
        startTime: realStartTime,
        endTime: realEndTime
      };
    });

    // 3. Guardar todas las clases generadas en bloque (Bulk Insert)
    if (entriesToInsert.length > 0) {
      await db.insert(scheduleEntry).values(entriesToInsert);
    }

    return newSchedule.id;
  }
}