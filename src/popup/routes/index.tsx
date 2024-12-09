import React from 'react';
import {useNavigate , Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/chrome-extension';
import LogIn from '../components/setup/LogIn';
import Main from '../components/main';
import PasswordPrompt from '../components/setup/PasswordPrompt';
import KeyGeneration from '../components/setup/KeyGeneration'; 

// Protected route wrapper component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper component - redirects to home if already authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  if (isSignedIn) {
    // Redirect to the route they came from, or home if none
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Define all available routes
export const AppRoutes = {
  HOME: '/',
  LOGIN: '/login',
  SETUP: '/setup',
  MAIN: '/main',
  PASSWORDPROMPT: '/passwordprompt',
} as const;

// Main routing component
export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
   
      <Route 
        path={AppRoutes.LOGIN} 
        element={
          <LogIn />
        } 
      />

      {/* Protected Routes */}
      <Route
        path={AppRoutes.SETUP}
        element={
          <ProtectedRoute>
            <KeyGeneration />
          </ProtectedRoute>
        }
      />


      <Route
        path={AppRoutes.PASSWORDPROMPT}
        element={
          <ProtectedRoute>
            <PasswordPrompt />
          </ProtectedRoute>
        }
      />

      <Route
        path={AppRoutes.MAIN}
        element={
          <ProtectedRoute>
            <Main />
          </ProtectedRoute>
        }
      />

      {/* Add sub-routes for main tabs */}
      <Route
        path={`${AppRoutes.MAIN}/:tab`}
        element={
          <ProtectedRoute>
            <Main />
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to login */}
      <Route path="*" element={<Navigate to={AppRoutes.LOGIN} replace />} />
    </Routes>
  );
};

// Custom hook for programmatic navigation with type safety
export const useAppNavigate = () => {
  const navigate = useNavigate();

  return {
    goToHome: () => navigate(AppRoutes.HOME),
    goToLogin: () => navigate(AppRoutes.LOGIN),
    goToSetup: () => navigate(AppRoutes.SETUP),
    goToDashboard: () => navigate(AppRoutes.MAIN),
    goToPasswordPrompt: () => navigate(AppRoutes.PASSWORDPROMPT),
  };
};
