import type {
  IScheduleConstraint,
  ConstraintContext,
} from './constraint.interface';

export class ItineraryOverlapConstraint implements IScheduleConstraint {
  calculatePenalty(context: ConstraintContext): number {
    let penalty = 0;

    for (const timeSlotsForDegree of context.degreeGroups.values()) {
      for (const classesAtThisTime of timeSlotsForDegree.values()) {
        const commonTheoryIds = new Set<string>();
        const itineraryTheoryIds = new Map<string, Set<string>>();

        for (const assignment of classesAtThisTime) {
          if (assignment.groupType === 'theory') {
            if (assignment.isCommon) {
              commonTheoryIds.add(assignment.subjectGroupId);
            } else if (assignment.itineraryName) {
              if (!itineraryTheoryIds.has(assignment.itineraryName)) {
                itineraryTheoryIds.set(assignment.itineraryName, new Set());
              }
              itineraryTheoryIds
                .get(assignment.itineraryName)!
                .add(assignment.subjectGroupId);
            }
          }
        }

        for (const assignment of classesAtThisTime) {
          if (commonTheoryIds.size > 0) {
            // CONSTRAINT 6: No more than one common class at a time. No other class can be taught.
            if (
              commonTheoryIds.size > 1 ||
              !commonTheoryIds.has(assignment.subjectGroupId)
            ) {
              penalty += 1000;
            }
          } else {
            // CONSTRAINT 7: No more than one theory class of the same itinerary at a time.
            if (assignment.groupType === 'theory' && assignment.itineraryName) {
              const theoriesForMyItin = itineraryTheoryIds.get(
                assignment.itineraryName
              )!;
              if (theoriesForMyItin.size > 1) penalty += 1000;
            }
            // CONSTRAINT 8: Practical classes cannot overlap with common theory or their own itinerary theory.
            else if (assignment.groupType !== 'theory') {
              if (assignment.isCommon && itineraryTheoryIds.size > 0) {
                penalty += 1000;
              } else if (
                assignment.itineraryName &&
                itineraryTheoryIds.has(assignment.itineraryName)
              ) {
                penalty += 1000;
              }
            }
          }
        }
      }
    }

    return penalty;
  }
}
