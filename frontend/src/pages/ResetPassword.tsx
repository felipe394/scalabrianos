import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, KeyRound } from 'lucide-react';
import logoVertical from '../assets/logo_vertical.png';
import '../styles/Login.css';
import api from '../api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordStrong = newPassword.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim()) { setStatus('error'); setErrorMsg('Informe o seu e-mail de acesso.'); return; }
    if (!passwordStrong) { setStatus('error'); setErrorMsg('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (!passwordsMatch) { setStatus('error'); setErrorMsg('As senhas não conferem.'); return; }

    setIsLoading(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      await api.post('/auth/reset-password', { login: login.trim(), newPassword });
      setStatus('success');

      // countdown 3s then redirect
      let c = 3;
      setCountdown(c);
      const interval = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(interval);
          navigate('/login');
        }
      }, 1000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.response?.data?.message || 'Erro ao redefinir senha. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay" />
      <div className="login-content">
        <div className="login-logo-container">
          <img src={logoVertical} alt="Scalabrianos Logo" className="login-logo" />
        </div>

        {status === 'success' ? (
          /* ── Success state ── */
          <div className="login-form" style={{ textAlign: 'center', gap: '1.25rem' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
              border: '1.5px solid #6ee7b7', borderRadius: '18px', padding: '32px 24px',
            }}>
              <CheckCircle size={52} color="#059669" strokeWidth={1.5} />
              <h2 style={{ margin: 0, color: '#065f46', fontWeight: 800, fontSize: '1.35rem' }}>
                Senha redefinida!
              </h2>
              <p style={{ color: '#047857', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                Sua senha foi atualizada com sucesso.<br />
                Você será redirecionado para o login em <strong>{countdown}s</strong>.
              </p>
            </div>
            <button className="login-button" onClick={() => navigate('/login')}>
              Ir para o Login agora
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form className="login-form" onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <KeyRound size={22} color="var(--primary)" />
                <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>Primeiro Acesso</h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', margin: 0 }}>
                Defina uma nova senha para a sua conta.
              </p>
            </div>

            {/* E-mail */}
            <div className="input-group">
              <input
                id="reset-email"
                type="email"
                placeholder="Seu e-mail de acesso"
                value={login}
                onChange={e => { setLogin(e.target.value); setStatus('idle'); }}
                required
                autoFocus
              />
            </div>

            {/* Nova senha */}
            <div className="input-group">
              <div className="password-group">
                <input
                  id="reset-new-password"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setStatus('idle'); }}
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button type="button" className="password-toggle" onClick={() => setShowNew(p => !p)}>
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div className="input-group">
              <div className="password-group">
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setStatus('idle'); }}
                  required
                  style={{
                    paddingRight: '3rem',
                    borderColor: confirmPassword
                      ? (passwordsMatch ? '#10b981' : '#ef4444')
                      : undefined,
                  }}
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirm(p => !p)}>
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                  fontSize: '0.8rem', fontWeight: 600,
                  color: passwordsMatch ? '#059669' : '#dc2626',
                }}>
                  {passwordsMatch
                    ? <><CheckCircle size={14} /> As senhas conferem</>
                    : <><XCircle size={14} /> As senhas não conferem</>
                  }
                </div>
              )}
            </div>

            {/* Error message */}
            {status === 'error' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: '10px', padding: '12px 16px',
                color: '#b91c1c', fontSize: '0.88rem', fontWeight: 600,
              }}>
                <XCircle size={18} />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Redefinir Senha'}
            </button>

            <div className="login-footer">
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                ← Voltar para o Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
