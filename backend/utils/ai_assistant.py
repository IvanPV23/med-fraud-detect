import os
from .config import GEMINI_API_KEY_B64, gemini_model
from langdetect import detect
import google.generativeai as genai
from collections import Counter
import base64

# Preguntas sugeridas reconocidas por el modelo (deben ser respondidas siempre)
SUGGESTED_QUESTIONS = [
    '¿Por qué el modelo marcó este proveedor como posible fraude?',
    '¿Qué patrones sugieren actividad sospechosa?',
    '¿Cómo se compara este proveedor con otros?',
    '¿Qué métricas específicas contribuyeron más?',
    '¿Cómo detecta el sistema el fraude médico?',
    '¿Qué métricas son más importantes para identificar fraude?',
    '¿Cómo puedo interpretar una predicción de fraude?',
    '¿Qué significa un alto riesgo de fraude?',
    '¿Cómo funciona la explicación SHAP?',
    '¿Qué recomendaciones hay para reducir el fraude?',
    '¿Por qué el modelo marcó este caso como posible fraude?',
    '¿Qué métricas contribuyeron más a la predicción?',
    '¿Cómo puedo reducir el riesgo de fraude?',
    '¿Qué significa la explicación LIME/SHAP?',
    '¿Qué nos dicen las explicaciones SHAP y LIME?',
    '¿Qué condiciones crónicas son más relevantes?',
    '¿Por qué el modelo considera que este proveedor no es fraudulento?',
    '¿Qué patrones sugieren actividad normal?',
    '¿Qué métricas contribuyeron a la clasificación como no fraude?'
]

ALLOWED_TOPICS = [
    "fraude médico", "fraude en salud", "detección de fraude", "explicación de predicción", "métricas de fraude", "riesgo de fraude", "modelo de fraude", "SHAP", "LIME", "proveedor sospechoso", "análisis de proveedor", "patrones de fraude", "condiciones crónicas", "comparación de métodos", "interpretabilidad del modelo", "features importantes", "contribución de variables"
]

def get_gemini_api_key():
    return base64.b64decode(GEMINI_API_KEY_B64).decode()

# Inicialización de Gemini
if GEMINI_API_KEY_B64:
    genai.configure(api_key=get_gemini_api_key())

def is_fraud_topic(message: str) -> bool:
    message_lower = message.lower()
    # Si la pregunta es una de las sugeridas, siempre responder
    for q in SUGGESTED_QUESTIONS:
        if q.lower() in message_lower or message_lower in q.lower():
            return True
    # Tolerancia temática ampliada: si contiene palabras clave o frases relacionadas
    for topic in ALLOWED_TOPICS:
        if topic in message_lower:
            return True
    keywords = ["fraude", "salud", "médico", "riesgo", "modelo", "explicación", "proveedor", "predicción", "shap", "lime", "análisis", "métricas", "riesgo", "patrones", "condiciones", "crónicas", "interpretabilidad", "features", "contribución", "comparación", "métodos"]
    return any(k in message_lower for k in keywords)

def is_fraud_topic_history(history):
    # Si cualquier mensaje del historial es relevante, se acepta la conversación
    for msg in history:
        if is_fraud_topic(msg.get('text', '')):
            return True
    return False

def get_language(message: str) -> str:
    try:
        return detect(message)
    except Exception:
        return "es"

def get_dominant_language(history, fallback_lang="es"):
    # Analiza solo los últimos 10 mensajes del usuario
    user_msgs = [msg.get('text', '') for msg in history[-10:] if msg.get('role') == 'user']
    langs = [get_language(m) for m in user_msgs if m.strip()]
    if langs:
        most_common = Counter(langs).most_common(1)[0][0]
        return most_common
    return fallback_lang

async def ai_assistant_chat(user_message: str, context: dict):
    """
    Función principal para interactuar con el AI Assistant.
    """
    history = context.get('history', [])
    # Detectar idioma dominante del historial
    dominant_lang = get_dominant_language(history, fallback_lang=get_language(user_message))
    # Validar tópico sobre historial si existe, si no sobre el mensaje
    if history:
        if not is_fraud_topic_history(history):
            return {
                "success": False,
                "response": get_out_of_scope_message(dominant_lang),
                "lang": dominant_lang
            }
    else:
        if not is_fraud_topic(user_message):
            return {
                "success": False,
                "response": get_out_of_scope_message(dominant_lang),
                "lang": dominant_lang
            }
    if not GEMINI_API_KEY_B64:
        return {
            "success": False,
            "response": "No se ha configurado la API key de Gemini. Por favor, contacta al administrador.",
            "lang": dominant_lang
        }
    lang = dominant_lang
    prompt = build_prompt(user_message, context, lang)
    try:
        model = genai.GenerativeModel(gemini_model)
        response = await model.generate_content_async(prompt)
        answer = response.text if hasattr(response, 'text') else str(response)
        return {
            "success": True,
            "response": answer,
            "lang": lang
        }
    except Exception as e:
        return {
            "success": False,
            "response": f"Error al consultar Gemini: {str(e)}",
            "lang": lang
        }

def get_out_of_scope_message(lang: str) -> str:
    # Mensaje de fuera de ámbito en varios idiomas
    if lang.startswith('es'):
        return "Lo siento, solo puedo responder preguntas relacionadas con fraude médico y análisis de predicciones de fraude. Por favor, realiza una consulta sobre ese tema."
    if lang.startswith('en'):
        return "Sorry, I can only answer questions related to medical fraud and fraud prediction analysis. Please ask about that topic."
    if lang.startswith('pt'):
        return "Desculpe, só posso responder perguntas relacionadas a fraude médica e análise de previsões de fraude. Por favor, faça uma consulta sobre esse tema."
    # Por defecto, español
    return "Lo siento, solo puedo responder preguntas relacionadas con fraude médico y análisis de predicciones de fraude. Por favor, realiza una consulta sobre ese tema."

def build_prompt(user_message: str, context: dict, lang: str) -> str:
    """
    Construye el prompt para Gemini, incluyendo historial de conversación y contexto relevante.
    """
    idioma = {
        'es': 'español',
        'en': 'English',
        'pt': 'portugués'
    }.get(lang[:2], 'español')
    
    base = (
        f"Eres un asistente experto en análisis de fraude médico. "
        f"Responde SIEMPRE en {idioma}, sin importar el idioma de la pregunta o el contexto. "
        "Solo puedes responder preguntas sobre fraude médico, detección de fraude, explicaciones de modelos de predicción, métricas de riesgo y análisis de proveedores sospechosos. "
        "Si la pregunta no es relevante, responde que solo puedes hablar de fraude médico. "
        f"Responde SIEMPRE en {idioma}.\n"
    )
    
    # Incluir historial de conversación si existe
    history = context.get('history', [])
    history_str = ""
    if history:
        for msg in history[-10:]:
            role = msg.get('role', 'user')
            prefix = "Usuario:" if role == 'user' else "Asistente:"
            history_str += f"{prefix} {msg.get('text', '').strip()}\n"
    
    # Construir contexto enriquecido
    contexto = build_enriched_context(context, idioma)
    
    return f"{base}{history_str}{contexto}\nPregunta del usuario: {user_message}\nRespuesta experta (en {idioma}):"

def build_enriched_context(context: dict, idioma: str) -> str:
    """
    Construye un contexto enriquecido con información detallada de SHAP, LIME y dashboard.
    """
    if not context:
        return ""
    
    contexto_parts = []
    
    # Información del proveedor
    provider = context.get('provider')
    if provider:
        contexto_parts.append(f"INFORMACIÓN DEL PROVEEDOR:")
        contexto_parts.append(f"- Nombre: {provider.get('Provider', 'N/A')}")
        contexto_parts.append(f"- Total Reembolsado: ${provider.get('Total_Reimbursed', 0):,.2f}")
        contexto_parts.append(f"- Reembolso Promedio: ${provider.get('Mean_Reimbursed', 0):,.2f}")
        contexto_parts.append(f"- Número de Reclamos: {provider.get('Claim_Count', 0):,}")
        contexto_parts.append(f"- Beneficiarios Únicos: {provider.get('Unique_Beneficiaries', 0):,}")
        contexto_parts.append(f"- Edad Promedio: {provider.get('Avg_Age', 0):.1f} años")
        contexto_parts.append(f"- Porcentaje Masculino: {provider.get('Pct_Male', 0) * 100:.1f}%")
    
    # Resultado de la predicción
    prediction = context.get('prediction')
    if prediction:
        contexto_parts.append(f"\nRESULTADO DE LA PREDICCIÓN:")
        contexto_parts.append(f"- Predicción: {'FRAUDE DETECTADO' if prediction.get('Prediccion') == 1 else 'NO FRAUDE'}")
        contexto_parts.append(f"- Probabilidad de Fraude: {prediction.get('Probabilidad_Fraude', 0) * 100:.1f}%")
        contexto_parts.append(f"- Nivel de Riesgo: {'Alto' if prediction.get('Probabilidad_Fraude', 0) > 0.7 else 'Medio' if prediction.get('Probabilidad_Fraude', 0) > 0.5 else 'Bajo'}")
    
    # Explicaciones SHAP y LIME
    explanations = context.get('explanations')
    if explanations:
        contexto_parts.append(f"\nEXPLICACIONES DEL MODELO:")
        
        # SHAP Explanation
        shap_explanation = explanations.get('shap_explanation')
        if shap_explanation and 'error' not in shap_explanation:
            contexto_parts.append(f"SHAP (SHapley Additive exPlanations):")
            feature_contributions = shap_explanation.get('feature_contributions', [])
            for i, contrib in enumerate(feature_contributions[:5]):  # Top 5 features
                impacto = "positivo" if contrib.get('impact') == 'positive' else "negativo"
                contexto_parts.append(f"  {i+1}. {contrib.get('feature', 'N/A')}: {contrib.get('shap_value', 0):.4f} ({impacto}) - Valor: {contrib.get('value', 0):,.0f}")
        
        # LIME Explanation
        lime_explanation = explanations.get('lime_explanation')
        if lime_explanation and 'error' not in lime_explanation:
            contexto_parts.append(f"LIME (Local Interpretable Model-agnostic Explanations):")
            feature_contributions = lime_explanation.get('feature_contributions', [])
            for i, contrib in enumerate(feature_contributions[:5]):  # Top 5 features
                impacto = "positivo" if contrib.get('impact') == 'positive' else "negativo"
                contexto_parts.append(f"  {i+1}. {contrib.get('feature', 'N/A')}: {contrib.get('weight', 0):.4f} ({impacto}) - Valor: {contrib.get('value', 0):,.0f}")
    
    # Dashboard y métricas adicionales
    dashboard = context.get('dashboard')
    if dashboard:
        contexto_parts.append(f"\nMÉTRICAS ADICIONALES DEL DASHBOARD:")
        
        # Condiciones crónicas
        chronic_conditions = dashboard.get('chronicConditions', [])
        if chronic_conditions:
            contexto_parts.append(f"Condiciones Crónicas (prevalencia):")
            for condition in chronic_conditions[:5]:  # Top 5 conditions
                contexto_parts.append(f"  - {condition.get('name', 'N/A')}: {condition.get('value', 0):.2f}")
        
        # Distribución de género
        gender_data = dashboard.get('genderData', [])
        if gender_data:
            contexto_parts.append(f"Distribución de Género:")
            for gender in gender_data:
                contexto_parts.append(f"  - {gender.get('name', 'N/A')}: {gender.get('value', 0):.1f}%")
    
    # Comparación de explicaciones si ambas están disponibles
    if explanations:
        shap_explanation = explanations.get('shap_explanation')
        lime_explanation = explanations.get('lime_explanation')
        
        if (shap_explanation and 'error' not in shap_explanation and 
            lime_explanation and 'error' not in lime_explanation):
            
            shap_top = [f['feature'] for f in shap_explanation.get('feature_contributions', [])[:3]]
            lime_top = [f['feature'] for f in lime_explanation.get('feature_contributions', [])[:3]]
            
            contexto_parts.append(f"\nCOMPARACIÓN DE EXPLICACIONES:")
            contexto_parts.append(f"Top 3 features SHAP: {', '.join(shap_top)}")
            contexto_parts.append(f"Top 3 features LIME: {', '.join(lime_top)}")
            
            # Calcular acuerdo
            shap_set = set(shap_top)
            lime_set = set(lime_top)
            agreement = len(shap_set & lime_set)
            contexto_parts.append(f"Acuerdo entre métodos: {agreement}/3 features coinciden")
    
    return "\n".join(contexto_parts) if contexto_parts else "" 