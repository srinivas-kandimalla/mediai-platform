import os
import joblib
import numpy as np
import pandas as pd

SYMPTOMS_LIST = [
    'fever', 'cough', 'fatigue', 'shortness_of_breath', 'chest_pain',
    'headache', 'nausea', 'joint_pain', 'dizziness', 'sore_throat'
]

class MLInferenceService:
    def __init__(self):
        self.models = {}
        self.load_models()

    def load_models(self):
        paths = ['ai-service/models', 'models', '../models']
        target_dir = None
        for p in paths:
            if os.path.exists(os.path.join(p, 'disease_model.pkl')):
                target_dir = p
                break
        
        if target_dir:
            print(f"Loading serialized ML models from directory: {target_dir}")
            try:
                self.models['disease'] = joblib.load(os.path.join(target_dir, 'disease_model.pkl'))
                self.models['icu'] = joblib.load(os.path.join(target_dir, 'icu_model.pkl'))
                self.models['stay'] = joblib.load(os.path.join(target_dir, 'stay_model.pkl'))
                self.models['recovery'] = joblib.load(os.path.join(target_dir, 'recovery_model.pkl'))
                self.models['mortality'] = joblib.load(os.path.join(target_dir, 'mortality_model.pkl'))
                print("All ML models loaded successfully.")
            except Exception as e:
                print(f"Error loading models: {e}. Heuristics fallback enabled.")
        else:
            print("Warning: Serialized model weights not found. Running inference with rule-based heuristics fallback.")

    def predict_disease(self, age, symptoms_input, blood_pressure, sugar_level, cholesterol, bmi):
        symptom_vector = [1 if sym in symptoms_input else 0 for sym in SYMPTOMS_LIST]
        
        sys_bp = 120
        if isinstance(blood_pressure, str) and '/' in blood_pressure:
            try:
                sys_bp = int(blood_pressure.split('/')[0])
            except ValueError:
                pass
        elif isinstance(blood_pressure, (int, float)):
            sys_bp = int(blood_pressure)

        features = [age, sys_bp, sugar_level, cholesterol, bmi] + symptom_vector
        
        if 'disease' in self.models:
            try:
                df = pd.DataFrame([features], columns=['age', 'bp_sys', 'sugar', 'cholesterol', 'bmi'] + SYMPTOMS_LIST)
                predicted = self.models['disease'].predict(df)[0]
                
                probs = self.models['disease'].predict_proba(df)[0]
                classes = self.models['disease'].classes_
                idx = np.where(classes == predicted)[0][0]
                risk_score = float(probs[idx])
                
                confidence = risk_score
                severity = 'HIGH' if risk_score > 0.75 else 'MODERATE' if risk_score > 0.4 else 'LOW'
                
                return predicted, risk_score, severity, confidence
            except Exception as e:
                print(f"Inference prediction failed: {e}. Invoking rule-based fallback.")
                
        # Rule-based fallback
        score = sum(symptom_vector) * 1.5
        if 'chest_pain' in symptoms_input: score += 3.5
        if 'shortness_of_breath' in symptoms_input: score += 2.5
        if sys_bp > 140: score += 1.5
        if sugar_level > 150: score += 2.0
        
        if score > 8:
            disease = 'Cardiovascular Disease'
            risk = 0.82
            sev = 'CRITICAL'
        elif score > 5.5:
            disease = 'Pneumonia'
            risk = 0.72
            sev = 'HIGH'
        elif 'fever' in symptoms_input and 'cough' in symptoms_input:
            disease = 'Flu'
            risk = 0.65
            sev = 'MODERATE'
        elif sugar_level > 130:
            disease = 'Diabetes'
            risk = 0.70
            sev = 'MODERATE'
        elif sys_bp > 130:
            disease = 'Hypertension'
            risk = 0.60
            sev = 'MODERATE'
        else:
            disease = 'Healthy'
            risk = 0.15
            sev = 'LOW'
            
        return disease, risk, sev, 0.90

    def predict_outcome(self, vital_signs, age, conditions, lab_values):
        temp = float(vital_signs.get('temperature', 37.0))
        spo2 = float(vital_signs.get('spo2', 98.0))
        hr = float(vital_signs.get('heartRate', 80.0))
        resp = float(vital_signs.get('respirationRate', 16.0))
        
        features = [age, temp, spo2, hr, resp]
        
        if 'icu' in self.models:
            try:
                df = pd.DataFrame([features], columns=['age', 'temp', 'spo2', 'heart_rate', 'respirations'])
                icu_req = bool(self.models['icu'].predict(df)[0])
                stay = int(self.models['stay'].predict(df)[0])
                recovery = float(self.models['recovery'].predict(df)[0])
                mortality = float(self.models['mortality'].predict(df)[0])
                readmit = float(recovery * 0.15)
                
                return recovery, icu_req, readmit, mortality, stay
            except Exception as e:
                print(f"Outcome inference failed: {e}. Invoking rule-based fallback.")

        icu_req = spo2 < 90 or temp > 39.5 or resp > 30
        stay = 12 if icu_req else 4
        recovery = 0.50 if icu_req else 0.92
        mortality = 0.18 if icu_req else 0.01
        readmit = 0.25 if icu_req else 0.08
        
        return recovery, icu_req, readmit, mortality, stay

inference_service = MLInferenceService()
