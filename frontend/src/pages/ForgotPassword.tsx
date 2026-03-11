import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Reusing Login styles for layout

const ForgotPassword: React.FC = () => {
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
                    <img src="/src/assets/logo_vertical.png" alt="Scalabrianos Logo" className="login-logo" />
                </div>

                {!isSent ? (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>Recuperar Senha</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Digite seu e-mail abaixo. Enviaremos um link para você redefinir sua senha.
                        </p>

                        <div className="input-group">
                            <input
                                type="email"
                                placeholder="Seu e-mail cadastrado"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="login-button">
                            Enviar Link de Recuperação
                        </button>

                        <div className="login-footer">
                            <button
                                onClick={() => navigate('/login')}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Voltar para Login
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="login-form">
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>E-mail Enviado!</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link em alguns instantes.
                        </p>
                        <button onClick={() => navigate('/login')} className="login-button">
                            Voltar ao Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
