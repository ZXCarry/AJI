// src/components/Navbar.jsx
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';

export default function Navbar() {
  const { isLoggedIn, role, loginName, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const cartCount = items.reduce((sum, it) => sum + it.quantity, 0);

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">Sklep</Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Produkty</NavLink>
            </li>

            {isLoggedIn && role === 'KLIENT' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/cart">
                    Koszyk {cartCount ? `(${cartCount})` : ''}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/my-orders">Moje zamówienia</NavLink>
                </li>
              </>
            )}

            {isLoggedIn && role === 'PRACOWNIK' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/employee/orders">Zamówienia</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/employee/init">Inicjalizacja</NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {!isLoggedIn ? (
              <>
                <NavLink className="btn btn-outline-light btn-sm" to="/login">Logowanie</NavLink>
                <NavLink className="btn btn-warning btn-sm" to="/register">Rejestracja</NavLink>
              </>
            ) : (
              <>
                <span className="text-light small">
                  Zalogowany: <strong>{loginName}</strong> ({role})
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                  Wyloguj
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
