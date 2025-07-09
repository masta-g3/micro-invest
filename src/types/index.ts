export interface InvestmentEntry {
  date: string; // ISO date string
  investment: string;
  amount: number;
  rate: number; // Growth rate percentage
}

export interface PortfolioSnapshot {
  date: string;
  entries: InvestmentEntry[];
  totalValue: number;
  totalDebt: number;
  netWorth: number;
}

export interface PortfolioInsight {
  topPerformer: { name: string; growth: number };
  underperformer: { name: string; growth: number };
  monthlyChange: number;
  allocation: Record<string, number>;
}

export interface AppState {
  entries: InvestmentEntry[];
  selectedDate: string | null;
  viewMode: 'overview' | 'snapshot' | 'timeseries' | 'add';
  isLoading: boolean;
  error: string | null;
}

export type ViewMode = 'overview' | 'snapshot' | 'timeseries' | 'add';