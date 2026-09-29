import type { ReactNode } from 'react';
import { Spinner } from 'react-bootstrap';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppLayout } from './layout/AppLayout';
import { LiveUpdatesProvider } from './live/LiveUpdates';
import { AuthPage } from './pages/AuthPage';
import { AuxiliaryPage } from './pages/AuxiliaryPage';
import {
  addressConfig,
  coordinatesConfig,
  locationConfig,
  organizationConfig,
  personConfig,
} from './pages/auxiliaryConfigs';
import { ProductsPage } from './pages/ProductsPage';
import { SpecialOperationsPage } from './pages/SpecialOperationsPage';
import { DialogsProvider } from './ui/Dialogs';
import { NotificationsProvider } from './ui/Notifications';

/** Разделы системы доступны только вошедшему пользователю. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user === undefined) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" />
      </div>
    );
  }
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return <LiveUpdatesProvider>{children}</LiveUpdatesProvider>;
}

export function App() {
  return (
    <NotificationsProvider>
      <DialogsProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/special" element={<SpecialOperationsPage />} />
                <Route path="/refs/coordinates" element={<AuxiliaryPage key="coordinates" config={coordinatesConfig} />} />
                <Route
                  path="/refs/organizations"
                  element={<AuxiliaryPage key="organizations" config={organizationConfig} />}
                />
                <Route path="/refs/persons" element={<AuxiliaryPage key="persons" config={personConfig} />} />
                <Route path="/refs/addresses" element={<AuxiliaryPage key="addresses" config={addressConfig} />} />
                <Route path="/refs/locations" element={<AuxiliaryPage key="locations" config={locationConfig} />} />
              </Route>
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </DialogsProvider>
    </NotificationsProvider>
  );
}
