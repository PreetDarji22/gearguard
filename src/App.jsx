import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RoleRoute from "./components/layout/RoleRoute";
import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";

// Pages (to be implemented)
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import EquipmentList from "./pages/equipment/EquipmentList";
import EquipmentDetail from "./pages/equipment/EquipmentDetail";
import TeamList from "./pages/teams/TeamList";
import TeamDetail from "./pages/teams/TeamDetail";
import RequestBoard from "./pages/requests/RequestBoard";
import RequestList from "./pages/requests/RequestList";
import RequestForm from "./pages/requests/RequestForm";
import Reports from "./pages/reports/Reports";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Sidebar />
      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/equipment" element={
            <ProtectedRoute>
              <Layout><EquipmentList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/equipment/:id" element={
            <ProtectedRoute>
              <Layout><EquipmentDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teams" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <Layout><TeamList /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/teams/:id" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <Layout><TeamDetail /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute>
              <Layout><RequestBoard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/requests/list" element={
            <ProtectedRoute>
              <Layout><RequestList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/requests/new" element={
            <ProtectedRoute>
              <Layout><RequestForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/requests/:id" element={
            <ProtectedRoute>
              <Layout><RequestForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <Layout><Reports /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
