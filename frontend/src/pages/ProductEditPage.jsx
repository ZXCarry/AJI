import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getProduct,
  getCategories,
  updateProduct,
  getProductSeoDescription,
} from '../api/endpoints';

import { getApiErrorMessage } from '../api/client';

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    unit_price: '',
    unit_weight: '',
    description: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setError('');
        setMsg('');
        setLoading(true);

        const [p, c] = await Promise.all([getProduct(id), getCategories()]);
        setCategories(c);

        setForm({
          name: p.name ?? '',
          category_id: p.category_id ?? '',
          unit_price: p.unit_price ?? '',
          unit_weight: p.unit_weight ?? '',
          description: p.description ?? '',
        });
      } catch (e) {
        setError(getApiErrorMessage(e, 'Nie udało się pobrać danych produktu'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleOptimize() {
    try {
      setError('');
      setMsg('');
      setSeoLoading(true);

      const html = await getProductSeoDescription(id);
      setForm((prev) => ({ ...prev, description: html }));

      setMsg('Opis został zoptymalizowany. Możesz go jeszcze poprawić i zapisać.');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Nie udało się zoptymalizować opisu'));
    } finally {
      setSeoLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    try {
      setError('');
      setMsg('');
      setSaving(true);

      const payload = {
        category_id: Number(form.category_id),
        unit_price: Number(form.unit_price),
        unit_weight: Number(form.unit_weight),
        description: String(form.description ?? ''),
      };

      await updateProduct(id, payload);

      setMsg('Zapisano zmiany produktu.');
    } catch (e2) {
      setError(getApiErrorMessage(e2, 'Nie udało się zapisać produktu'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-muted">Ładowanie...</div>;
  }

  return (
    <div className="container py-3" style={{ maxWidth: 960 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-1">Edycja produktu</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>
            Uzupełnij dane produktu i zapisz zmiany.
          </div>
        </div>

        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Wróć
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSave}>
            {/* Nazwa (podgląd) */}
            <div className="mb-3">
              <label className="form-label">Nazwa produktu</label>
              <input className="form-control" value={form.name || ''} disabled />
              <div className="form-text">Pole tylko do podglądu (nazwa nie jest edytowana).</div>
            </div>

            <div className="row g-3">
              {/* Kategoria */}
              <div className="col-12 col-md-4">
                <label className="form-label">Kategoria</label>
                <select
                  className="form-select"
                  value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>
                    -- wybierz --
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cena */}
              <div className="col-12 col-md-4">
                <label className="form-label">Cena (zł)</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.01"
                  min="0"
                  value={form.unit_price}
                  onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))}
                  placeholder="np. 69.90"
                  required
                />
                <div className="form-text">Wpisz cenę dodatnią.</div>
              </div>

              {/* Waga */}
              <div className="col-12 col-md-4">
                <label className="form-label">Waga (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.001"
                  min="0"
                  value={form.unit_weight}
                  onChange={(e) => setForm((p) => ({ ...p, unit_weight: e.target.value }))}
                  placeholder="np. 0.800"
                  required
                />
                <div className="form-text">Waga jednostkowa w kilogramach.</div>
              </div>
            </div>

            <hr className="my-4" />

            <div className="row g-3">
              {/* Opis */}
              <div className="col-12 col-lg-7">
                <label className="form-label">Opis (HTML)</label>
                <textarea
                  className="form-control"
                  rows={10}
                  value={form.description || ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="<p>Opis produktu...</p>"
                  required
                />
                <div className="form-text">
                  Opis może zawierać HTML. Po „Optymalizuj opis” możesz go jeszcze ręcznie poprawić.
                </div>
              </div>

              {/* Podgląd */}
              <div className="col-12 col-lg-5">
                <label className="form-label">Podgląd opisu</label>
                <div className="border rounded p-3 bg-light" style={{ minHeight: 260 }}>
                  {form.description ? (
                    <div dangerouslySetInnerHTML={{ __html: form.description }} />
                  ) : (
                    <span className="text-muted">Podgląd pojawi się po wpisaniu opisu.</span>
                  )}
                </div>
                <div className="form-text">To jest podgląd HTML (to, co zobaczy klient).</div>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleOptimize}
                disabled={seoLoading}
              >
                {seoLoading ? 'Optymalizuję…' : 'Optymalizuj opis'}
              </button>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Zapisuję…' : 'Zapisz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
