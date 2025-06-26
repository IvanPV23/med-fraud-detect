import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { HomePage } from './components/pages/HomePage';
import { ModelOverviewPage } from './components/pages/ModelOverviewPage';
import { BulkInputPage } from './components/pages/BulkInputPage';
import { SinglePredictionPage } from './components/pages/SinglePredictionPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
        <Navigation />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/model-overview" element={<ModelOverviewPage />} />
            <Route path="/bulk-input" element={<BulkInputPage />} />
            <Route path="/single-prediction" element={<SinglePredictionPage />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
