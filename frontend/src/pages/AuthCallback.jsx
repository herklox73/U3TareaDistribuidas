import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function decodeRole(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(base64)))).role;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    // React 18 StrictMode ejecuta este efecto dos veces en desarrollo. Sin
    // esta bandera, la segunda ejecucion vuelve a leer la URL cuando ya no
    // trae el token (porque la primera ejecucion ya navego), y eso manda al
    // usuario de vuelta al login por error.
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setToken(token);
      const role = decodeRole(token);
      navigate(role === 'admin' ? '/admin' : '/app', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, setToken]);

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Autenticando...
    </div>
  );
}
