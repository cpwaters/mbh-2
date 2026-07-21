import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ActiveJobs from './pages/ActiveJobs';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import Earnings from './pages/Earnings';
import DrivingTime from './pages/DrivingTime';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import EditProfile from './pages/EditProfile';
import AddVehicle from './pages/AddVehicle';

function AppContent() {
  const { currentUser, logout } = useAuth();

  const handleLogin = () => {
    // Authentication is handled by Firebase Auth context
    // This is just to maintain compatibility with the Login component
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
          <div className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/active" element={<ActiveJobs />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/driving" element={<DrivingTime />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/earnings" element={<Earnings />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/vehicles/add" element={<AddVehicle />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignUp onSignUp={handleLogin} />} />
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
