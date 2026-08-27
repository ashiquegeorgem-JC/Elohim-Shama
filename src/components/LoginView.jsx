import React, { useState } from 'react';
import { CHURCH_NAME, APP_NAME, APP_TAGLINE } from '../types/constants';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@bethesdaagchurch.org');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Admin-only authentication validation
      if (email.trim().toLowerCase() === 'admin@bethesdaagchurch.org' && password === 'admin123') {
        const sessionUser = {
          name: 'Administrator',
          email: 'admin@bethesdaagchurch.org',
          role: 'Admin',
          church: CHURCH_NAME,
          loginAt: new Date().toISOString()
        };
        onLoginSuccess(sessionUser);
      } else {
        setError('Invalid administrative credentials. Please check your email and password.');
        setLoading(false);
      }
    }, 400);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setIsForgotPasswordOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient & Watermark */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sand/60 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-sand rounded-3xl p-8 sm:p-10 shadow-card z-10 space-y-6">
        
        {/* Official Church Branding Header */}
        <div className="text-center space-y-3">
          <img
            src="/church-logo.jpg"
            alt="Bethesda AG Church Logo"
            className="w-24 h-24 object-contain rounded-xl mx-auto"
          />
          <div className="space-y-0.5">
            <h1 className="font-display font-extrabold text-2xl text-charcoal tracking-wide">
              ELOHIM SHAMA
            </h1>
            <p className="text-xs font-bold text-gold-dark tracking-[0.2em] uppercase">
              BETHESDA AG CHURCH
            </p>
          </div>
          <p className="text-xs text-muted-text font-medium pt-1">
            {APP_TAGLINE}
          </p>
        </div>

        {/* Notice Banner */}
        <div className="bg-cream border border-sand/80 rounded-2xl p-4 text-xs text-muted-text flex items-start gap-3">
          <i className="ti ti-shield-lock text-gold text-base shrink-0 mt-0.5"></i>
          <p className="leading-relaxed font-light">
            Private Admin Portal for Bethesda AG Church. Only authorized prayer coordinators may sign in. Church members do not need accounts.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-xs flex items-center gap-2">
            <i className="ti ti-alert-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal mb-1.5">Admin Email</label>
            <div className="relative">
              <i className="ti ti-mail absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text text-sm"></i>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bethesdaagchurch.org"
                className="w-full bg-cream/70 border border-sand rounded-xl pl-10 pr-4 py-2.5 text-xs text-charcoal placeholder-slate-400 focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-charcoal">Password</label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-[11px] text-gold-dark hover:text-gold font-semibold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <i className="ti ti-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text text-sm"></i>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-cream/70 border border-sand rounded-xl pl-10 pr-4 py-2.5 text-xs text-charcoal placeholder-slate-400 focus:bg-white focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-dark text-charcoal font-bold py-3 rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-50 tracking-wider uppercase"
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2 animate-spin text-sm"></i>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <i className="ti ti-login text-sm"></i>
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="pt-4 border-t border-sand/60 text-center">
          <p className="text-[11px] text-muted-text">
            Demo Access: <span className="text-charcoal font-mono font-bold">admin@bethesdaagchurch.org</span> / <span className="text-charcoal font-mono font-bold">admin123</span>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-sand rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-charcoal">Reset Admin Password</h3>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-muted-text hover:text-charcoal"
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            {forgotSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs text-center space-y-2">
                <i className="ti ti-circle-check text-2xl block mx-auto text-emerald-600"></i>
                <p className="font-bold">Reset instructions sent!</p>
                <p className="text-[11px] text-muted-text">Please check your inbox at {forgotEmail}</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <p className="text-muted-text leading-relaxed">
                  Enter your registered administrator email address to receive password recovery instructions.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="admin@bethesdaagchurch.org"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-cream border border-sand rounded-xl px-3.5 py-2 text-xs text-charcoal focus:bg-white focus:border-gold outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-sand text-muted-text hover:bg-cream"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gold hover:bg-gold-dark text-charcoal font-bold px-4 py-1.5 rounded-xl text-xs shadow-sm"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-muted-text">
        <p>{CHURCH_NAME} — {APP_NAME}</p>
      </footer>
    </div>
  );
}
