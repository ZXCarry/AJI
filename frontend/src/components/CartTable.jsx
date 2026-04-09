import React from 'react';
import { useCart } from '../cart/CartContext';

export default function CartTable() {
  const { items, inc, dec, removeItem } = useCart();

  return (
    <div className="table-responsive">
      <table className="table table-bordered align-middle">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th style={{ width: 160 }}>Ilość</th>
            <th style={{ width: 140 }}>Cena łączna</th>
            <th style={{ width: 120 }}></th>
          </tr>
        </thead>

        <tbody>
          {items.map((it) => (
            <tr key={it.productId}>
              <td>{it.name}</td>

              <td>
                <div className="d-flex gap-2 align-items-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => dec(it.productId)}
                  >
                    -
                  </button>

                  <span className="fw-semibold">{it.quantity}</span>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => inc(it.productId)}
                  >
                    +
                  </button>
                </div>
              </td>

              <td>{(it.unitPrice * it.quantity).toFixed(2)} zł</td>

              <td className="text-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeItem(it.productId)}
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}

          {!items.length && (
            <tr>
              <td colSpan={4} className="text-muted text-center">
                Koszyk jest pusty
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
