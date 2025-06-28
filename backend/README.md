## 🤖 Asistente de IA (AI Assistant)

El sistema incluye un asistente conversacional basado en Gemini (modelo gemini-2.5-flash) especializado en análisis de fraude médico. Este asistente puede responder preguntas sobre resultados de predicción, métricas, patrones de fraude y explicaciones del modelo. Solo responde preguntas relacionadas con fraude médico.

### Configuración

1. Crea el archivo `backend/utils/config.py` y coloca tu API key de Gemini:

```python
GEMINI_API_KEY = "TU_API_KEY_AQUI"  # Reemplaza por tu clave real
GEMINI_MODEL = "gemini-2.5-flash"
```

2. Instala las dependencias necesarias:

```bash
pip install -r requirements.txt
```

### Uso

- El asistente está disponible en todas las páginas principales, en el detalle de proveedor y en la predicción individual.
- Si la pregunta no es relevante para fraude médico, el asistente responderá que está fuera de su ámbito.
- El idioma por defecto es español, pero puede responder en otros idiomas si la pregunta lo requiere. 