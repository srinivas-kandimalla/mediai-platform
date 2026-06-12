from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from services.inference import inference_service
from services.ocr_nlp import ocr_nlp_service
from services.chatbot import medibot_service
from services.analytics_ai import forecast_bed_demand, optimize_staff_schedule

router = APIRouter(prefix="/ai", tags=["AI Services"])

# Pydantic Schemas
class DiseaseInput(BaseModel):
    age: int = Field(..., ge=0, le=120)
    symptoms: List[str]
    bloodPressure: Any # Can be string '120/80' or number
    sugarLevel: float
    cholesterol: float
    bmi: float

class OutcomeInput(BaseModel):
    patientId: str
    vitalSigns: Dict[str, Any]
    age: int
    conditions: List[str]
    labValues: Dict[str, Any]

class TreatmentInput(BaseModel):
    symptoms: List[str]
    predictedDisease: str
    patientHistory: Optional[str] = ""

class ReportInput(BaseModel):
    fileUrl: str
    reportType: str

class ChatInput(BaseModel):
    message: str
    sessionHistory: List[Dict[str, Any]] = []
    userId: str

class BedForecastInput(BaseModel):
    historicalData: List[Dict[str, Any]]
    currentOccupancy: int
    timeHorizon: Optional[int] = 7

class StaffInput(BaseModel):
    staffList: List[Dict[str, Any]]
    patientForecast: Dict[str, Any]
    departmentNeeds: List[Dict[str, Any]]

# Endpoints
@router.post("/predict-disease")
def api_predict_disease(data: DiseaseInput):
    try:
        disease, risk, severity, confidence = inference_service.predict_disease(
            data.age, data.symptoms, data.bloodPressure, data.sugarLevel, data.cholesterol, data.bmi
        )
        return {
            "predictedDisease": disease,
            "riskScore": risk,
            "severityLevel": severity,
            "confidence": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict-outcome")
def api_predict_outcome(data: OutcomeInput):
    try:
        recovery, icu, readmit, mortality, stay = inference_service.predict_outcome(
            data.vitalSigns, data.age, data.conditions, data.labValues
        )
        return {
            "recoveryProbability": recovery,
            "icuRequired": icu,
            "readmissionRisk": readmit,
            "mortalityRisk": mortality,
            "expectedStayDays": stay
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend-treatment")
def api_recommend_treatment(data: TreatmentInput):
    try:
        # Rules engine + hybrid logic mapping
        disease = data.predictedDisease.lower()
        
        if "cardiovascular" in disease or "heart" in disease:
            plan = ["Restricted physical exertion", "Monitor heart rate daily", "Low sodium diet"]
            tests = ["Electrocardiogram (ECG)", "Lipid Profile Panel", "Echocardiography"]
            meds = ["Aspirin 81mg daily", "Metoprolol 25mg"]
            specialists = ["Cardiologist"]
        elif "pneumonia" in disease:
            plan = ["Incentive spirometry deep breathing", "Rest in elevated position", "Oxygen tracking"]
            tests = ["Chest X-Ray", "Sputum Culture", "Complete Blood Count (CBC)"]
            meds = ["Amoxicillin 500mg (Antibiotic)", "Mucinex 600mg"]
            specialists = ["Pulmonologist"]
        elif "diabetes" in disease:
            plan = ["Track fasting blood sugar daily", "Carbohydrate controlled diet", "Regular light walks"]
            tests = ["Hemoglobin A1c (HbA1c)", "Basic Metabolic Panel (BMP)"]
            meds = ["Metformin 500mg daily", "Insulin Glargine (if prescribed)"]
            specialists = ["Endocrinologist"]
        elif "flu" in disease or "cold" in disease:
            plan = ["High hydration intake (2-3L fluid)", "Warm saline gargles", "Thermal insulation / Bed rest"]
            tests = ["Rapid Influenza Swab"]
            meds = ["Tamiflu 75mg", "Ibuprofen 400mg as needed"]
            specialists = ["General Practitioner"]
        elif "hypertension" in disease:
            plan = ["Restrict sodium to <1500mg/day", "Daily blood pressure charting", "Stress relief exercises"]
            tests = ["Renal Function Panel", "Urinalysis"]
            meds = ["Lisinopril 10mg daily", "Amlodipine 5mg"]
            specialists = ["General Practitioner"]
        else:
            plan = ["Balanced nutrition", "Adequate sleep schedule", "Follow-up checkups"]
            tests = ["Routine blood panel"]
            meds = ["Multivitamin supplements"]
            specialists = ["General Practitioner"]

        return {
            "treatmentPlan": plan,
            "suggestedTests": tests,
            "medications": meds,
            "specialists": specialists
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-report")
def api_analyze_report(data: ReportInput):
    try:
        result = ocr_nlp_service.analyze_report(data.fileUrl, data.reportType)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chatbot")
def api_chatbot(data: ChatInput):
    try:
        response = medibot_service.respond(data.message, data.sessionHistory, data.userId)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forecast-beds")
def api_forecast_beds(data: BedForecastInput):
    try:
        result = forecast_bed_demand(data.historicalData, data.currentOccupancy, data.timeHorizon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-staff")
def api_optimize_staff(data: StaffInput):
    try:
        result = optimize_staff_schedule(data.staffList, data.patientForecast, data.departmentNeeds)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
