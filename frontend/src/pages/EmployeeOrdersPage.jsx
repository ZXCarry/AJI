import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, patchOrderStatus } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';

export default function EmployeeOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState(''); // '' = wszystkie
  const [search, setSearch] = useState(''); // ID lub user_name
  const [sortMode, setSortMode] = useState('id_desc'); // id_desc | id_asc

  async function load() {
    try {
      setError('');
      setOrders(await getOrders());
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id, status) {
    try {
      await patchOrderStatus(id, status);
      await load();
    } catch (e) {
      alert(getApiErrorMessage(e));
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let arr = [...orders];

    // filtr statusu
    if (statusFilter) {
      arr = arr.filter(o => o.status === statusFilter);
    }

    // wyszukiwanie po ID lub po nazwie klienta
    if (q) {
      arr = arr.filter(o => {
        const byId = String(o.id).includes(q);
        const byUser = (o.user_name || '').toLowerCase().includes(q);
        return byId || byUser;
      });
    }

    // sortowanie
    arr.sort((a, b) => {
      if (sortMode === 'id_asc') return a.id - b.id;
      return b.id - a.id;
    });

    return arr;
  }, [orders, statusFilter, search, sortMode]);

  return (
    <div>
      <h2>Zamówienia (pracownik)</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* FILTRY */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <label className="form-label">Szukaj (ID lub klient)</label>
          <input
            className="form-control"
            placeholder="np. 12 lub Jan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Wszystkie</option>
            <option value="NIEZATWIERDZONE">NIEZATWIERDZONE</option>
            <option value="ZATWIERDZONE">ZATWIERDZONE</option>
            <option value="ANULOWANE">ANULOWANE</option>
            <option value="ZREALIZOWANE">ZREALIZOWANE</option>
          </select>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label">Sortowanie</label>
          <select
            className="form-select"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="id_desc">Najnowsze (ID malejąco)</option>
            <option value="id_asc">Najstarsze (ID rosnąco)</option>
          </select>
        </div>
      </div>

      {/* TABELA */}
      <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Klient</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Szczegóły</th>
              <th className="text-end">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.status}</td>
                <td>{o.user_name}</td>
                <td>{o.email}</td>
                <td>{o.phone}</td>

                <td>
                  <Link className="btn btn-sm btn-outline-secondary" to={`/orders/${o.id}`}>
                    Podgląd
                  </Link>
                </td>

                <td className="text-end">
                  {o.status === 'NIEZATWIERDZONE' && (
                    <>
                      <button className="btn btn-sm btn-primary me-2"
                        onClick={() => changeStatus(o.id, 'ZATWIERDZONE')}>
                        Zatwierdź
                      </button>
                      <button className="btn btn-sm btn-danger"
                        onClick={() => changeStatus(o.id, 'ANULOWANE')}>
                        Anuluj
                      </button>
                    </>
                  )}

                  {o.status === 'ZATWIERDZONE' && (
                    <>
                      <button className="btn btn-sm btn-success me-2"
                        onClick={() => changeStatus(o.id, 'ZREALIZOWANE')}>
                        Zrealizuj
                      </button>
                      <button className="btn btn-sm btn-danger"
                        onClick={() => changeStatus(o.id, 'ANULOWANE')}>
                        Anuluj
                      </button>
                    </>
                  )}

                  {(o.status === 'ANULOWANE' || o.status === 'ZREALIZOWANE') && (
                    <span className="text-muted">Brak akcji</span>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted">Brak wyników</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
