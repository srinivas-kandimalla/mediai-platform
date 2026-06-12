import os
import re

class MediBotService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            print("Chatbot: OpenAI API Key detected. Initializing Langchain chatbot.")
            try:
                from langchain_openai import ChatOpenAI
                from langchain_core.prompts import ChatPromptTemplate
                # Configure LangChain chat
                self.chat_model = ChatOpenAI(
                    model="gpt-3.5-turbo",
                    temperature=0.3,
                    openai_api_key=self.api_key
                )
                self.prompt_template = ChatPromptTemplate.from_messages([
                    ("system", "You are MediBot, a professional AI healthcare assistant. Help users with symptom checking, appointment info, medication reminders, and general health queries. Always recommend consulting a real doctor for serious concerns. Do not diagnose definitively."),
                    ("placeholder", "{chat_history}"),
                    ("human", "{input}")
                ])
            except Exception as e:
                print(f"Error initializing Langchain Chatbot: {e}. Rule-based chatbot activated.")
                self.chat_model = None
        else:
            print("Chatbot: OpenAI API Key not provided. Initializing rule-based conversational assistant.")
            self.chat_model = None

    def respond(self, message: str, session_history: list, user_id: str):
        # 1. If OpenAI model is loaded, attempt inference
        if self.chat_model:
            try:
                # Map sessionHistory to Langchain message format
                formatted_history = []
                for msg in session_history[-6:]:  # Keep context short
                    role = "human" if msg.get("role") == "user" else "ai"
                    formatted_history.append((role, msg.get("content", "")))
                
                chain = self.prompt_template | self.chat_model
                response = chain.invoke({
                    "chat_history": formatted_history,
                    "input": message
                })
                
                reply = response.content
                intent, actions = self._detect_intent_and_actions(message)
                return {
                    "reply": reply,
                    "intent": intent,
                    "suggestedActions": actions
                }
            except Exception as e:
                print(f"Langchain chat invocation failed: {e}. Executing rule-based dialog.")

        # 2. Rule-based dialog fallback
        reply, intent, actions = self._generate_rule_based_response(message)
        return {
            "reply": reply,
            "intent": intent,
            "suggestedActions": actions
        }

    def _detect_intent_and_actions(self, message: str):
        msg = message.lower()
        if any(w in msg for w in ['pain', 'ache', 'symptom', 'fever', 'cough', 'sick', 'hurt']):
            return 'symptom_check', ['Book Appointment', 'Consult Doctor']
        elif any(w in msg for w in ['appointment', 'schedule', 'book', 'doctor', 'meet']):
            return 'appointment_booking', ['Book Appointment', 'View Doctors']
        elif any(w in msg for w in ['remind', 'medicine', 'pill', 'dosage', 'drug']):
            return 'medication_reminder', ['Set Medication Reminder']
        else:
            return 'general_query', ['Ask Symptom Check', 'Check Beds']

    def _generate_rule_based_response(self, message: str):
        intent, actions = self._detect_intent_and_actions(message)
        msg = message.lower()

        # Generate custom helpful content based on intent
        if intent == 'symptom_check':
            if 'chest' in msg or 'heart' in msg or 'breathing' in msg:
                reply = ("⚠️ CRITICAL: Chest pains or severe respiratory difficulty can indicate emergency health concerns. "
                         "Please consult a medical professional immediately, call emergency services, or visit the nearest ER. "
                         "Would you like me to connect you with an emergency doctor or dispatch an alert?")
                actions = ['Trigger Critical Alert', 'Call ER']
            elif 'cough' in msg or 'fever' in msg:
                reply = ("It sounds like you have symptoms of a common cold or respiratory tract infection. "
                         "Be sure to get plenty of bed rest, stay hydrated, and monitor your body temperature. "
                         "If symptoms persist or worsen, or if you develop breathing difficulties, please schedule an appointment to consult a doctor. "
                         "I can help you schedule a virtual or physical visit with a physician.")
            elif 'head' in msg or 'migraine' in msg:
                reply = ("Headaches can be caused by tension, fatigue, dehydration, or other issues. "
                         "Try resting in a dark room and drinking water. If you experience sudden, severe head pain, "
                         "vision changes, or stiff neck, please see a doctor immediately. I can help book a medical checkup.")
            else:
                reply = ("I've noted your symptoms. Since I am an AI assistant and cannot perform physical checkups, "
                         "I recommend booking a consultation with our specialized practitioners for a definitive assessment. "
                         "You can review doctor profiles and book a slot directly through our booking panel.")
        elif intent == 'appointment_booking':
            reply = ("Of course! I can assist you with scheduling a visit. "
                     "You can go to the 'Appointments' screen, browse our database of available doctors, "
                     "filter by department (e.g. ICU, Cardiology, Pediatrics), and click on any open slots to request an booking.")
        elif intent == 'medication_reminder':
            reply = ("Managing your medications on schedule is vital. "
                     "On the patient dashboard, you can review current prescriptions written by your doctor. "
                     "Would you like me to activate your browser push notifications to remind you when it's time for your next dose?")
        else:
            reply = ("Hello! I am MediBot, your virtual healthcare assistant. "
                     "I can help check symptoms, guide you on booking appointments, explain medical terms, or coordinate hospital care. "
                     "What can I do for you today?")

        return reply, intent, actions

medibot_service = MediBotService()
