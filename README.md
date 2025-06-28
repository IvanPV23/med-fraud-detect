# Sistema de Detección de Fraude Médico

Un sistema completo de detección de fraude médico que combina machine learning con interpretabilidad avanzada (SHAP y LIME) y un asistente de IA especializado.

## Características Principales

### 🤖 AI Assistant Inteligente
- **Contexto Enriquecido**: El AI Assistant tiene acceso completo a:
  - Datos del proveedor (reembolsos, reclamos, beneficiarios, etc.)
  - Resultados de predicción (probabilidad de fraude, nivel de riesgo)
  - Explicaciones SHAP (contribución exacta de cada feature)
  - Explicaciones LIME (interpretación local del modelo)
  - Métricas del dashboard (condiciones crónicas, distribución de género)
  - Comparación entre métodos de interpretabilidad

- **Preguntas Sugeridas Adaptativas**: 
  - Se adaptan según el resultado de la predicción (fraude/no fraude)
  - Incluyen preguntas específicas sobre SHAP, LIME y condiciones crónicas
  - Proporcionan insights relevantes al contexto del proveedor

- **Análisis Multilingüe**: 
  - Detecta automáticamente el idioma dominante de la conversación
  - Responde siempre en el idioma principal del usuario
  - Soporte para español, inglés y portugués

### 📊 Interpretabilidad Avanzada
- **SHAP (SHapley Additive exPlanations)**: Explicaciones precisas de la contribución de cada feature
- **LIME (Local Interpretable Model-agnostic Explanations)**: Interpretación local para predicciones específicas
- **Comparación de Métodos**: Análisis de acuerdo entre SHAP y LIME
- **Visualizaciones Interactivas**: Gráficos de contribución de features con impacto positivo/negativo

### 🏥 Análisis de Proveedores
- **Dashboard Completo**: Métricas clave, condiciones crónicas, distribución demográfica
- **Predicciones Individuales**: Análisis detallado por proveedor
- **Análisis Masivo**: Procesamiento de múltiples proveedores
- **Métricas de Rendimiento**: ROC-AUC, precisión, recall, F1-score

## 🏗️ Arquitectura del Sistema

```
proyecto-ia/
├── backend/                 # Servidor FastAPI con modelo ML
│   ├── agents/             # Agentes de procesamiento
│   │   ├── ingestor.py     # Procesamiento de datos CSV
│   │   └── predictor.py    # Predicciones con modelo XGBoost
│   ├── data/               # Datos y archivos procesados
│   │   ├── test_uploaded/  # Archivos CSV subidos
│   │   └── test_final/     # test_final.csv generado
│   ├── models/             # Modelo entrenado
│   │   └── xgb_fraud_model.pkl
│   ├── metrics/            # Métricas del modelo
│   │   └── xgb_fraud_metrics.json
│   ├── main.py             # Servidor FastAPI
│   └── requirements.txt    # Dependencias Python
└── frontend/               # Aplicación React
    ├── src/
    │   ├── components/     # Componentes React
    │   ├── services/       # Servicios de API
    │   └── App.tsx         # Aplicación principal
    └── public/
        └── data/           # Datos de muestra
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Python 3.8+
- Node.js 16+
- npm o yarn

### Backend (Python/FastAPI)

1. **Navegar al directorio backend:**
   ```bash
   cd backend
   ```

2. **Crear entorno virtual:**
   ```bash
   python -m venv venv
   ```

3. **Activar entorno virtual:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Ejecutar el servidor:**
   ```bash
   python main.py
   ```

El servidor estará disponible en `http://localhost:8000`

### Frontend (React)

1. **Navegar al directorio frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:5173`

> **Nota:** El frontend está configurado para redirigir automáticamente las rutas `/api` al backend durante el desarrollo (ver `vite.config.ts`).

## 📊 Características del Sistema

### Backend API (Principales endpoints)

- **POST `/upload`** — Subir archivos CSV de test
- **POST `/ingest`** — Procesar y consolidar los archivos subidos, generar `test_final.csv`
- **POST `/predict`** — Realizar predicciones de fraude sobre los datos procesados
- **GET `/metricas`** — Obtener métricas del modelo ML
- **GET `/health`** — Verificar estado del sistema y modelo
- **GET `/api/test-final-preview`** — Obtener las primeras 10 filas de `test_final.csv` para previsualización en el frontend

### Frontend

- **Página de Inicio** — Descripción del sistema
- **Bulk Input** — Subida masiva de archivos CSV, procesamiento, preview y predicción
- **Model Overview** — Métricas y rendimiento del modelo
- **Single Prediction** — Predicciones individuales

### Modelo ML

- **Algoritmo:** XGBoost
- **Features:** Total_Reimbursed, Mean_Reimbursed, Claim_Count, Unique_Beneficiaries, Pct_Male
- **Métricas:** ROC-AUC: 94.64%, Precision: 54.86%, Recall: 75.59%

## 📁 Formato de Datos

### CSV de Entrada Requerido

```csv
Provider,TotalClaims,NumInpatientClaims,NumOutpatientClaims,TotalAmountReimbursed,MeanAmountReimbursed,AvgClaimDurationDays,NumUniqueDiagnosisCodes,NumUniqueProcedureCodes,NumUniqueBeneficiaries
PROVIDER001,1250,45,1205,4500000,3600,12.5,85,120,980
```

### CSV de Salida

```csv
Provider,Prediccion,Probabilidad_Fraude
PROVIDER001,0,0.2345
PROVIDER002,1,0.7890
```

## 🧪 Pruebas

### Probar la API

```bash
cd backend
python test_api.py
```

### Probar el Frontend

1. Abrir `http://localhost:5173`
2. Ir a "Bulk Input"
3. Cargar datos de muestra
4. Ejecutar predicciones

## 🔧 Uso del Sistema

### 1. Subir Datos

1. Navegar a "Bulk Input" en el frontend
2. Arrastrar y soltar archivos CSV o hacer clic en "Choose File"
3. Verificar que los archivos tengan los nombres y columnas requeridas
4. Los archivos se subirán automáticamente al backend

### 2. Procesar Datos

1. Hacer clic en **Process Data**
2. El sistema procesará los datos y generará las features
3. (Opcional) Hacer clic en **Toggle Preview** para ver las primeras filas del dataset consolidado

### 3. Predecir

1. Hacer clic en **Predict**
2. El sistema ejecutará las predicciones sobre los datos procesados

### 4. Ver Resultados

1. Los resultados se mostrarán en una tabla
2. Cada provider tendrá:
   - Predicción (Fraude/No Fraude)
   - Probabilidad de fraude
3. Descargar resultados en CSV

### 5. Ver Métricas del Modelo

1. Navegar a "Model Overview"
2. Ver métricas de rendimiento
3. Analizar importancia de features

## 📈 Métricas del Modelo

- **ROC-AUC:** 0.9464 (94.64%)
- **Precision:** 0.5486 (54.86%)
- **Recall:** 0.7559 (75.59%)
- **F1-Score:** 0.6358 (63.58%)

## 🔍 Troubleshooting

### Problemas Comunes

1. **Error de CORS**
   - Verificar que el backend esté corriendo en puerto 8000
   - Verificar configuración CORS en `main.py`

2. **Error de Modelo**
   - Verificar que `xgb_fraud_model.pkl` existe en `models/`
   - Verificar que las dependencias estén instaladas

3. **Error de Datos**
   - Verificar formato y nombres de archivos CSV
   - Verificar columnas requeridas
   - Verificar tipos de datos

### Logs

Los logs se muestran en la consola del backend.

## 📝 Notas Técnicas

- El modelo XGBoost fue entrenado con datos de reclamaciones médicas
- Las features se calculan automáticamente desde los datos brutos
- El sistema maneja errores de forma robusta
- La interfaz es responsive y moderna
- El código está bien documentado y modular

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles. 