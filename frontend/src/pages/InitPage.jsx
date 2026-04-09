import React, { useState } from 'react';
import { initProductsByFile } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';

function has(v) {
  return v !== undefined && v !== null && String(v).trim() !== '';
}

async function validateFileContent(file) {
  if (!file) throw new Error('Nie wybrano pliku.');

  const fileName = (file.name || '').toLowerCase();
  const text = await file.text();

  if (fileName.endsWith('.json')) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Plik JSON jest niepoprawny.');
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('JSON musi być niepustą tablicą produktów.');
    }

    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      if (!p || typeof p !== 'object') {
        throw new Error(`JSON: element #${i + 1} nie jest obiektem.`);
      }
      if (
        !has(p.name) ||
        !has(p.description) ||
        !has(p.unit_price) ||
        !has(p.unit_weight) ||
        !has(p.category_name)
      ) {
        throw new Error(`JSON: brakuje wymaganych pól w elemencie #${i + 1}.`);
      }
    }
    return;
  }

  if (fileName.endsWith('.csv')) {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      throw new Error('CSV musi mieć nagłówek i co najmniej 1 wiersz danych.');
    }

    const headerLine = lines[0];
    const sep = headerLine.includes(';') ? ';' : ',';
    const header = headerLine.split(sep).map(s => s.trim());

    const required = ['name', 'description', 'unit_price', 'unit_weight', 'category_name'];
    for (const col of required) {
      if (!header.includes(col)) {
        throw new Error(`CSV: brakuje kolumny "${col}" w nagłówku.`);
      }
    }

    const idx = Object.fromEntries(required.map(c => [c, header.indexOf(c)]));

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(s => s.trim());
      const rowNo = i + 1;

      for (const col of required) {
        const v = cols[idx[col]];
        if (!has(v)) {
          throw new Error(`CSV: puste pole "${col}" w wierszu ${rowNo}.`);
        }
      }
    }
    return;
  }

  throw new Error('Obsługiwane są tylko pliki .json lub .csv');
}

export default function InitPage() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setMsg('');

      await validateFileContent(file);

      await initProductsByFile(file);

      setMsg('Baza została zainicjalizowana');
    } catch (e) {
      setError(getApiErrorMessage(e) || e?.message || 'Wystąpił błąd.');
    }
  }

  return (
    <div>
      <h2>Inicjalizacja bazy</h2>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          className="form-control mb-2"
          onChange={e => setFile(e.target.files[0])}
        />
        <button className="btn btn-warning">Inicjalizuj</button>
      </form>
    </div>
  );
}
