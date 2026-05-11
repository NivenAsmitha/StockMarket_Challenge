import {
  BarChart3,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LineChart,
  LogOut,
  Package,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clearTokens } from "../lib/api";

type NavbarProps = {
  userRole?: string;
};

export function Navbar({ userRole }: NavbarProps) {
  const navigate = useNavigate();
  const isAdmin = userRole === "ADMIN";

  function logout() {
    const confirmed = window.confirm("Are you sure you want to logout?");

    if (!confirmed) {
      return;
    }

    clearTokens();
    navigate("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-3 text-white">
              <TrendingUp size={24} />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900">
                Stock Challenge
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Real-time trading simulation
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {isAdmin ? (
            <>
              <NavItem
                to="/admin/dashboard"
                icon={<LayoutDashboard size={18} />}
                label="Admin Dashboard"
              />

              <NavItem
                to="/admin/users"
                icon={<Users size={18} />}
                label="Users"
              />

              <NavItem
                to="/admin/orders"
                icon={<ClipboardCheck size={18} />}
                label="Orders Approval"
              />

              <NavItem
                to="/admin/companies"
                icon={<Building2 size={18} />}
                label="Companies"
              />

              <NavItem
                to="/admin/stocks"
                icon={<BarChart3 size={18} />}
                label="Stocks"
              />
            </>
          ) : (
            <>
              <NavItem
                to="/dashboard"
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
              />

              <NavItem
                to="/market"
                icon={<LineChart size={18} />}
                label="Market"
              />

              <NavItem
                to="/selling-stocks"
                icon={<ShoppingCart size={18} />}
                label="Selling Stocks"
              />

              <NavItem
                to="/portfolio"
                icon={<Wallet size={18} />}
                label="Portfolio"
              />

              <NavItem
                to="/orders"
                icon={<Package size={18} />}
                label="Orders"
              />

              <NavItem
                to="/trades"
                icon={<ScrollText size={18} />}
                label="Trades"
              />
            </>
          )}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <ShieldCheck className="text-blue-600" size={22} />
              ) : (
                <UserRound className="text-blue-600" size={22} />
              )}

              <div>
                <p className="text-sm font-bold text-slate-900">
                  {isAdmin ? "Administrator" : "User Account"}
                </p>
                <p className="text-xs text-slate-500">{userRole ?? "USER"}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
    >
      {icon}
      {label}
    </Link>
  );
}
