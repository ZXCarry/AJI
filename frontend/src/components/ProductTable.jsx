import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';

export default function ProductTable({ products }) {
  const { addItem } = useCart();
  const { role } = useAuth();
  const isWorker = role === 'PRACOWNIK';

  const [openId, setOpenId] = useState(null);

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped align-middle">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th style={{ width: 140 }}>Szczegóły</th>
            <th>Cena</th>
            <th>Kategoria</th>
            <th style={{ width: isWorker ? 220 : 120 }}></th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <React.Fragment key={p.id}>
              <tr>
                <td>{p.name}</td>

                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0"
                    onClick={() => toggle(p.id)}
                  >
                    {openId === p.id ? 'Ukryj' : 'Pokaż'}
                  </button>
                </td>

                <td>{Number(p.unit_price).toFixed(2)} zł</td>
                <td>{p.category_name}</td>

                <td className="text-end">
                  {isWorker && (
                    <Link
                      className="btn btn-sm btn-outline-primary me-2"
                      to={`/employee/products/${p.id}/edit`}
                    >
                      Edytuj
                    </Link>
                  )}

                  {!isWorker && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => addItem(p)}
                    >
                      Kup
                    </button>
                  )}
                </td>
              </tr>

              {/* Rozwijane szczegóły (HTML) */}
              {openId === p.id && (
                <tr>
                  <td colSpan={5} className="bg-light">
                    <div
                      className="p-3"
                      dangerouslySetInnerHTML={{ __html: p.description }}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {!products.length && (
            <tr>
              <td colSpan={5} className="text-muted text-center">
                Brak produktów
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
