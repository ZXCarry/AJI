import React, { useState } from 'react';

export default function ProductFilters({ categories, onFilter }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  function apply(next = {}) {
    const payload = {
      name: next.name ?? name,
      categoryId: next.categoryId ?? categoryId,
    };
    onFilter(payload);
  }

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-6">
            <label className="form-label">Filtruj po nazwie</label>
            <input
              className="form-control"
              placeholder="np. laptop"
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                apply({ name: v });
              }}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Kategoria</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => {
                const v = e.target.value;
                setCategoryId(v);
                apply({ categoryId: v });
              }}
            >
              <option value="">Wszystkie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setName('');
                setCategoryId('');
                onFilter({ name: '', categoryId: '' });
              }}
            >
              Wyczyść
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
