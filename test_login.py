import requests
import json

# Test del endpoint de login
url = "http://127.0.0.1:8080/api/auth/login"
data = {"username": "admin", "password": "admin"}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✓ Login exitoso")
        token_data = response.json()
        print(f"Token: {token_data.get('token', 'No token found')}")
    else:
        print("✗ Login falló")
        
except requests.exceptions.RequestException as e:
    print(f"Error de conexión: {e}")