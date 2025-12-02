<!-- Copilot/AI agent instructions for contributors and AI assistants -->
# Copilot Instructions — voyazen-app-backend

This project is a TypeScript Node/Express backend using MongoDB, Kafka, Redis and several third-party services. The goal of these instructions is to help AI coding agents be immediately productive by documenting the repository's architecture, conventions, and common developer workflows.

- **Repo entry points:** `src/server.ts` (boot, DB connect, Kafka & workers, sockets) and `src/app.ts` (Express app setup, routing, global middleware).
- **Primary structure:** source files under `src/` with feature modules in `src/modules/<feature>/` (each module typically has `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.model.ts`, `*.validation.ts`).
- **Routing:** Composite router exported from `src/routes/index.ts` and mounted at `/api/v1` in `src/app.ts`.

- **Error handling:** Use `errors/ApiError.ts` and centralized `app/middlewares/globalErrorHandler.ts`. Zod validation errors are handled by `errors/handleZodError.ts` (validation middleware found at `app/middlewares/validateRequest.ts`).
- **Async controllers:** Wrap controller logic with `shared/catchAsync.ts` where appropriate.
- **Response helper:** Use `shared/sendResponse.ts` to return standardized responses across controllers.

- **File uploads:** Multer-based handler in `app/middlewares/fileUploadHandler.ts` and `uploads/` is used for serving static files (`app.use(express.static('uploads'))`). Remove files via `shared/unlinkFile.ts` when needed.

- **Utilities & helpers:** Look in `src/helpers/` for domain helpers (e.g., `jwtHelper.ts`, `socketHelper.ts`, `translateHelper.ts`). Search `src/helpers` when adding cross-cutting logic.

- **Data layer & queries:** Mongoose models live in `src/modules/*/*.model.ts`. A `QueryBuilder` exists at `src/app/builder/QueryBuilder.ts` — prefer it for consistent query behavior when present.

- **Background and messaging:** Kafka producers/consumers are in `src/handlers/kafka.*` and `src/handlers/` — `src/worker/index.ts` starts background tasks. `src/server.ts` boots consumers and the worker; be careful modifying startup sequencing.

- **External integrations:** Configs are under `src/config/` (e.g., `redis.client.ts`, `kafka.config.ts`, `elasticSearch.config.ts`, `chatbot.config.ts`). When changing integration behavior, update the corresponding file in `src/config`.

- **Translation & AI libs:** Multiple translation utilities are used (`@iamtraction/google-translate`, `@vitalets/google-translate-api`, `libretranslate`, etc.). `src/helpers/translateHelper.ts` aggregates translation logic — inspect it before adding another translation provider.

- **Logging:** Winston + `winston-daily-rotate-file` plus request logging via `shared/morgen`. Use `shared/logger.ts` and `shared/morgen.ts` for consistent logs.

- **Common change patterns:**
  - To add a new feature: create `src/modules/<name>/{<name>.route.ts,<name>.controller.ts,<name>.service.ts,<name>.model.ts,<name>.validation.ts}` and export the router via `src/routes/index.ts`.
  - Validation: create a Zod schema in `<name>.validation.ts` and use `app/middlewares/validateRequest.ts` in the route.
  - Controllers: return responses via `sendResponse` and throw `ApiError` for failures.

- **Dev/run commands:**
  - Start dev server: `npm run dev` (runs `ts-node-dev --respawn --transpile-only src/server.ts`).
  - Lint check: `npm run lint:check`; fix formatting with `npm run prettier:fix`.
  - Containerized / services: `docker-compose.yaml` is present; prefer `docker-compose up` when testing service integration (DB, Kafka, Redis).

- **Conventions & patterns to preserve:**
  - Keep middleware small and reusable (see `app/middlewares/`).
  - Prefer `shared/*` helpers for cross-cutting concerns (logging, response formatting, file unlinking).
  - Use the existing seed pattern: `DB/seedAdmin.ts` is invoked on startup (`src/server.ts`).

- **Where to look for examples:**
  - Auth module: `src/modules/auth/` shows routes, controller, service, and validation patterns.
  - Chatbot module: `src/modules/chatbot/` demonstrates integration with 3rd-party AI/translation code.

- **When changing startup or integration code:** update `src/server.ts` and ensure consumers/workers are started/shutdown correctly (look at `SIGTERM` and `unhandledRejection` handlers in that file).

- **Notes for code generation:**
  - Prefer small, targeted changes. Keep public APIs and file locations stable.
  - If adding a new dependency, check `package.json` and add to dependencies; update README if it affects setup.

If anything here is incorrect or you want more detail about a subarea (Kafka, Elasticsearch, Socket.IO, translation), tell me which area and I'll expand or add examples. — Thanks!
