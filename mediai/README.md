# 🏥 MediAI — AI-Powered Healthcare Prediction & Resource Management System

[![Frontend - React](https://img.shields.io/badge/Frontend-React%20%2B%20TS%20%2B%20Tailwind-blue?logo=react&logoColor=white)](./frontend)
[![Backend - Node](https://img.shields.io/badge/Backend-Express%20%2B%20Prisma%20%2B%20Sqlite-green?logo=nodedotjs&logoColor=white)](./backend)
[![AI Service - FastAPI](https://img.shields.io/badge/AI%20Service-FastAPI%20%2B%20Scikit--Learn-red?logo=fastapi&logoColor=white)](./ai-service)

MediAI is a hospital-grade operational intelligence platform designed to predict patient outcomes, run clinical diagnostics screenings using Random Forest ML algorithms, schedule doctors/nurses shift rosters, track bed allocations, and dispatch emergency alerts.

---

## 🗺️ System Architecture & Data Flow

Below is the software system architecture and service routing diagram of the MediAI ecosystem:

<img src="screenshots/architecture_diagram.png" alt="System Architecture Diagram" width="100%" />

---

## 🔄 Core System Workflows & Processes

MediAI drives institutional performance through high-efficiency, end-to-end clinical workflow pipelines:

<img src="screenshots/workflow_diagram.png" alt="Clinical Workflow Diagram" width="100%" />

### 🧠 1. ML Disease Diagnostics & Auto-Triage Workflow
Predicts clinical risk factors from input metrics and automatically drafts recommendations if critical scores are returned.

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient Portal
    participant React as React Client (Vite)
    participant Express as Node Express Backend
    participant FastAPI as FastAPI AI Service
    participant DB as SQLite DB (Prisma)

    Patient->>React: Enters symptoms & telemetry
    React->>Express: POST /api/ai/predict-disease (Attach JWT)
    Note over Express: auth.js verifies token & role
    Express->>FastAPI: POST /ai/predict-disease (Payload)
    Note over FastAPI: MLInferenceService loads disease_model.pkl<br/>Runs Scikit-Learn Random Forest Classifier
    FastAPI-->>Express: Returns { predictedDisease, riskScore, severityLevel }
    Express->>DB: Prisma.diseasePrediction.create()
    alt riskScore >= 0.70 (High Risk Triage)
        Note over Express: Detects critical threshold breach
        Express->>DB: Prisma.treatmentRecommendation.create() (Auto-plan)
    end
    Express-->>React: Response { success: true, data }
    React-->>Patient: Updates Prognostics dashboard & trend charts
```

* **Step-by-Step Pipeline**:
  1. **User Action**: The patient logs in and inputs clinical data (Age, Symptoms checkmarks, BP, Sugar levels, BMI) on [PatientPredictions.tsx](./frontend/src/pages/PatientPredictions.tsx).
  2. **API Request**: The frontend client forwards the request to `/api/ai/predict-disease`. The token interceptor in `api.ts` adds the user's JWT credentials.
  3. **Triage Validation**: The backend controller [aiController.predictDisease](./backend/src/controllers/aiController.js) checks inputs and forwards them to the Python microservice at port 8000.
  4. **Random Forest Inference**: Inside the FastAPI service, `MLInferenceService` ([inference.py](./ai-service/services/inference.py)) builds a 15-dimension feature vector mapping symptoms, then feeds it to the pre-trained `disease_model.pkl`. The model yields the classification probability score.
  5. **Auto-Treatment Action**: If the resulting `riskScore >= 0.70`, the backend automatically generates a `TreatmentRecommendation` profile outlining required tests (e.g. CBC, ECG) to fast-track clinical care.

---

### 📥 2. Lab Scan OCR Text Extraction & Validation
Processes hematology scans to extract key biomarkers and flags abnormal levels.

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient Portal
    participant Express as Node Express Backend
    participant FastAPI as FastAPI AI Service
    participant OCR as OpenCV & Tesseract OCR
    participant DB as SQLite DB (Prisma)

    Patient->>Express: POST /api/patients/:id/lab-reports (File Upload)
    Express->>FastAPI: POST /ai/analyze-report (fileUrl, type)
    FastAPI->>OCR: Grayscale -> Thresholding -> Text extraction
    OCR-->>FastAPI: Returns unstructured text content
    Note over FastAPI: Regular Expression (RegEx) matching patterns
    FastAPI-->>Express: Returns { extractedValues, abnormalFlags, summary }
    Express->>DB: Prisma.labReport.create()
    Express-->>Patient: Displays parsed biomarkers & warnings
```

* **Step-by-Step Pipeline**:
  1. **Document Upload**: The patient uploads a blood panel scan on [PatientLabReports.tsx](./frontend/src/pages/PatientLabReports.tsx).
  2. **OCR Pre-processing**: The file metadata is recorded by Express and passed to the FastAPI `/ai/analyze-report` endpoint. The Python parser ([ocr_nlp.py](./ai-service/services/ocr_nlp.py)) reads the image.
  3. **Computer Vision & Extraction**: Python grayscales and thresholds the scan using OpenCV to clear visual artifacts, then feeds it to PyTesseract.
  4. **RegEx Evaluation**: The parsed characters are evaluated by RegEx pattern pipelines to capture vitals like Hemoglobin (`hemoglobin: \d+\.\d+`) and Glucose (`glucose: \d+\.\d+`).
  5. **Vital Warnings**: Values exceeding safe limits (e.g. Hemoglobin < 11.0 g/dL) are flagged in the database and displayed as highlighted cards in the patient file.

---

### 📅 3. Greedy AI Staff Shift Optimization Solver
Generates optimized weekly rosters matching staff availability with ward capacity demands.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Portal
    participant Express as Node Express Backend
    participant FastAPI as FastAPI AI Service
    participant Solver as Roster Greedy Solver
    participant DB as SQLite DB (Prisma)

    Admin->>Express: POST /api/staff/schedule/optimize (Ward demands)
    Express->>FastAPI: POST /ai/optimize-staff (Demands, Staff pool)
    Note over FastAPI: Runs constraint greedy allocation algorithm
    Solver-->>FastAPI: Returns weekly shifts allocation table
    FastAPI-->>Express: Returns roster payload
    Express->>DB: Prisma.staffSchedule.createMany()
    Express-->>Admin: Populates calendar schedule board
```

* **Step-by-Step Pipeline**:
  1. **Roster Demands**: An Administrator inputs ward staff requirements per department (ICU, General, Emergency) on [AdminStaff.tsx](./frontend/src/pages/AdminStaff.tsx).
  2. **Optimization Query**: Express forwards the demand parameters along with list of active doctors/nurses.
  3. **FastAPI Greedy Algorithm**: The solver ([analytics_ai.py](./ai-service/services/analytics_ai.py)) executes a greedy constraint-satisfaction solver. It runs recursive matching rounds:
     - Assigns staff to their preferred departments.
     - Checks rest period constraints (restricting consecutive double shifts).
     - Minimizes ward coverage gaps.
  4. **Calendar Roster Render**: The finalized roster is stored under the `StaffSchedule` schema table and populates the weekly admin shift calendar.

---

## 👥 User Roles & Access Hierarchy

The system operates on strict **Role-Based Access Control (RBAC)** to secure patient data:

1. **Patient**:
   - Accesses appointments booking, personal electronic health records (EHR), and lab scan OCR uploads.
   - Runs self-service symptom diagnostics and chats with the AI MediBot.
2. **Doctor**:
   - Manages schedules, conducts clinical planner checkups, and issues prescriptions.
   - Reviews patient diagnostic trends, AI health forecasts, and resolves active alarms.
3. **Admin**:
   - Tracks real-time hospital bed occupancies and manages supplies inventory.
   - Manages shift rotations with a Greedy AI Staff Solver, tracks system-wide analytics, and monitors active emergencies.

---

## 🌐 Live Demo

The application is fully deployed and accessible at:

| Service | URL |
| :--- | :--- |
| **Frontend (React App)** | [https://mediai-frontend-y0e3.onrender.com](https://mediai-frontend-y0e3.onrender.com) |
| **Backend API Health** | [https://mediai-backend-1ngu.onrender.com/health](https://mediai-backend-1ngu.onrender.com/health) |

> **Note:** Hosted on Render free tier — services may take **30–60 seconds** to wake up on first visit.

### 🔑 Demo Login Credentials

Use any of the following accounts to explore the full feature set:

| Role | Email | Password |
| :--- | :--- | :--- |
| 👑 **Admin** | `admin@mediai.org` | `M3diAI_SecureP@ss2026!` |
| 🩺 **Doctor** | `doctor@mediai.org` | `M3diAI_SecureP@ss2026!` |
| 🏥 **Patient** | `patient@mediai.org` | `M3diAI_SecureP@ss2026!` |

---

## 🚀 Setup & Running Instructions

The project runs using standard containers or local installs. Full configuration details are in this directory.

### Running with Docker Compose (Recommended)

1. Navigate to the root of this directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Run the orchestration build command:
   ```bash
   docker-compose up --build
   ```
4. Access the Nginx Gateway endpoint inside your browser:
   - Client Portal: `http://localhost`
   - Express Healthcheck: `http://localhost/api/health`
   - FastAPI Healthcheck: `http://localhost/ai/health`

---


## 🔌 API Endpoints Reference

### Authentication `/api/auth`
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register credentials (auto-creates Patient/Doctor profiles) |
| `POST` | `/login` | Authenticate credentials and issue JWT tokens |
| `POST` | `/logout` | Invalidate token on Redis blacklist |
| `POST` | `/refresh-token` | Refresh current access token |
| `PUT` | `/change-password` | Change account password |

### Patients `/api/patients`
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/` | Create profile |
| `GET` | `/:id` | Get details |
| `PUT` | `/:id` | Update profile |
| `GET` | `/:id/ehr` | Retrieve Electronic Health Record (EHR) |
| `POST` | `/:id/lab-reports` | Upload hematology PDF/Image report for OCR |
| `GET` | `/:id/predictions` | Retrieve prediction history logs |

### Doctors `/api/doctors`
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all practitioners |
| `GET` | `/:id` | Get profile |
| `PUT` | `/:id/availability` | Update appointment slots |

### AI Proxies `/api/ai`
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/predict-disease` | Call Random Forest symptom evaluator model |
| `POST` | `/recommend-treatment`| Generate clinical medication recommendations |
| `POST` | `/predict-outcome` | Predict ICU admission probability & stay days |
| `POST` | `/chatbot` | Message the MediBot assistant |

### Bed Management `/api/beds`
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/availability` | Get occupancy status |
| `POST` | `/assign` | Allocate patient to bed |
| `PUT` | `/:id/release` | Vacate bed |
| `GET` | `/forecast` | Load bed demand forecasts |

---

## 📸 Screenshot Previews & Console Walkthrough

### Public Pages
#### Landing Console
<img src="screenshots/01_landing.png" alt="Landing Page" width="100%" />

#### Sign In Gate
<img src="screenshots/02_login.png" alt="Login Page" width="100%" />

---

### Patient Portal
#### Patient Clinical Console
<img src="screenshots/03_patient_dashboard.png" alt="Patient Dashboard" width="100%" />

#### Patient Profile Details
<img src="screenshots/04_patient_profile.png" alt="Patient Profile" width="100%" />

#### Bookings & Scheduling
<img src="screenshots/05_patient_appointments.png" alt="Patient Appointments" width="100%" />

#### Electronic Health Records (EHR)
<img src="screenshots/06_patient_ehr.png" alt="Patient EHR" width="100%" />

#### Diagnostic Lab Scan OCR
<img src="screenshots/07_patient_lab_reports.png" alt="Patient Lab Reports" width="100%" />

#### Clinical Symptom Evaluator
<img src="screenshots/08_patient_predictions.png" alt="Patient Predictions" width="100%" />

#### MediBot Automated Chat
<img src="screenshots/09_patient_chatbot.png" alt="Patient Chatbot" width="100%" />

---

### Doctor Portal
#### Clinical Operations Console
<img src="screenshots/10_doctor_dashboard.png" alt="Doctor Dashboard" width="100%" />

#### Assigned Patients Records
<img src="screenshots/11_doctor_patients.png" alt="Doctor Patients" width="100%" />

#### Scheduled Consultations
<img src="screenshots/12_doctor_appointments.png" alt="Doctor Appointments" width="100%" />

#### Patient AI Prognostics & Risk Monitor
<img src="screenshots/13_doctor_predictions.png" alt="Doctor Predictions" width="100%" />

#### AI Clinical Planner & Recommendations
<img src="screenshots/14_doctor_recommendations.png" alt="Doctor Recommendations" width="100%" />

#### OCR Document Inbox & Reports
<img src="screenshots/15_doctor_reports.png" alt="Doctor Reports" width="100%" />

---

### Hospital Admin Portal
#### Administration Overview Dashboard
<img src="screenshots/16_admin_dashboard.png" alt="Admin Dashboard" width="100%" />

#### Bed Capacity Manager
<img src="screenshots/17_admin_beds.png" alt="Admin Beds" width="100%" />

#### Supplies & Logistics Inventory
<img src="screenshots/18_admin_resources.png" alt="Admin Resources" width="100%" />

#### Roster & Staff Shift Scheduler
<img src="screenshots/19_admin_staff.png" alt="Admin Staff" width="100%" />

#### Emergency Telemetry Alerts
<img src="screenshots/20_admin_alerts.png" alt="Admin Alerts" width="100%" />

#### Institutional Performance Analytics
<img src="screenshots/21_admin_analytics.png" alt="Admin Analytics" width="100%" />
