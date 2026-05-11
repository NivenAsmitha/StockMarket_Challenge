import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminCompaniesPage } from "./pages/AdminCompaniesPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { AdminStocksPage } from "./pages/AdminStocksPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MarketPage } from "./pages/MarketPage";
import { OrdersPage } from "./pages/OrdersPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SellingStocksPage } from "./pages/SellingStocksPage";
import { StockDetailPage } from "./pages/StockDetailPage";
import { TradesPage } from "./pages/TradesPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/market"
        element={
          <ProtectedRoute>
            <MarketPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/selling-stocks"
        element={
          <ProtectedRoute>
            <SellingStocksPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stocks/:symbol"
        element={
          <ProtectedRoute>
            <StockDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <PortfolioPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trades"
        element={
          <ProtectedRoute>
            <TradesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute>
            <AdminOrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute>
            <AdminCompaniesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/stocks"
        element={
          <ProtectedRoute>
            <AdminStocksPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
