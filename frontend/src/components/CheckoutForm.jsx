import React, { useState } from 'react';

export default function CheckoutForm({ onSubmit, submitting = false }) {
  const [form, setForm] = useState({
    user_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState([]);

  function validate() {
    const e = [];

    if (!form.user_name.trim()) e.push('Podaj nazwę użytkownika');

    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      e.push('Podaj poprawny email');
    }

    if (!form.phone.trim() || !/^[0-9+()\s-]+$/.test(form.phone)) {
      e.push('Podaj poprawny numer telefonu');
    }

    if (!form.address.trim() || form.address.trim().length < 5) {
      e.push('Podaj adres dostawy (min. 5 znaków)');
    }

    setErrors(e);
    return e.length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      user_name: form.user_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });
  }

  return (
    <div className="card mt-3">
      <div className="card-body">
        <h5 className="mb-3">Dane kontaktowe i dostawa</h5>

        {errors.length > 0 && (
          <div className="alert alert-warning">
            <ul className="mb-0">
              {errors.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="form-label">Nazwa użytkownika</label>
            <input
              className="form-control"
              value={form.user_name}
              onChange={(e) => setForm({ ...form, user_name: e.target.value })}
              placeholder="np. Jan Kowalski"
              required
            />
          </div>

          <div className="mb-2">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="np. jan@example.com"
              required
            />
          </div>

          <div className="mb-2">
            <label className="form-label">Telefon</label>
            <input
              type="tel"
              className="form-control"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="np. +48 500 600 700"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Adres dostawy</label>
            <input
              className="form-control"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="np. ul. Kwiatowa 12/3, 00-000 Warszawa"
              required
            />
            <div className="form-text">
              Podaj pełny adres (ulica, numer, kod, miasto).
            </div>
          </div>

          <button className="btn btn-success" disabled={submitting}>
            {submitting ? 'Wysyłanie…' : 'Złóż zamówienie'}
          </button>
        </form>
      </div>
    </div>
  );
}
