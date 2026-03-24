# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── startup-office/     # Living AI Startup Office (React + Vite + Three.js)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/startup-office` (`@workspace/startup-office`)

**Living AI Startup Office** — a 3D virtual startup office simulation.

- React + Vite + Tailwind CSS frontend
- 3D office scene built with React Three Fiber + Drei
- 5 AI agent employees with animated behavior (CTO, CFO, Marketing Head, PM, Analyst)
- Click-to-chat with any agent (powered by Claude API)
- Session-based multi-tenant architecture (sessionId stored in localStorage)
- Setup page for Claude API key configuration
- Key dependencies: `@react-three/fiber`, `@react-three/drei`, `three`, `framer-motion`, `uuid`

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with:
- `/api/auth/setup` — validate and store Claude API key (encrypted in memory, per sessionId)
- `/api/auth/status?sessionId=...` — check if API key is configured
- `/api/agents` — list all 5 AI agents with positions and statuses
- `/api/agents/:agentId/state` — update agent state (status, position)
- `/api/chat/:agentId` — send/get/clear conversation with an agent (uses Claude API)

Agent data and conversation history are stored in-memory. Each user is isolated by sessionId.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Currently no schema tables (data stored in memory).

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec for the startup office API. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package.

## Security Notes

- Claude API keys are encrypted with AES-256-CBC before in-memory storage
- Keys are never exposed to the frontend
- All Claude API calls are made server-side
- Each user session is isolated by sessionId

## Future Extensions

- Persist agent state and conversation history in PostgreSQL
- Add more agent roles and office areas
- Voice interaction
- Multi-agent collaboration tasks
- Real business integrations
