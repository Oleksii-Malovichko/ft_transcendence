_This project has been created as part of the 42 curriculum by <login1>, <login2>, <login3>, <login4>._

# ft_transcendence

<!--
  README skeleton (sprint 1). Every section below is required by the subject
  (chapter VI, "Readme Requirements"). Each member fills in their part as the
  work lands; TODO(ME-x) says who. ME-4 reviews the whole file before the
  evaluation. English only. Remove these comments once a section is done.
-->

## Description

<!-- Project name, goal, a brief overview, and the key features. -->

**ft_transcendence** is a web platform for playing Pong: against a friend on the
same keyboard, against another player online, against an AI, or in a tournament.
TODO(ME-4): final project name, goal and overview in a few sentences.

**Key features:** TODO(all): one line each, taken from the Features List below.

## Instructions

### Prerequisites

- Docker with Docker Compose v2, GNU make and OpenSSL
- For development only: Node.js 24 LTS and pnpm 10 (`corepack enable` installs the right pnpm)

### Run the project

```bash
git clone <repository-url> ft_transcendence
cd ft_transcendence
make
```

On the first run, `make` creates `.env` from `.env.example` (with a random JWT
secret), builds the images and starts everything. Then open
**https://localhost:8443** and accept the self-signed certificate once. All
settings (database credentials, ports, secrets) live in `.env`, and every
variable is explained in `.env.example`.

Other commands: `make down` (stop), `make logs`, `make ps`, and `make re` (start
from scratch, **deletes all data**).

### Development

TODO(ME-1): `make db` + `pnpm dev`, running the tests and the linter.

## Resources

### References

- TODO(all): documentation, articles and tutorials you actually used, one line each, with a link.

### Use of AI

TODO(all): for which tasks and which parts of the project AI was used, and how
its output was checked. Be specific and honest: the subject requires it.

## Team Information

| Member | Login   | Role(s)                        | Responsibilities                                                             |
| ------ | ------- | ------------------------------ | ---------------------------------------------------------------------------- |
| ME-1   | <login> | Tech Lead / Architect          | Architecture, infrastructure (Docker, HTTPS), framework and ORM modules      |
| ME-2   | <login> | Product Owner                  | Product priorities, user management and OAuth modules, legal pages           |
| ME-3   | <login> | Developer (game lead)          | Pong engine, remote players, real-time communication                         |
| ME-4   | <login> | Project Manager / Scrum Master | Planning and sprints, AI opponent, tournament and game customization modules |

## Project Management

- **Organization:** TODO(ME-4): sprints, meetings, and how tasks were split (each member owns whole modules).
- **Tools:** TODO(ME-4): GitHub Issues and pull requests (templates in `.github/`, rules in `CONTRIBUTING.md`).
- **Communication:** TODO(ME-4): e.g. Discord or Slack.

## Technical Stack

- **Frontend:** Next.js (React) with TypeScript and Tailwind CSS. TODO(ME-1): why.
- **Backend:** NestJS with TypeScript, Socket.IO for real time. TODO(ME-1): why.
- **Database:** PostgreSQL through the Prisma ORM. TODO(ME-1): why this database.
- **Other:** nginx (HTTPS reverse proxy), Docker Compose, zod (validation shared by the frontend and the backend), Argon2id (password hashing), Vitest (tests).
- **Major technical choices:** TODO(ME-1): monorepo with a shared `@ft/core` package; server-authoritative game engine.

## Database Schema

TODO(ME-1): a diagram (e.g. Mermaid), the tables and their relationships, key fields and data types.

## Features List

| Feature | Member(s) | Description |
| ------- | --------- | ----------- |
| TODO    |           |             |

## Modules

| Module (as named in the subject)                                            | Type  | Points | Member(s) | Justification and implementation |
| --------------------------------------------------------------------------- | ----- | -----: | --------- | -------------------------------- |
| Use a framework for both the frontend and backend                           | Major |      2 | ME-1      | TODO                             |
| Use an ORM for the database                                                 | Minor |      1 | ME-1      | TODO                             |
| Standard user management and authentication                                 | Major |      2 | ME-2      | TODO                             |
| Implement remote authentication with OAuth 2.0 (42)                         | Minor |      1 | ME-2      | TODO                             |
| Implement a complete web-based game where users can play against each other | Major |      2 | ME-3      | TODO                             |
| Remote players                                                              | Major |      2 | ME-3      | TODO                             |
| Introduce an AI Opponent for games                                          | Major |      2 | ME-4      | TODO                             |
| Implement a tournament system                                               | Minor |      1 | ME-4      | TODO                             |
| Game customization options                                                  | Minor |      1 | ME-4      | TODO                             |
| **Total (14 required)**                                                     |       | **14** |           |                                  |

Safety margin, in case a module is not accepted during the evaluation:

| Module (as named in the subject)                                    | Type  | Points | Member(s) | Justification and implementation |
| ------------------------------------------------------------------- | ----- | -----: | --------- | -------------------------------- |
| Implement real-time features using WebSockets or similar technology | Major |      2 | ME-3      | TODO                             |

## Individual Contributions

<!-- For each member: what you built, and the challenges you met and how you overcame them. -->

### ME-1 (<login>)

TODO

### ME-2 (<login>)

TODO

### ME-3 (<login>)

TODO

### ME-4 (<login>)

TODO

## Known limitations

TODO
