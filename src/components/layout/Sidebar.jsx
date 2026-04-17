import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  ClipboardList, 
  BarChart3, 
  ShieldCheck 
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Equipment", href: "/equipment", icon: Wrench },
    { name: "Teams", href: "/teams", icon: Users, role: ["admin", "manager"] },
    { name: "Requests", href: "/requests", icon: ClipboardList },
    { name: "Reports", href: "/reports", icon: BarChart3, role: ["admin", "manager"] },
  ];

  const filteredItems = navItems.filter(item => 
    !item.role || item.role.includes(user?.role)
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white pt-16 transition-transform">
      <div className="h-full overflow-y-auto px-3 py-4">
        <ul className="space-y-2 font-medium">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 group transition-colors",
                    isActive && "bg-slate-100 text-blue-600 font-semibold"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 text-slate-500 transition duration-75 group-hover:text-slate-900",
                    isActive && "text-blue-600"
                  )} />
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Section */}
        <div className="mt-8 border-t border-slate-200 pt-4 px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Internal
          </p>
          <div className="mt-4 flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs italic">GearGuard Secure</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
