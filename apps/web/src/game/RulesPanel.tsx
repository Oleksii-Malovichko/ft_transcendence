import { RULES } from "@ft/core";
import { Card } from "@/components/ui/Card";

export function RulesPanel() {
  return (
    <Card title="How it works">
      <ul className="list-disc space-y-1 pl-5">
        <li>First to {RULES.scoreLimit} points wins the game.</li>
        <li>
          There is a {RULES.serveDelay}-second pause before each serve, and the ball is served
          towards whoever just lost the point.
        </li>
        <li>
          Where the ball hits your paddle decides where it goes: the middle sends it straight back,
          the edges send it off at an angle. Every hit makes it a little faster.
        </li>
        <li>
          Online, the game runs on the server: both players see the same ball, and closing the tab
          ends the game.
        </li>
      </ul>
    </Card>
  );
}