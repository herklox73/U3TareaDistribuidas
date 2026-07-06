import { useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = { admin: 'administrador', customer: 'cliente' };

export default function Navbar() {
  const navigate = useNavigate();
  const { user, role, setToken } = useAuth();

  const handleLogout = async () => {
    await apiLogout();
    setToken(null);
    navigate('/', { replace: true });
  };

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>Portal de compras</span>
        {user && (
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {user.name}
            {role && (
              <span className={`badge ${role === 'admin' ? 'badge-admin' : 'badge-customer'}`} style={{ marginLeft: 8 }}>
                {ROLE_LABEL[role] || role}
              </span>
            )}
          </span>
        )}
      </div>
      <button className="btn btn-outline btn-sm" onClick={handleLogout}>
        Cerrar sesion
      </button>
    </nav>
  );
}
