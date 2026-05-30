import requests
import os
from config.database import Config

class SambaNovaClient:
    def __init__(self):
        self.api_key = Config.SAMBANOVA_API_KEY
        self.base_url = "https://api.sambanova.ai/v1"  # Replace with actual SambaNova API URL
        
    def generate_response(self, prompt, max_tokens=1000, temperature=0.7):
        """
        Generate response using SambaNova API
        """
        if not self.api_key:
            return "SambaNova API key not configured. Please set SAMBANOVA_API_KEY environment variable."
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "sambanova-llm",  # Replace with actual model name
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "No response generated")
            else:
                return f"API Error: {response.status_code} - {response.text}"
                
        except requests.exceptions.RequestException as e:
            return f"Request failed: {str(e)}"
        except Exception as e:
            return f"Unexpected error: {str(e)}"
    
    def analyze_medical_text(self, text, analysis_type="general"):
        """
        Specialized method for medical text analysis
        """
        prompts = {
            "symptoms": f"Analyze these symptoms and provide possible conditions: {text}",
            "lab_results": f"Interpret these lab results: {text}",
            "general": f"Provide medical insights for: {text}"
        }
        
        prompt = prompts.get(analysis_type, prompts["general"])
        return self.generate_response(prompt)