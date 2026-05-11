import { Navigate } from "react-router-dom";
import { getAccessToken } from "../lib/api";

type Props = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
