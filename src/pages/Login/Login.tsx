import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = () => {
    login(
      { id: 'demo', name: 'Demo User', email: 'demo@keylime.dev', role: 'admin' },
      'demo-token'
    );
    navigate('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
            margin: '0 auto 24px',
          }}
        >
          K
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Keylime Monitoring Dashboard
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
            marginBottom: '32px',
          }}
        >
          Sign in with your identity provider to access the attestation monitoring platform.
        </p>

        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '15px',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          Sign in with OIDC/SAML
        </button>

        <button
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '15px',
            fontWeight: 500,
          }}
        >
          Demo Login (Development)
        </button>

        <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Keylime remote attestation fleet monitoring
        </p>
      </div>
    </div>
  );
}
