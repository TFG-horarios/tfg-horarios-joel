export interface TabuMove {
  assignmentId: string;
  attribute: 'room' | 'time' | 'both';
  forbiddenValue: string | number;
  expiresAtIteration: number;
}

export type MoveAttribute = TabuMove['attribute'];

export class TabuList {
  private readonly moves: TabuMove[] = [];

  public expire(currentIteration: number) {
    for (let i = this.moves.length - 1; i >= 0; i--) {
      if (this.moves[i]!.expiresAtIteration <= currentIteration) {
        this.moves.splice(i, 1);
      }
    }
  }

  public add(move: TabuMove) {
    this.moves.push(move);
  }

  public contains(move: Omit<TabuMove, 'expiresAtIteration'>) {
    return this.moves.some((tabuMove) => {
      if (tabuMove.assignmentId !== move.assignmentId) return false;
      if (tabuMove.attribute === 'time' && move.attribute === 'time') {
        return tabuMove.forbiddenValue === move.forbiddenValue;
      }
      if (tabuMove.attribute === 'room' && move.attribute === 'room') {
        return tabuMove.forbiddenValue === move.forbiddenValue;
      }
      if (tabuMove.attribute === 'both' && move.attribute === 'both') {
        return tabuMove.forbiddenValue === move.forbiddenValue;
      }
      return false;
    });
  }
}
