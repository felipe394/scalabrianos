import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

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
        <div className="login-logo-container">
          <img src="/src/assets/logo_vertical.png" alt="Scalabrianos Logo" className="login-logo" />
        </div>

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
            <a href="/forgot-password">Esqueci minha senha</a>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Login;
