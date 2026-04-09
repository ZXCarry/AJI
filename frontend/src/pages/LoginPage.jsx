import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      await login(form.login, form.password);
      navigate('/');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Błąd logowania'));
    }
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h2>Logowanie</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Login"
          value={form.login}
          onChange={e => setForm({ ...form, login: e.target.value })}
        />
        <input
          type="password"
          className="form-control mb-2"
          placeholder="Hasło"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn btn-primary w-100">Zaloguj</button>
      </form>
    </div>
  );
}
