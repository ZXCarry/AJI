import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getApiErrorMessage } from '../api/client';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ login: '', password: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setMsg('');
      await register(form.login, form.password);
      setMsg('Konto utworzone. Możesz się zalogować.');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Błąd rejestracji'));
    }
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h2>Rejestracja</h2>

      {msg && <div className="alert alert-success">{msg}</div>}
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
        <button className="btn btn-success w-100">Zarejestruj</button>
      </form>
    </div>
  );
}
