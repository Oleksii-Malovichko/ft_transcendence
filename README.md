_This project has been created as part of the 42 curriculum by a four-person team._

# ft_transcendence

## Description

**ft_transcendence** is a web platform for playing Pong: against a friend on the same keyboard, against an AI, against another player over the network, or in a knock-out tournament. It is a single-page application served over HTTPS, with accounts, profiles and a match history, and it runs with one command.

The game itself does not run in the browser. The browser sends key presses and draws pictures; the server runs the rules sixty times a second and tells both players what happened. That one decision shapes the whole project: nobody can win by editing JavaScript, and two players always see the same ball.

**Key features**

- Pong in the browser: two players on one keyboard, or one player against an AI with three difficulty levels.
- Online games between two accounts, with matchmaking, a pause when somebody loses their connection, and a forfeit if they do not come back.
- Knock-out tournaments for 4 or 8 players, with aliases, a drawn bracket, and results the server records itself when a bracket match is played.
- Accounts with email and password or with 42, display names, avatars, and a match history with wins and losses.
- Customisable games: ball speed, paddle size, points to win, bonuses on the field, and two themes.

## Instructions

### Prerequisites

- Docker with Docker Compose v2, GNU make and OpenSSL
- For development only: Node.js 24 LTS and pnpm 10 (`corepack enable` installs the right pnpm)
