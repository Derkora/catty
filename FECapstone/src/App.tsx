import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NewsDetail from './pages/NewsDetail';
import ChatbotPage from './pages/ChatbotPage';
import './App.css';
import { Toaster } from './components/ui/toaster';
import React from 'react';

// Komponen sederhana untuk Dashboard (tidak lengkap, hanya placeholder)
// const Dashboard = () => {
//   return (
//     <div className="w-full p-8">
//       <div className="container-content">
//         <h1 className="text-2xl font-bold mb-4">Dashboard Mahasiswa</h1>
//         <p>Selamat datang di Dashboard Mahasiswa Departemen Teknologi Informasi!</p>
//         <p className="mt-4">Halaman ini masih dalam pengembangan.</p>
//       </div>
//     </div>
//   );
// };

// Protected Route untuk halaman yang memerlukan autentikasi
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={
            <Dashboard />
          } 
        />
        {/* Rute untuk halaman berita detail */}
        <Route path="/news/:documentId" element={<NewsDetail />} />
        
        {/* Chatbot page route */}
        <Route path="/chatbot" element={<ChatbotPage />} />
        
        {/* Tambahan route lainnya */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
