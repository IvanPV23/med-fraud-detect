import { AiAssistantChat } from '../ui/AiAssistantChat';
import { MessageCircle } from 'lucide-react';

export function AiAssistantPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">AI Fraud Analysis Assistant</h1>
          <p className="text-gray-600">Ask your questions about medical fraud, prediction analysis, and model explanations.</p>
        </div>
      </div>
      <AiAssistantChat
        styleVariant="card"
        suggestedQuestions={[
          '¿Cómo detecta el sistema el fraude médico?',
          '¿Qué métricas son más importantes para identificar fraude?',
          '¿Cómo puedo interpretar una predicción de fraude?',
          '¿Qué significa un alto riesgo de fraude?',
          '¿Cómo funciona la explicación SHAP?',
          '¿Qué recomendaciones hay para reducir el fraude?'
        ]}
        title="AI Assistant"
        description="Expert assistant in medical fraud. Ask anything about analysis, metrics, and explanations."
      />
    </div>
  );
}

// Animaciones Tailwind personalizadas (puedes agregarlas en tu CSS global):
// .animate-fade-in { animation: fadeIn 0.7s ease; }
// .animate-bounce-in { animation: bounceIn 0.7s cubic-bezier(.68,-0.55,.27,1.55); }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes bounceIn { 0% { transform: scale(0.7); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } } 