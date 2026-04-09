import React, { useState } from 'react';
import { useCart } from '../cart/CartContext';
import { createOrder } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';
import CartTable from '../components/CartTable';
import CheckoutForm from '../components/CheckoutForm';

export default function CartPage() {
  const { items, total, clear } = useCart();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(form) {
    try {
      setError('');
      setSuccess('');

      const address = String(form.address ?? '').trim();
      if (!address) {
        setError('Podaj adres dostawy.');
        return;
      }

      setSubmitting(true);

      const payload = {
        user_name: form.user_name,
        email: form.email,
        phone: form.phone,
        address,
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        })),
      };

      await createOrder(payload);

      clear();
      setSuccess('Zamówienie zostało złożone');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Nie udało się złożyć zamówienia'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!items.length) {
    return <div className="alert alert-info">Koszyk jest pusty</div>;
  }

  return (
    <div>
      <h2>Koszyk</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <CartTable />

      <div className="d-flex justify-content-between align-items-center my-3">
        <h4 className="mb-0">Łączna cena: {total.toFixed(2)} zł</h4>
      </div>

      {/* CheckoutForm flaga */}
      <CheckoutForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
