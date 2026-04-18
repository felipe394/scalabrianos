import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logoVertical from '../assets/logo_vertical.png';
import '../styles/Login.css'; // Reusing Login styles for layout

const ForgotPassword: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would call the API
        console.log('Resetting password for:', email);
        setIsSent(true);
    };

    return (
        <div className="login-container">
            <div className="login-overlay"></div>
            <div className="login-content">
                <div className="login-logo-container">
                    <img src={logoVertical} alt="Scalabrianos Logo" className="login-logo" />
                </div>

                {!isSent ? (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>{t('forgot.title')}</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {t('forgot.description')}
                        </p>

                        <div className="input-group">
                            <input
                                type="email"
                                placeholder={t('forgot.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-button">
                            {t('forgot.submit')}
                        </button>

                        <div className="login-footer">
                            <button
                                onClick={() => navigate('/login')}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {t('forgot.back_to_login')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="login-form">
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>{t('forgot.success_title')}</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {t('forgot.success_desc')}
                        </p>
                        <button onClick={() => navigate('/login')} className="login-button">
                            {t('forgot.back_to_login')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
