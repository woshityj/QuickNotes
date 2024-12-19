# QuickNotes
## Table of Contents
1. [Team](#capstone-project)
2. [Overview](#overview)
3. [Methodology](#methodology)
4. [Repository Structure](#repository-structure)
5. [Program Usage](#program-usage)

## Capstone Project
---
- Tan Yu Jie (*2201782*)

## Overview
---
The goal of this project is to develop a note-taking web application that integrates Automated Text Summarization capabilities. The application will be targeted primarily at students and professionals who regularly interact with large volumes of text and require efficient note-taking tools.

## Methodology
---
The following methodology was employed for the development of the note-taking web application with Automatic Text Summarization capabilites:
1. Initial Setup
    - System Architecture Design
    - Development Environment Setup
2. Web Application Design and Initial Prototype Development
    - User Interface (UI) and User Experience (UX) Design
    - Prototype Development
    - Front-End Development
3. Text Summarization Model Training and Optimization
    - Data Collection and Pre-processing
    - Text Summarization Model Training
    - Model Evaluation
4. Back-End Development and Text Summarization Model Integration
    - Back-End Infrastructure Development
    - API Development
    - Integration of Text Summarization Model
    - Preliminary Testing
5. Text Summarization Model Fine-Tuning and Feature Testing
    - Model Fine-Tuning
    - Summarization Quality Testing
    - System-Wide Testing
    - User Acceptance Testing

## Repository Structure
---
```
/my-app (NextJs Front-End Web Application)
/server (Node.JS Back-End)
/llm_model (FastAPI Large Language Model Endpoint)

.gitignore

LICENSE

README.md (this file)
```

## Program Usage
---
1. Run the Front-End Web Application on your local environment
```shell
npm run build
```

2. Command to run the Back-End Server via Command Line
```shell
node --env-file=config.env server
```

3. Command to run the Large Language Model FastAPI Endpoint via Command Line
```shell
fastapi dev llm_model/main.py
```

4. If the port 8000 is being used by another program, identify the PID and kill the task
```shell
netstat -a -n -o | find "8000"
taskkill /F /PID <PID>
```