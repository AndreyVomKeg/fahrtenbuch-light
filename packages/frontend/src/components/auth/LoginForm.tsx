import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LoginForm() {
  const { login, loginDemo } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError('');
    setLoading(true);
    try {
      await loginDemo();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xl font-bold text-white">
          FL
        </div>
        <h1 className="text-page-header">{t('auth.login.title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('auth.login.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('auth.email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('auth.password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      <div className="mt-4">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs text-text-muted">oder</span>
          </div>
        </div>

        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text hover:bg-background disabled:opacity-50"
        >
          {t('auth.demo')}
        </button>
      </div>
    </div>
  );
}
