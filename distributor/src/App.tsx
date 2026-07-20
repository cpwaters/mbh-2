import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import LoadsList from './pages/LoadsList';
import CreateLoad from './pages/CreateLoad';
import ClearLoads from './pages/ClearLoads';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

function AppContent() {
  const { currentUser, logout } = useAuth();

  const handleLogin = () => {
    // Authentication is handled by Firebase Auth context
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? (
        <>
          <Navigation onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<LoadsList />} />
            <Route path="/create" element={<CreateLoad />} />
            <Route path="/clear-loads" element={<ClearLoads />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
