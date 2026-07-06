import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function Shell({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/admin/*" element={
          <ProtectedRoute role="admin">
            <Shell><AdminDashboard /></Shell>
          </ProtectedRoute>
        } />
        <Route path="/app/*" element={
          <ProtectedRoute role="customer">
            <Shell><CustomerDashboard /></Shell>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
