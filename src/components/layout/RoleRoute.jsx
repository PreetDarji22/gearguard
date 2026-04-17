import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Verifying access...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    console.warn(`Access denied for role: ${user?.role}. Required roles: ${allowedRoles.join(", ")}`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
