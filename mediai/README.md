# 🏥 MediAI — AI-Powered Healthcare Prediction & Resource Management System

[![Frontend - React](https://img.shields.io/badge/Frontend-React%20%2B%20TS%20%2B%20Tailwind-blue?logo=react&logoColor=white)](./frontend)
[![Backend - Node](https://img.shields.io/badge/Backend-Express%20%2B%20Prisma%20%2B%20Sqlite-green?logo=nodedotjs&logoColor=white)](./backend)
[![AI Service - FastAPI](https://img.shields.io/badge/AI%20Service-FastAPI%20%2B%20Scikit--Learn-red?logo=fastapi&logoColor=white)](./ai-service)
[![License - MIT](https://img.shields.io/badge/License-MIT-purple)](./LICENSE)

MediAI is a hospital-grade operational intelligence platform designed to predict patient outcomes, run clinical diagnostics screenings using Random Forest ML algorithms, schedule doctors/nurses shift rosters, track bed allocations, and dispatch emergency alerts.

---

## 🗺️ System Architecture & Data Flow

Below is the routing and service layer structure of the MediAI ecosystem:

```
                  +-----------------------------------+
                  |        USER / BROWSER CLIENT      |
                  +-----------------+-----------------+
                                    |
                                    v [HTTP / WS] (Port 80)
                  +-----------------+-----------------+
                  |          NGINX GATEWAY            |
                  +-------+---------+---------+-------+
                          |         |         |
      / (Vite/React)      |         |         | /api (Node/Express)
   +----------------------+         |         +----------------------+
   |                                |                                |
   v (Port 3000)                    | /ai (FastAPI)                  v (Port 5000)
+--+-------------------+            |                            +---+------------------+
|   FRONTEND CLIENT    |            v (Port 8000)                |   EXPRESS BACKEND    |
|   React + TypeScript |    +-------+----------+                 |   Node.js REST API   |
|   Tailwind + Zustand |    |    AI-SERVICE    |                 +---+--------+---------+
+----------------------+    |  FastAPI (Python)|                     |        |
                            |  ML & OCR Engine |                     |        |
                            +------------------+                     v        v
                                                                 [SQLite / DB] [Redis]
                                                                 (Local dev.db) Port 6379
```

### 🔁 Internal Communication Flow

```mermaid
graph TD
    Client[Browser Client: React + Zustand] -->|HTTP / WS| Nginx{Nginx Reverse Proxy}
    Nginx -->|/| ReactDev[Vite Server: Port 3000]
    Nginx -->|/api| ExpressAPI[Express Server: Port 5000]
    Nginx -->|/ai| FastAPI[FastAPI AI Service: Port 8000]
    
    ExpressAPI -->|Session Tokens / Cache| Redis[(Redis Cache / Blacklist)]
    ExpressAPI -->|ORM: Prisma| SQLite[(SQLite Database)]
    ExpressAPI -->|OCR & ML Inference| FastAPI
    
    FastAPI -->|Load ML Weights| Models[Random Forest Weights]
    FastAPI -->|Process Images| OCR[Tesseract OCR & OpenCV]
```

---

## 🔄 Core Project Workflows

### 📥 1. OCR Medical Lab Scan Extraction
* **Trigger**: A Patient uploads a blood panel hematology report (`.png` / `.jpg` / `.pdf`).
* **Processing**: The Express Backend uploads the file and proxies it to the FastAPI `ai-service`. The Python service runs image pre-processing (grayscale, thresholding via OpenCV) and Optical Character Recognition (PyTesseract) to isolate the document text.
* **Extraction**: RegEx patterns parse numerical indicators (e.g., Hemoglobin levels, Glucose numbers).
* **Action**: Critical flags are stored in the database. Vitals exceeding safe parameters automatically alert the clinic.

### 🧠 2. ML Prognostic & Risk Inference
* **Trigger**: A Patient fills out a symptom checklist or a doctor uploads a vital screening panel.
* **Processing**: Clinical telemetry (BP, Sugar levels, Age, BMI) is pushed to the FastAPI `ai-service`.
* **Inference**: High-efficiency pre-trained Random Forest ML models evaluate:
  - **Disease Diagnosis**: Predicts likely condition with probability risk index.
  - **Patient Outcome**: Forecasts ICU admission requirement and expected hospital stay duration.
* **Action**: Saves results to history logs to generate interactive trend-lines on client dashboards.

### 🚨 3. Real-Time Emergency Vital Alerts
* **Trigger**: Telemetry records abnormal stats (Oxygen < 90%, HR > 150 bpm, BP > 180/120 mmHg).
* **Evaluation**: The vital check module immediately evaluates these boundaries.
* **Action**: Triggers WebSockets (Socket.io) dispatching screen-wide alert popups to active Doctor/Admin dashboards, accompanied by Twilio SMS alerts.

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

## 🚀 Setup & Running Instructions

### Option 1: Running with Docker Compose (Recommended)

1. Make sure you have **Docker** and **Docker Compose** installed.
2. In the root of the `mediai/` directory, copy `.env.example` to `.env`:
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

### Option 2: Local Development Setup

#### Step 1: Database Setup
1. Boot a PostgreSQL database and a Redis server locally.
2. Configure your local `.env` database URL:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/mediaidb?schema=public"
   REDIS_URL="redis://localhost:6379"
   ```

#### Step 2: Build Backend REST API
1. Navigate to `/backend` and install packages:
   ```bash
   cd backend
   npm install
   ```
2. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```

#### Step 3: Run AI microservice
1. Navigate to `/ai-service` and create a virtual environment:
   ```bash
   cd ai-service
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Pre-train the ML models:
   ```bash
   python training/train_models.py
   ```
4. Start FastAPI server:
   ```bash
   python main.py
   ```

#### Step 4: Boot React frontend
1. Navigate to `/frontend` and install packages:
   ```bash
   cd frontend
   npm install
   ```
2. Boot Vite:
   ```bash
   npm run dev
   ```
3. Access portal at `http://localhost:3000`.

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

## 📸 Interactive Screenshot Previews

Below are the previews of the platform dashboards grouped by category. Click on each section to expand the previews.

<details>
<summary><b>🔗 View Public & Authentication Pages (2 Previews)</b></summary>
<br>

#### Landing Console
![Landing Page](screenshots/01_landing.png)

#### Sign In Gate
![Login Page](screenshots/02_login.png)

</details>

<details>
<summary><b>👤 View Patient Portal (7 Previews)</b></summary>
<br>

#### Patient Clinical Console
![Patient Dashboard](screenshots/03_patient_dashboard.png)

#### Patient Profile Details
![Patient Profile](screenshots/04_patient_profile.png)

#### Bookings & Scheduling
![Patient Appointments](screenshots/05_patient_appointments.png)

#### Electronic Health Records (EHR)
![Patient EHR](screenshots/06_patient_ehr.png)

#### Diagnostic Lab Scan OCR
![Patient Lab Reports](screenshots/07_patient_lab_reports.png)

#### Clinical Symptom Evaluator
![Patient Predictions](screenshots/08_patient_predictions.png)

#### MediBot Automated Chat
![Patient Chatbot](screenshots/09_patient_chatbot.png)

</details>

<details>
<summary><b>🩺 View Doctor Portal (6 Previews)</b></summary>
<br>

#### Clinical Operations Console
![Doctor Dashboard](screenshots/10_doctor_dashboard.png)

#### Assigned Patients Records
![Doctor Patients](screenshots/11_doctor_patients.png)

#### Scheduled Consultations
![Doctor Appointments](screenshots/12_doctor_appointments.png)

#### Patient AI Prognostics & Risk Monitor
![Doctor Predictions](screenshots/13_doctor_predictions.png)

#### AI Clinical Planner & Recommendations
![Doctor Recommendations](screenshots/14_doctor_recommendations.png)

#### OCR Document Inbox & Reports
![Doctor Reports](screenshots/15_doctor_reports.png)

</details>

<details>
<summary><b>🛡️ View Hospital Admin Portal (6 Previews)</b></summary>
<br>

#### Administration Overview Dashboard
![Admin Dashboard](screenshots/16_admin_dashboard.png)

#### Bed Capacity Manager
![Admin Beds](screenshots/17_admin_beds.png)

#### Supplies & Logistics Inventory
![Admin Resources](screenshots/18_admin_resources.png)

#### Roster & Staff Shift Scheduler
![Admin Staff](screenshots/19_admin_staff.png)

#### Emergency Telemetry Alerts
![Admin Alerts](screenshots/20_admin_alerts.png)

#### Institutional Performance Analytics
![Admin Analytics](screenshots/21_admin_analytics.png)

</details>

---

## 🎨 Design Philosophy & UX

MediAI is constructed using a **curated dark-mode design system** customized for high-frequency clinical environments:
* **Slate-Indigo Interface**: Crafted with custom HSL dark-mode tailwind tokens to reduce clinical screen fatigue.
* **Micro-interactions & Animations**: Leverages custom transition hooks and pulse alerts to naturally guide clinical eyes to critical alarms.
* **Responsive Visual Hierarchy**: Designed to render perfectly on clinical tablets, desktop terminals, and emergency smartphones.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Developed with 🧬 and 🧠 by the <b>MediAI Dev Team</b> & <b>Antigravity AI</b>.
  <br>
  <i>Empowering clinical workflows with real-time, microservice-driven operational intelligence.</i>
</p>

