from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Deepseek API configuration
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', 'sk-c7cfd12d60db4c2a944d8feaabab4583')
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

def create_medical_prompt(symptoms):
    """Create a structured prompt for medical assistance"""
    return f"""You are Olive, a helpful health information assistant. A user has reported the following symptoms or health concerns:

"{symptoms}"

Please provide:
1. **Possible Common Causes**: List 2-3 most likely common causes
2. **Self-Care Suggestions**: Safe, general self-care measures they can try
3. **When to Seek Medical Care**: Clear warning signs that require professional attention
4. **Over-the-Counter Considerations**: Safe OTC options they might discuss with a pharmacist

IMPORTANT MEDICAL DISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for proper medical care. If this is a medical emergency, call emergency services immediately.

Please keep your response helpful but concise, and always prioritize user safety."""

@app.route('/', methods=['GET'])
@app.route('/api', methods=['GET'])
@app.route('/api/', methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({"message": "Olive Health API is running!", "status": "healthy"})

@app.route('/api/health-check', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "message": "Olive backend is running!"})

@app.route('/api/analyze-symptoms', methods=['POST'])
def analyze_symptoms():
    """Main endpoint for symptom analysis"""
    try:
        # Get symptoms from request
        data = request.get_json()
        symptoms = data.get('symptoms', '').strip()
        
        if not symptoms:
            return jsonify({"error": "Please provide your symptoms"}), 400
        
        # Create the prompt
        prompt = create_medical_prompt(symptoms)
        
        # Prepare Deepseek API request
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-chat",  # Use the cheaper model
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1500,  # Reasonable limit for medical responses
            "temperature": 0.3,   # Lower temperature for more consistent medical info
            "stream": False
        }
        
        # Make request to Deepseek API
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            medical_advice = result['choices'][0]['message']['content']
            
            return jsonify({
                "success": True,
                "advice": medical_advice,
                "symptoms_analyzed": symptoms
            })
        else:
            return jsonify({
                "error": "Failed to get medical information",
                "details": response.text
            }), 500
            
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/emergency-check', methods=['POST'])
def emergency_check():
    """Quick check for emergency keywords"""
    data = request.get_json()
    symptoms = data.get('symptoms', '').lower()
    
    # Emergency keywords that should trigger immediate medical attention
    emergency_keywords = [
        'chest pain', 'difficulty breathing', 'shortness of breath',
        'severe abdominal pain', 'loss of consciousness', 'seizure',
        'severe bleeding', 'head injury', 'stroke', 'heart attack',
        'overdose', 'poisoning', 'suicide', 'self harm'
    ]
    
    is_emergency = any(keyword in symptoms for keyword in emergency_keywords)
    
    if is_emergency:
        return jsonify({
            "is_emergency": True,
            "message": "⚠️ Your symptoms may require immediate medical attention. Please call emergency services (911) or go to the nearest emergency room immediately."
        })
    
    return jsonify({"is_emergency": False})

# For Vercel
if __name__ == "__main__":
    app.run(debug=True)
else:
    # This is what Vercel will use
    application = app