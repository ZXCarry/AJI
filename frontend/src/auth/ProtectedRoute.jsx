import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { isLoggedIn, role } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Navigate to="/login" />;  // Jeśli nie jesteś zalogowany, przekierowanie na login
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/" />;  // Jeśli użytkownik nie ma wymaganej roli, przekierowanie na stronę główną
  }

  return children;  // Jeśli jest zalogowany i ma odpowiednią rolę, renderujemy dzieci (komponenty)
}
