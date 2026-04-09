import React, { useMemo, useState } from 'react';
import { addOpinion } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Opinions({ order, onUpdate }) {
  const { role } = useAuth();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const canAdd = useMemo(() => {
    const statusOk = order?.status === 'ZREALIZOWANE' || order?.status === 'ANULOWANE';
    const noOpinionYet = !order?.opinion;
    const isClient = role === 'KLIENT';
    return statusOk && noOpinionYet && isClient;
  }, [order, role]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setMsg('');

      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        setError('Ocena musi być liczbą 1-5');
        return;
      }
      if (!content.trim()) {
        setError('Treść opinii nie może być pusta');
        return;
      }

      const updated = await addOpinion(order.id, r, content.trim());
      onUpdate(updated);
      setMsg('Opinia dodana');
      setContent('');
    } catch (e2) {
      setError(getApiErrorMessage(e2, 'Nie udało się dodać opinii'));
    }
  }

  return (
    <div className="mt-4">
      <h4>Opinia</h4>

      {/* Lista opinii (w Twoim API jest max 1 opinia na zamówienie) */}
      {order.opinion ? (
        <div className="card">
          <div className="card-body">
            <div><strong>Ocena:</strong> {order.opinion.rating}/5</div>
            <div className="mt-2"><strong>Treść:</strong> {order.opinion.content}</div>
            <div className="mt-2 text-muted small">
              <strong>Data:</strong>{' '}
              {order.opinion.created_at
                ? new Date(order.opinion.created_at).toLocaleString()
                : '-'}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted mb-3">Brak opinii</div>
      )}

      {/* Formularz dodania opinii */}
      {canAdd && (
        <div className="card mt-3">
          <div className="card-body">
            <h5>Dodaj opinię o obsłudze</h5>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Pole "data" z wymagania – pokazujemy jako read-only (DB zapisuje created_at) */}
            <div className="mb-2">
              <label className="form-label">Data</label>
              <input className="form-control" value={new Date().toLocaleDateString()} readOnly />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label">Ocena (1–5)</label>
                <select
                  className="form-select"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label">Treść</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <button className="btn btn-primary">Dodaj opinię</button>
            </form>
          </div>
        </div>
      )}

      {/* Informacja, dlaczego nie można dodać opinii */}
      {!order.opinion && role === 'KLIENT' && !canAdd && (
        <div className="alert alert-warning mt-3">
          Opinię można dodać tylko do zamówienia <strong>ZREALIZOWANE</strong> lub <strong>ANULOWANE</strong>,
          jeśli nie została już dodana.
        </div>
      )}
    </div>
  );
}
