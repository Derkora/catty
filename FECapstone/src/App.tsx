import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
// import NewsDetail from './pages/NewsDetail'; // Removed
import ChatbotPage from './pages/ChatbotPage';
import './App.css';
import { Toaster } from './components/ui/toaster';
import React from 'react';
import AdminDashboard from './pages/AdminDashboard';
// import RegisterPage from './pages/RegisterPage';


interface StrapiUser {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  role?: { 
    id: number;
    name: string;
    description: string;
    type: string;
  };
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactElement; 
  allowedRoles?: string[]; 
}) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let user: StrapiUser | null = null;

  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  }

  console.log("ProtectedRoute: User data from localStorage:", user);

  const isAuthenticated = token !== null && user !== null;

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.name;
    console.log("ProtectedRoute: Checking roles. User role:", userRole, "Allowed roles:", allowedRoles);
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log("ProtectedRoute: Not authorized, redirecting to /"); 
      return <Navigate to="/" replace />; 
    }
  }
  
  console.log("ProtectedRoute: Access granted.");
  return children;
};


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="/register" element={<RegisterPage />} /> */}
        
        {/* Protected Routes */}
    
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Mahasiswa IT']}> 
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* <Route path="/news/:documentId" element={<NewsDetail />} />  Removed */}
        
        <Route 
          path="/chatbot" 
          element={
              <ChatbotPage />
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['Admin IT']}> 
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} /> 
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
