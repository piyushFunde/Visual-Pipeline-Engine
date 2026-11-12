# PipeCanvas

## Overview
PipeCanvas is a full-stack workflow studio that lets users build, save, load, validate, and execute directed pipelines using a drag-and-drop node editor.
Its responsive landing page introduces the product and links directly to the React Flow canvas. The Spring Boot backend provides DAG validation, pipeline persistence with an H2 in-memory database, and a simulated execution engine.

## Architecture Diagram
```mermaid

flowchart TD

subgraph group_frontend["Editor Client"]
  node_editor["React Flow editor<br/>web client"]
end

subgraph group_backend["Spring Backend"]
  node_application{{"Demo application<br/>Spring Boot entry"}}
  node_controller["Pipeline controller<br/>REST API"]
  node_validation["DAG validation<br/>graph service"]
  node_execution["Execution service<br/>simulation engine"]
  node_properties["Application properties<br/>runtime config"]
  node_maven["Maven build<br/>Java 17 build<br/>[pom.xml]"]
  node_validation_response["Validation metadata<br/>API response"]
  node_execution_response["Execution logs<br/>API response"]
end

subgraph group_persistence["Persistence"]
  node_entity["Pipeline entity<br/>JPA entity"]
  node_repository["Pipeline repository<br/>Spring Data JPA"]
  node_h2[("H2 in-memory DB<br/>database")]
end

node_editor -->|"pipeline JSON"| node_controller
node_application -->|"starts"| node_controller
node_maven -->|"builds"| node_application
node_properties -->|"configures"| node_application
node_controller -->|"parse / validate"| node_validation
node_validation -->|"DAG result + order"| node_validation_response
node_validation_response -->|"validation display"| node_editor
node_validation -->|"valid topological order"| node_execution
node_controller -->|"execute valid graph"| node_execution
node_execution -->|"status + logs"| node_execution_response
node_execution_response -->|"execution result"| node_editor
node_controller -->|"save / list / load"| node_repository
node_repository -->|"maps"| node_entity
node_repository -->|"JPA persistence"| node_h2
node_properties -->|"in-memory datasource"| node_h2
node_repository -->|"saved graph for rehydration"| node_editor

click node_application "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/src/main/java/com/example/demo/DemoApplication.java"
click node_controller "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/src/main/java/com/example/demo/PipelineController.java"
click node_validation "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/src/main/java/com/example/demo/DagValidationService.java"
click node_execution "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/src/main/java/com/example/demo/ExecutionService.java"
click node_entity "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/src/main/java/com/example/demo/PipelineEntity.java"
click node_repository "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/src/main/java/com/example/demo/PipelineRepository.java"
click node_properties "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/src/main/resources/application.properties"
click node_maven "https://github.com/piyushfunde/visual-pipeline-engine/blob/main/Backend-Java/pom.xml"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_editor toneBlue
class node_application,node_controller,node_validation,node_execution,node_properties,node_maven,node_validation_response,node_execution_response toneAmber
class node_entity,node_repository,node_h2 toneMint

```

## What’s Included
- Drag-and-drop pipeline building interface
- Responsive PieCanvas landing page with direct access to the editor
- Save/load pipeline persistence with Spring Data JPA + H2
- Backend DAG validation and topological execution order
- Pipeline execution engine that simulates text and LLM node behavior
- Toolbar actions for Save, Load, and Execute
- Frontend tests for toolbar rendering
- Backend integration test for `/pipelines/execute`

## Architecture
### Frontend
- React 18 + React Flow
- Zustand for state management
- Custom node components: Input, Output, Text, LLM, Timer, Condition, API, Database, Webhook
- Toolbar with buttons for saving, loading, and executing pipelines

### Backend
- Spring Boot 3.2.4
- Java 17
- Spring Data JPA + H2 database
- REST endpoints for pipeline parsing, saving, loading, and executing
- Execution engine walks nodes in topological order and generates a step-by-step log

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
Validates and executes a pipeline.
- Request form data: `pipeline=<json>`
- Response includes `status` and `logs`

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

### Frontend
Run the React test suite:
```bash
cd Frontend
npm test -- --watchAll=false
```
A toolbar rendering test verifies Save / Load / Execute button presence.

## Notes
- The backend uses an H2 in-memory database by default, which resets when the server stops.
- The current load action fetches pipeline ID `1` for demo purposes. This can be extended to support an ID selector or pipeline list.
- The execution engine currently simulates runtime behavior rather than connecting to an actual external LLM or API.
