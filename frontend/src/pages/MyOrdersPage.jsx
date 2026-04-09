import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString();
}

function statusBadgeClass(status) {
  switch (status) {
    case 'NIEZATWIERDZONE':
      return 'bg-secondary';
    case 'ZATWIERDZONE':
      return 'bg-primary';
    case 'ANULOWANE':
      return 'bg-danger';
    case 'ZREALIZOWANE':
      return 'bg-success';
    default:
      return 'bg-dark';
  }
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setError('');
      setLoading(true);
      setOrders(await getMyOrders());
    } catch (e) {
      setError(getApiErrorMessage(e, 'Nie udało się pobrać zamówień'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const hasOrders = useMemo(() => orders && orders.length > 0, [orders]);

  if (loading) return <div className="text-muted">Ładowanie...</div>;

  return (
    <div className="container py-2" style={{ maxWidth: 980 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-1">Moje zamówienia</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>
            Lista Twoich zamówień i ich aktualne statusy.
          </div>
        </div>

        <button className="btn btn-outline-secondary" onClick={load}>
          Odśwież
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!hasOrders && (
        <div className="alert alert-info">Brak zamówień</div>
      )}

      {hasOrders && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Status</th>
                <th style={{ width: 220 }}>Data utworzenia</th>
                <th style={{ width: 220 }}>Data zatwierdzenia</th>
                <th style={{ width: 160 }} className="text-end">
                  Akcje
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="fw-semibold">{o.id}</td>

                  <td>
                    <span className={`badge ${statusBadgeClass(o.status)}`}>
                      {o.status}
                    </span>
                  </td>

                  <td>{formatDateTime(o.created_at)}</td>
                  <td>{formatDateTime(o.approved_at)}</td>

                  <td className="text-end">
                    <Link
                      to={`/orders/${o.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Szczegóły / opinia
                    </Link>
                  </td>
                </tr>
              ))}

              {!orders.length && (
                <tr>
                  <td colSpan={5} className="text-muted text-center">
                    Brak zamówień
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
