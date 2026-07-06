import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Restringe una ruta del frontend a un rol especifico. Esto es solo UX: la
// seguridad real vive en el backend (cada endpoint vuelve a validar el rol),
// asi que esto solo evita que un usuario vea una pantalla que no le
// corresponde, no reemplaza la autorizacion del servidor.
export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: userRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role && userRole !== role) {
    const fallback = userRole === 'admin' ? '/admin' : '/app';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
