import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const API_URL = import.meta.env.VITE_API_URL;

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, token, logout } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: token, // Send token as string in request body
        });

        if (response.ok) {
          setIsTokenValid(true);
        } else {
          // Token is invalid, logout user
          console.log('Token validation failed, logging out...');
          logout();
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        // If there's a network error, we'll still consider it invalid for security
        logout();
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, logout]);

  // Show loading while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or token is invalid
  if (!isAuthenticated || !token || !isTokenValid) {
    return <Navigate to="/login" replace />;
  }

  // Render children if token is valid
  return <>{children}</>;
};

export default PrivateRoute;