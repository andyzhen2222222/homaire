import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from './AuthContext';

export function AuthModal() {
  const { authModalOpen, closeAuthModal, loginWithCredentials, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const result = await register({ email, password, displayName: displayName || email.split('@')[0] });
        if (!result.ok) setError(result.error);
      } else {
        const result = await loginWithCredentials({ email, adminPassword: password });
        if (!result.ok) setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-brand-gray bg-white p-8 shadow-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <button
              type="button"
              onClick={closeAuthModal}
              className="absolute right-4 top-4 text-brand-navy/40 hover:text-brand-navy"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-brand font-bold uppercase tracking-tighter text-brand-navy mb-2">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-xs text-brand-navy/50 mb-6">
              {mode === 'login'
                ? 'Access your orders and saved addresses.'
                : 'Join HOMAIRE to checkout and track orders.'}
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/50 mb-1">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-brand-gray rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/50 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-brand-gray rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/50 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-brand-gray rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-navy text-white py-3 rounded-full text-[11px] uppercase font-bold tracking-widest hover:bg-brand-beige transition-colors disabled:opacity-50"
              >
                {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Register'}
              </button>
            </form>
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-brand-navy/50 hover:text-brand-navy"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
            >
              {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
