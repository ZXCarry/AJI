// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import { CartProvider } from './cart/CartContext';

import Navbar from './components/Navbar';

import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmployeeOrdersPage from './pages/EmployeeOrdersPage';
import InitPage from './pages/InitPage';
import ProductEditPage from './pages/ProductEditPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import MyOrdersPage from './pages/MyOrdersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<ProductsPage />} />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute roles={['KLIENT', 'PRACOWNIK']}>
                    <CartPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute roles={['KLIENT']}>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute roles={['KLIENT', 'PRACOWNIK']}>
                    <OrderDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* PRACOWNIK */}
              <Route
                path="/employee/orders"
                element={
                  <ProtectedRoute roles={['PRACOWNIK']}>
                    <EmployeeOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/init"
                element={
                  <ProtectedRoute roles={['PRACOWNIK']}>
                    <InitPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/products/:id/edit"
                element={
                  <ProtectedRoute roles={['PRACOWNIK']}>
                    <ProductEditPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<div>404</div>} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
