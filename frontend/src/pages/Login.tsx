import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, just navigate to home
    console.log('Logging in with:', email, password);
    navigate('/home');
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      <div className="login-content">
        <h1 className="login-title">SCALABRIANOS</h1>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Lembrar minha senha</span>
            </label>
          </div>

          <button type="submit" className="login-button">
            Acessar
          </button>

          <div className="login-footer">
            <a href="/register">Cadastrar-se</a>
            <span className="separator">|</span>
            <a href="/forgot-password">Esqueci minha senha</a>
          </div>
        </form>
      </div>

      <style>{`
        .login-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background-image: url('/src/assets/login-bg.png');
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .login-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(30, 90, 230, 0.85); /* Deep blue with opacity */
          z-index: 1;
        }

        .login-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 400px;
          text-align: center;
          padding: 2rem;
        }

        .login-title {
          color: white;
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 2.5rem;
          letter-spacing: 2px;
          text-align: center;
          margin-left: -30px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          position: relative;
        }

        .input-group input {
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: 50px;
          border: none;
          background-color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          outline: none;
        }

        .password-group {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          display: flex;
          align-items: center;
        }

        .login-options {
          display: flex;
          justify-content: flex-start;
          padding-left: 0.5rem;
          margin: 0.5rem 0;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .remember-me input {
          width: 16px;
          height: 16px;
        }

        .login-button {
          padding: 1rem;
          border-radius: 50px;
          border: none;
          background-color: #3b82f6;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 1rem;
        }

        .login-button:hover {
          background-color: #2563eb;
        }

        .login-footer {
          margin-top: 2rem;
          color: white;
          font-size: 0.9rem;
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .login-footer a {
          color: white;
          text-decoration: none;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        .separator {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export default Login;
