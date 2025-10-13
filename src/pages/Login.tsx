import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { validateLoginForm, sanitizeEmail, type LoginFormData } from '@/utils/validation';
import { info, error as logError } from '@/utils/logger';
import '@/styles/login.css';

const THEME_STORAGE_KEY = 'klycs-theme-override';

const resolveTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const theme = resolveTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const formData: LoginFormData = {
      email: sanitizeEmail(email),
      password: password.trim(),
    };

    const validation = validateLoginForm(formData);
    if (!validation.success) {
      setFieldErrors(validation.errors || {});
      setLoading(false);
      return;
    }

    try {
      const result = await authService.signIn(formData.email, formData.password);
      if (result.success) {
        info('Login successful', { component: 'login', email: formData.email });
        navigate('/dashboard');
        return;
      }
      setError(result.error || 'Error al iniciar sesión.');
    } catch (err) {
      logError('Login failed', err, { component: 'login', email: formData.email });
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      info('Attempting Google sign in', { component: 'login' });
      const result = await authService.signInWithGoogle();

      if (result.success) {
        info('Google login successful', { component: 'login', userId: result.user?.uid });
        navigate('/dashboard');
        return;
      }

      setError(result.error || 'Error al iniciar sesión con Google.');
    } catch (err) {
      logError('Google login failed', err, { component: 'login' });
      setError('Error inesperado con Google. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-brand">
          <span className="login-brand__icon">K</span>
          <span className="login-brand__text">KLYCS</span>
        </Link>

        <header className="login-card__header">
          <h1 className="login-card__title">Inicia sesión</h1>
          <p className="login-card__subtitle">
            Accede a tu panel para gestionar tarjetas, reservas y clientes.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email" className="login-label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="login-input"
            />
            {fieldErrors.email && (
              <p className="login-field-error">{fieldErrors.email}</p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="login-input"
            />
            {fieldErrors.password && (
              <p className="login-field-error">{fieldErrors.password}</p>
            )}
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <div className="login-actions">
          <button
            type="button"
            className="login-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Acceder con Google
          </button>

          <p className="login-register">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="login-register__link">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
