import { loginWithGoogle } from '../services/api';

export default function LoginPage() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 22, padding: 24, textAlign: 'center',
    }}>
      <div>
        <h1 style={{ marginBottom: 8 }}>Portal de compras</h1>
        <p className="subtitle">Gestion de compras y productos</p>
      </div>

      <button onClick={loginWithGoogle} className="btn btn-primary" style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 14,
      }}>
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#fff" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9.1h11.9c-.5 2.8-2.1 5.1-4.4 6.7v5.5h7.1c4.2-3.9 6.5-9.6 6.5-16.7z" />
          <path fill="#fff" d="M24 46c5.9 0 10.9-2 14.6-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C8 41.1 15.4 46 24 46z" />
          <path fill="#fff" d="M11.7 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.3C2.8 17 2 20.4 2 24s.8 7 2.3 9.9z" />
          <path fill="#fff" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8 6.9 4.3 14.1l7.4 5.7c1.7-5.2 6.6-9.1 12.3-9.1z" />
        </svg>
        Continuar con Google
      </button>
    </div>
  );
}
