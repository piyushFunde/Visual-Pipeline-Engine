# Pipeline Builder Application

## Overview
This project is a visual pipeline builder where users can create and connect nodes to form workflows.

## Features
- Node abstraction using BaseNode
- 5 custom nodes (Timer, Condition, API, Database, Webhook)
- Dynamic text node with variable parsing
- Auto handle generation
- Backend DAG validation using Java Spring Boot

## Tech Stack
- Frontend: React + React Flow
- Backend: Java Spring Boot 3 + Java 17

## How to Run

### Frontend
```bash
cd Frontend
npm install
npm start
```

### Backend (Java)
To run the backend, you can either run the `DemoApplication.java` explicitly from VS Code, or use the Maven Wrapper:
```bash
cd Backend-Java
.\mvnw.cmd spring-boot:run
```
