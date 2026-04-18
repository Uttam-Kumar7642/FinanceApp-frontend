import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { Register, ForgotPassword } from './pages/Auth';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div className="spinner spinner-lg"/>
      <p style={{ color:'var(--text2)', fontSize:14 }}>Loading…</p>
    </div>
  );
  return user ? children : <Navigate to="/login" replace/>;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar/>
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"          element={user ? <Navigate to="/dashboard"/> : <Login/>}/>
      <Route path="/register"       element={user ? <Navigate to="/dashboard"/> : <Register/>}/>
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard"/> : <ForgotPassword/>}/>
      <Route path="/dashboard"    element={<ProtectedRoute><AppLayout><Dashboard/></AppLayout></ProtectedRoute>}/>
      <Route path="/transactions" element={<ProtectedRoute><AppLayout><Transactions/></AppLayout></ProtectedRoute>}/>
      <Route path="/budgets"      element={<ProtectedRoute><AppLayout><Budgets/></AppLayout></ProtectedRoute>}/>
      <Route path="/analytics"    element={<ProtectedRoute><AppLayout><Analytics/></AppLayout></ProtectedRoute>}/>
      <Route path="/settings"     element={<ProtectedRoute><AppLayout><Settings/></AppLayout></ProtectedRoute>}/>
      <Route path="*"             element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes/>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
