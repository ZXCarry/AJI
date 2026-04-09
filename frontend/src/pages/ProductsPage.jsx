import React, { useEffect, useState } from 'react';
import { getProducts, getCategories } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';
import ProductTable from '../components/ProductTable';
import ProductFilters from '../components/ProductFilters';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setError('');
        const [p, c] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(p);
        setFiltered(p);
        setCategories(c);
      } catch (e) {
        setError(getApiErrorMessage(e, 'Nie udało się pobrać produktów'));
      }
    })();
  }, []);

  function onFilter({ name, categoryId }) {
    let res = [...products];
    if (name) {
      res = res.filter(p =>
        p.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    if (categoryId) {
      res = res.filter(p => String(p.category_id) === String(categoryId));
    }
    setFiltered(res);
  }

  return (
    <div>
      <h2>Produkty</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <ProductFilters
        categories={categories}
        onFilter={onFilter}
      />

      <ProductTable products={filtered} />
    </div>
  );
}
