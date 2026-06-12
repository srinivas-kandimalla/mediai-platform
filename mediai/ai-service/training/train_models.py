import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error

# Create models folder if it doesn't exist
os.makedirs('ai-service/models', exist_ok=True)
os.makedirs('models', exist_ok=True) # Check both for safety depending on cwd

SYMPTOMS_LIST = [
    'fever', 'cough', 'fatigue', 'shortness_of_breath', 'chest_pain',
    'headache', 'nausea', 'joint_pain', 'dizziness', 'sore_throat'
]

DISEASES = ['Flu', 'Diabetes', 'Cardiovascular Disease', 'Malaria', 'Pneumonia', 'Hypertension', 'Healthy']

def generate_disease_data(num_samples=1000):
    np.random.seed(42)
    
    # Vitals and demographic features
    age = np.random.randint(1, 90, num_samples)
    bp_sys = np.random.randint(90, 190, num_samples)
    sugar = np.random.randint(70, 300, num_samples)
    cholesterol = np.random.randint(120, 320, num_samples)
    bmi = np.random.uniform(15.0, 40.0, num_samples)
    
    # Binary symptom indicators
    symptoms = np.random.randint(0, 2, size=(num_samples, len(SYMPTOMS_LIST)))
    
    # Deterministic targets with added noise
    diseases_target = []
    for i in range(num_samples):
        # Heuristic rules to assign labels
        score = 0
        if symptoms[i, 0] == 1: score += 2  # fever
        if symptoms[i, 1] == 1: score += 1.5  # cough
        if symptoms[i, 3] == 1: score += 2  # shortness of breath
        if symptoms[i, 4] == 1: score += 3  # chest pain
        if bp_sys[i] > 140: score += 1.5
        if sugar[i] > 180: score += 2
        
        if score > 8:
            diseases_target.append('Cardiovascular Disease')
        elif score > 6 and symptoms[i, 3] == 1:
            diseases_target.append('Pneumonia')
        elif score > 4.5 and symptoms[i, 0] == 1:
            diseases_target.append('Flu')
        elif sugar[i] > 140:
            diseases_target.append('Diabetes')
        elif bp_sys[i] > 135:
            diseases_target.append('Hypertension')
        elif score > 3 and symptoms[i, 9] == 1:
            diseases_target.append('Malaria')
        else:
            diseases_target.append('Healthy')
            
    # Assemble dataframe
    cols = ['age', 'bp_sys', 'sugar', 'cholesterol', 'bmi'] + SYMPTOMS_LIST
    X = pd.DataFrame(np.column_stack([age, bp_sys, sugar, cholesterol, bmi, symptoms]), columns=cols)
    y = pd.Series(diseases_target)
    
    return X, y

def generate_outcome_data(num_samples=1000):
    np.random.seed(101)
    
    age = np.random.randint(18, 90, num_samples)
    temp = np.random.uniform(36.0, 40.5, num_samples)
    spo2 = np.random.uniform(80.0, 100.0, num_samples)
    heart_rate = np.random.randint(50, 160, num_samples)
    respirations = np.random.randint(10, 35, num_samples)
    
    # Calculate target values based on vitals
    icu_probs = []
    recovery_probs = []
    expected_stay = []
    mortality_risks = []
    
    for i in range(num_samples):
        icu_score = 0
        if spo2[i] < 90: icu_score += 4
        if temp[i] > 39: icu_score += 2
        if heart_rate[i] > 130: icu_score += 2
        if respirations[i] > 28: icu_score += 2
        
        icu_req = 1 if icu_score > 5 else 0
        icu_probs.append(icu_req)
        
        rec = max(0.05, min(0.99, 1.0 - (icu_score * 0.08) - (age[i] * 0.002)))
        recovery_probs.append(rec)
        
        stay = max(1, int(2 + (10 - spo2[i] * 0.1) + (icu_req * 8) + np.random.randint(0, 3)))
        expected_stay.append(stay)
        
        mort = max(0.01, min(0.95, (icu_score * 0.09) + (age[i] * 0.005) - 0.2))
        mortality_risks.append(mort)
        
    X = pd.DataFrame(np.column_stack([age, temp, spo2, heart_rate, respirations]),
                     columns=['age', 'temp', 'spo2', 'heart_rate', 'respirations'])
    y = pd.DataFrame({
        'icuRequired': icu_probs,
        'recoveryProbability': recovery_probs,
        'expectedStayDays': expected_stay,
        'mortalityRisk': mortality_risks,
        'readmissionRisk': [r * 0.15 for r in recovery_probs]
      })
      
    return X, y

def train_and_save():
    print("[ML] Starting Synthetic Data Generation and ML Model Training...")
    
    # 1. Disease Prediction Model
    X_disease, y_disease = generate_disease_data()
    X_tr_d, X_te_d, y_tr_d, y_te_d = train_test_split(X_disease, y_disease, test_size=0.2, random_state=42)
    
    disease_model = RandomForestClassifier(n_estimators=50, random_state=42)
    disease_model.fit(X_tr_d, y_tr_d)
    d_preds = disease_model.predict(X_te_d)
    d_acc = accuracy_score(y_te_d, d_preds)
    print(f"[ML] Disease Classifier Trained. Validation Accuracy: {d_acc * 100:.2f}%")
    
    # 2. Outcome Models
    X_outcome, y_outcome = generate_outcome_data()
    X_tr_o, X_te_o, y_tr_o, y_te_o = train_test_split(X_outcome, y_outcome, test_size=0.2, random_state=42)
    
    # Train separate models for outcomes
    icu_model = RandomForestClassifier(n_estimators=30, random_state=42)
    icu_model.fit(X_tr_o, y_tr_o['icuRequired'])
    icu_acc = accuracy_score(y_te_o['icuRequired'], icu_model.predict(X_te_o))
    
    stay_model = RandomForestRegressor(n_estimators=30, random_state=42)
    stay_model.fit(X_tr_o, y_tr_o['expectedStayDays'])
    stay_mae = mean_absolute_error(y_te_o['expectedStayDays'], stay_model.predict(X_te_o))
    
    recovery_model = RandomForestRegressor(n_estimators=30, random_state=42)
    recovery_model.fit(X_tr_o, y_tr_o['recoveryProbability'])
    
    mortality_model = RandomForestRegressor(n_estimators=30, random_state=42)
    mortality_model.fit(X_tr_o, y_tr_o['mortalityRisk'])
    
    print(f"[ML] Patient Outcome Models Trained.")
    print(f"   - ICU Requirement Acc: {icu_acc * 100:.2f}%")
    print(f"   - Expected Stay MAE: {stay_mae:.2f} days")
    
    # Save all models
    model_paths = {
        'disease_model.pkl': disease_model,
        'icu_model.pkl': icu_model,
        'stay_model.pkl': stay_model,
        'recovery_model.pkl': recovery_model,
        'mortality_model.pkl': mortality_model
    }
    
    # Save to both paths to avoid cwd mismatches
    for filename, model in model_paths.items():
        joblib.dump(model, os.path.join('ai-service/models', filename))
        joblib.dump(model, os.path.join('models', filename))
        
    print("[ML] Trained model weights successfully serialized to /models folder.")

if __name__ == '__main__':
    train_and_save()
