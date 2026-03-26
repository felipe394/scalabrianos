import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import logoVertical from '../assets/logo_vertical.png';
import '../styles/Login.css';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });

      if (response.data.success) {
        login(response.data.user, response.data.token);
        navigate('/home');
      } else {
        setError(response.data.message || 'Falha na autenticação');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Erro ao conectar ao servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      <div className="login-content">
        <div className="login-logo-container">
          <img src={logoVertical} alt="Scalabrianos Logo" className="login-logo" />
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
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

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Acessando...' : 'Acessar'}
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
