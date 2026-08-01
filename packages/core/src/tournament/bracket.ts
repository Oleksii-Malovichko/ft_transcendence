export const TOURNAMENT_SIZES = [4, 8] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

export interface BracketMatch {
  /** 0 is the first round; the last round is the final. */
  round: number;
  /** Position within the round, 0-based. */
  slot: number;
  /** The two aliases; null while the round before has not finished. */
  players: [string | null, string | null];
  winner: string | null;
}

/** Seat numbers in random order (Fisher–Yates), for the draw. */
export function drawSeats(size: number, random: () => number = Math.random): number[] {
  const seats = Array.from({ length: size }, (_, index) => index);
  for (let index = seats.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [seats[index], seats[other]] = [seats[other]!, seats[index]!];
  }
  return seats;
}

/** The empty bracket for players listed by seat: seats 0 and 1 meet first. */
export function buildBracket(aliasesBySeat: readonly (string | null)[]): BracketMatch[] {
  const matches: BracketMatch[] = [];
  for (let slot = 0; slot < aliasesBySeat.length / 2; slot++) {
    matches.push({
      round: 0,
      slot,
      players: [aliasesBySeat[slot * 2] ?? null, aliasesBySeat[slot * 2 + 1] ?? null],
      winner: null,
    });
  }
  for (let count = aliasesBySeat.length / 4, round = 1; count >= 1; count /= 2, round++) {
    for (let slot = 0; slot < count; slot++) {
      matches.push({ round, slot, players: [null, null], winner: null });
    }
  }
  return matches;
}

/** The same bracket with one result recorded, and the winner moved up. */
export function reportWinner(
  bracket: readonly BracketMatch[],
  round: number,
  slot: number,
  winner: string,
): BracketMatch[] {
  const nextSlot = Math.floor(slot / 2);
  const seat = slot % 2;
  return bracket.map((match) => {
    if (match.round === round && match.slot === slot) return { ...match, winner };
    if (match.round === round + 1 && match.slot === nextSlot) {
      const players: [string | null, string | null] = [...match.players];
      players[seat] = winner;
      return { ...match, players };
    }
    return match;
  });
}

/** The match that should be played now: the first one with two players and no result. */
export function nextMatch(bracket: readonly BracketMatch[]): BracketMatch | null {
  return (
    bracket.find(
      (match) => match.winner === null && match.players[0] !== null && match.players[1] !== null,
    ) ?? null
  );
}

/** The winner of the final, once it has been played. */
export function championOf(bracket: readonly BracketMatch[]): string | null {
  return bracket[bracket.length - 1]?.winner ?? null;
}
