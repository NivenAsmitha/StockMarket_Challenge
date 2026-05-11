export type Role = "ADMIN" | "USER";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
};

export type Balance = {
  id: string;
  totalLkr: string;
  availableLkr: string;
  lockedLkr: string;
};

export type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type Company = {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  status: CompanyStatus;
};

export type Stock = {
  id: string;
  companyId: string;
  symbol: string;
  name: string;
  totalShares: string;
  availableShares: string;
  lastPrice: string;
  status: "ACTIVE" | "SUSPENDED";
  company?: Company;
};

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";

export type Trade = {
  id: string;
  stockId: string;
  buyerId: string;
  sellerId: string;
  buyOrderId?: string;
  sellOrderId?: string;
  price: string;
  quantity: string;
  total: string;
  createdAt: string;
  stock?: Stock;
};

export type Order = {
  id: string;
  stockId: string;
  userId: string;
  side: OrderSide;
  type: OrderType;
  price?: string | null;
  quantity: string;
  remainingQty: string;
  lockedAmount: string;
  status:
    | "PENDING_APPROVAL"
    | "OPEN"
    | "PARTIALLY_FILLED"
    | "FILLED"
    | "CANCELLED"
    | "REJECTED";
  createdAt: string;
  stock?: Stock;
  user?: User;
  buyTrades?: Trade[];
  sellTrades?: Trade[];
};

export type PortfolioItem = {
  id: string;
  userId: string;
  stockId: string;
  quantity: string;
  lockedQuantity: string;
  avgBuyPrice: string;
  stock: Stock;
};
