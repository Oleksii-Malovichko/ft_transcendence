import type { MatchSummary } from "@ft/core";

export function MatchHistory({ matches }: { matches: readonly MatchSummary[] }) {
  if (matches.length === 0) {
    return <p className="text-muted">No games yet.</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-muted">
        <tr>
          <th className="py-1">Date</th>
          <th>Mode</th>
          <th>Opponent</th>
          <th>Score</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((match) => (
          <tr key={match.id} className="border-t border-edge">
            <td className="py-1">{match.playedAt.slice(0, 10)}</td>
            <td>{match.mode}</td>
            <td>{match.opponent}</td>
            <td className="tabular-nums">
              {match.yourScore} – {match.theirScore}
            </td>
            <td className={match.won ? "text-accent" : "text-muted"}>
              {match.won ? "Won" : "Lost"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}