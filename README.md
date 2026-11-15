# PieCanvas

## Overview
PieCanvas is a full-stack workflow studio that lets users build, save, load, validate, and execute directed pipelines using a drag-and-drop node editor.
Its responsive landing page introduces the product and links directly to the React Flow canvas. The Spring Boot backend provides DAG validation, pipeline persistence with an H2 in-memory database, and a simulated execution engine.

## Architecture Diagram
<img width="3463" height="6510" alt="diagram (1)" src="https://github.com/user-attachments/assets/fc0b7e90-990f-418e-b356-fcfe39411b15" />


## What’s Included
- Drag-and-drop pipeline building interface
- Responsive PieCanvas landing page with direct access to the editor
- Save/load pipeline persistence with Spring Data JPA + H2
- Backend DAG validation and topological execution order
- Upstream-aware execution with condition branches and persistent run/step history
- Flow Doctor validation, test cases, and explicitly heuristic estimates
- Toolbar actions for Save, Load, and Execute
- React tests for replay, Doctor fixes, and failed test output
- JUnit + MockMvc coverage for execution, validation, tests, and estimates

## Architecture
### Frontend
- React 18 + React Flow
- Zustand for state management
- Custom node components: Input, Output, Text, LLM, Timer, Condition, API, Database, Webhook
- Dark canvas workspace with run replay, Flow Doctor, Tests, and Estimate panels

### Backend
- Spring Boot 3.2.4
- Java 17
- Spring Data JPA + H2 database
- REST endpoints for pipeline parsing, saving, loading, and executing
- Execution engine walks nodes in topological order, records each step, and skips untaken condition branches
- Run, run-step, test-case, and test-result JPA entities use portable scalar IDs and text JSON fields

## Supported Node Types
- `customInput` — Input data source
- `customOutput` — Output sink
- `text` — Static / dynamic text processing
- `llm` — Simulated OpenAI-style response node
- `timer` — Delay / scheduled trigger
- `condition` — Branching / decision node
- `api` — External API request stub
- `database` — Database action stub
- `webhook` — Webhook trigger stub

## API Endpoints
### `POST /pipelines/parse`
Validates the pipeline JSON and returns DAG metadata.
- Request form data: `pipeline=<json>`
- Response includes:
  - `is_dag`
  - `execution_order`
  - `num_nodes`
  - `num_edges`

### `POST /pipelines/save`
Saves a pipeline to the H2 database.
- Request form data: `pipeline=<json>`
- Response includes saved `id`

### `GET /pipelines`
Returns all saved pipelines from the database.

### `GET /pipelines/{id}`
Loads a saved pipeline by ID.
- Response includes `nodes` and `edges`

### `POST /pipelines/execute`
Validates and executes a pipeline, returning the additive `runId` and compatibility `logs`.
- Request form data: `pipeline=<json>`
- An optional `pipelineId` associates run history with a saved pipeline
- `GET /runs/{runId}` returns the complete run and ordered steps; `GET /pipelines/{id}/runs` returns summaries

### `POST /pipelines/validate`
Accepts the pipeline graph as JSON and returns a score plus validation issues. Fixes are descriptors only; the server does not mutate the graph.

### Test cases
- `GET|POST /pipelines/{id}/tests`
- `PUT|DELETE /pipelines/{id}/tests/{testId}`
- `POST /pipelines/{id}/tests/run` executes each case against the saved graph
- `POST /pipelines/{id}/tests/from-run/{runId}` creates output assertions from a run

Assertions supported: `outputEquals`, `outputContains`, `branchTaken`, `noError`, and `maxDurationMs`.

### `POST /pipelines/estimate`
Accepts a pipeline graph as JSON and returns per-node and total estimates. The response includes `isEstimate: true`; latency uses configurable node-type baselines and prompt token estimates use prompt length divided by four. These values are not measured runtime.

### Authentication
- `POST /auth/register` — accepts JSON `{ "name": "...", "email": "...", "password": "..." }`; name is required and passwords must be at least 8 characters. Creates an account and starts a session.
- `POST /auth/login` — accepts the same JSON credentials and starts a session for an existing account.
- `GET /auth/me` — returns the account for the current session.

Passwords are stored as PBKDF2 hashes. The browser session uses a credentialed cookie; the API currently allows the frontend origin `http://localhost:3000`.

## Running the Project
### Frontend
```bash
cd Frontend
npm install
npm start
```
Open `http://localhost:3000` in your browser.

### Backend
```bash
cd Backend-Java
.\mvnw.cmd spring-boot:run
```
The server listens on `http://localhost:8080`.

## Testing
### Backend
Run the Spring Boot tests:
```bash
cd Backend-Java
.\mvnw.cmd test
```
A dedicated integration test covers `/pipelines/execute`.
MockMvc tests additionally cover run recording and skipped branches, validation fixes, test CRUD/execution/from-run, and estimate labeling.

### Frontend
Run the React test suite:
```bash
cd Frontend
npm test -- --watchAll=false
```
A toolbar rendering test verifies Save / Load / Execute button presence.
UI tests verify replay state changes, applying a Doctor fix, and expected-versus-actual test failures.

## Notes
- The backend uses an H2 in-memory database by default, which resets when the server stops.
- The Load action fetches pipeline ID `1` for demo purposes; a pipeline picker is not included.
- The execution engine currently simulates runtime behavior rather than connecting to an actual external LLM or API.
