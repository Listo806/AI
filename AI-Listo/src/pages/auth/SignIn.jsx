import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from "react-router-dom";
import './Auth.css';
import { Eye, EyeOff } from 'lucide-react';

const t = {
  en: {
    crmBadge: 'Cortexa AI OS',
    crmTitle: 'Sign In',
    crmSubtitle: 'Access your dashboard and manage leads in real time.',
    internalBadge: 'Internal Access',
    internalTitle: 'Team Login',
    internalSubtitle: 'Sign in to access your workspace.',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    btnSignIn: 'Sign In',
    btnSigningIn: 'Signing in...',
    footerText: 'New user?',
    footerLink: 'Sign Up',
    loginFailed: 'Login failed'
  },
  es: {
    crmBadge: 'Cortexa AI OS',
    crmTitle: 'Iniciar Sesión',
    crmSubtitle: 'Acceda a su panel y gestione clientes potenciales en tiempo real.',
    internalBadge: 'Acceso Interno',
    internalTitle: 'Login de Equipo',
    internalSubtitle: 'Inicie sesión para acceder a su espacio de trabajo.',
    emailLabel: 'Correo Electrónico',
    emailPlaceholder: 'Ingrese su correo',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Ingrese su contraseña',
    btnSignIn: 'Iniciar Sesión',
    btnSigningIn: 'Iniciando sesión...',
    footerText: '¿Usuario nuevo?',
    footerLink: 'Registrarse',
    loginFailed: 'Error al iniciar sesión'
  },
  pt: {
    crmBadge: 'Cortexa AI OS',
    crmTitle: 'Entrar',
    crmSubtitle: 'Acesse seu painel e gerencie leads em tempo real.',
    internalBadge: 'Acesso Interno',
    internalTitle: 'Login da Equipe',
    internalSubtitle: 'Faça login para acessar seu espaço de trabalho.',
    emailLabel: 'E-mail',
    emailPlaceholder: 'Digite seu e-mail',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'Digite sua senha',
    btnSignIn: 'Entrar',
    btnSigningIn: 'Entrando...',
    footerText: 'Novo usuário?',
    footerLink: 'Cadastre-se',
    loginFailed: 'Falha no login'
  }
};
export default function SignIn({ variant = 'crm' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  
  const [lang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const tr = t[lang] || t.en;
  if (loading) return null;

  if (isAuthenticated()) {
    return <Navigate to="/dashboard/home" replace />;
  }
  // NOTE: Sign-in page ALWAYS shows the form, even if user is already authenticated
  // This is correct SaaS behavior - clicking "Sign In" should always show the form

  // Branding configuration based on variant
  const branding = {
    crm: {
      badge: tr.crmBadge,
      title: tr.crmTitle,
      subtitle: tr.crmSubtitle,
    },
    internal: {
      badge: tr.internalBadge,
      title: tr.internalTitle,
      subtitle: tr.internalSubtitle,
    },
  };

  const currentBranding = branding[variant] || branding.crm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-badge">{currentBranding.badge}</div>
        <h1 className="auth-title">{currentBranding.title}</h1>
        <p className="auth-subtitle">{currentBranding.subtitle}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">{tr.emailLabel}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr.emailPlaceholder}
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">{tr.passwordLabel}</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tr.passwordPlaceholder}
                required
                disabled={loading}
                style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? tr.btnSigningIn : tr.btnSignIn}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '20px' }}>
          {tr.footerText} <Link to="/sign-up">{tr.footerLink}</Link>
        </p>
      </div>
    </div>
  );
}
