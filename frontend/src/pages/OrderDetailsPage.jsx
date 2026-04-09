import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getOrder } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import Opinions from '../components/Opinions';

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return d.toLocaleString();
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setError('');
      setLoading(true);
      setOrder(await getOrder(id));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Nie udało się pobrać zamówienia'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const total = useMemo(() => {
    if (!order?.items?.length) return 0;
    return order.items.reduce(
      (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
      0
    );
  }, [order]);

  if (loading) return <div className="text-muted">Ładowanie...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return null;

  const isWorker = role === 'PRACOWNIK';

  return (
    <div className="container py-2" style={{ maxWidth: 980 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-1">Szczegóły zamówienia #{order.id}</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>
            Status: <strong>{order.status}</strong>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Wróć
          </button>

          {isWorker && (
            <Link className="btn btn-outline-primary" to="/employee/orders">
              Lista zamówień
            </Link>
          )}
        </div>
      </div>

      {/* Informacje + dane klienta */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Informacje o zamówieniu</h5>

              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: 13 }}>Data utworzenia</div>
                <div>{formatDateTime(order.created_at)}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: 13 }}>Data zatwierdzenia</div>
                <div>{formatDateTime(order.approved_at)}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: 13 }}>Wartość zamówienia</div>
                <div className="fw-semibold">{total.toFixed(2)} zł</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Dane klienta i dostawy</h5>

              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: 13 }}>Nazwa użytkownika</div>
                <div>{order.user_name || '—'}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: 13 }}>Email</div>
                <div>{order.email || '—'}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: 13 }}>Telefon</div>
                <div>{order.phone || '—'}</div>
              </div>

              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: 13 }}>Adres dostawy</div>
                <div>{order.address || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pozycje */}
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title mb-3">Pozycje zamówienia</h5>

          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th style={{ width: 120 }}>Ilość</th>
                  <th style={{ width: 160 }}>Cena jedn.</th>
                  <th style={{ width: 160 }}>Wartość</th>
                </tr>
              </thead>

              <tbody>
                {order.items?.map((it) => {
                  const line = Number(it.unit_price) * Number(it.quantity);
                  return (
                    <tr key={it.id}>
                      <td>{it.product_name}</td>
                      <td>{it.quantity}</td>
                      <td>{Number(it.unit_price).toFixed(2)} zł</td>
                      <td>{line.toFixed(2)} zł</td>
                    </tr>
                  );
                })}

                {!order.items?.length && (
                  <tr>
                    <td colSpan={4} className="text-muted text-center">
                      Brak pozycji
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={3} className="text-end fw-semibold">Razem</td>
                  <td className="fw-semibold">{total.toFixed(2)} zł</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Opinie */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Opinia o obsłudze</h5>

          {/* Opi*/}
          <Opinions order={order} onUpdate={setOrder} />

          {/* Jeśli Opinions nie odświeża zamówienia onUpdate={load} */}
        </div>
      </div>
    </div>
  );
}
