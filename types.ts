
export enum BetStatus {
  PENDING = 'PENDING',
  WIN = 'WIN',
  LOSS = 'LOSS',
  VOID = 'VOID'
}

export interface SubGame {
  event: string;
  odd: number;
}

export interface User {
  email: string;
  name: string;
}

export interface Bet {
  id: string;
  date: string;
  match: string;
  type: string;
  odds: number;
  stake: number;
  status: BetStatus;
  profit: number;
  subGames?: SubGame[];
}

export type ViewType = 'annual' | 'monthly' | 'custom';

export type Language = 'en' | 'pt' | 'es' | 'fr' | 'it' | 'de' | 'ar';
export type Currency = 'USD' | 'BRL' | 'EUR';
export type Theme = 'light' | 'dark';

export interface FilterConfig {
  type: ViewType;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}

export interface Translations {
  headerTitle: string;
  periodResult: string;
  consolidatedResult: string;
  viewLabel: string;
  annual: string;
  monthly: string;
  custom: string;
  year: string;
  month: string;
  start: string;
  end: string;
  iaInsights: string;
  totalProfit: string;
  roi: string;
  winRate: string;
  activeBets: string;
  iaAnalysisTitle: string;
  iaError: string;
  newBet: string;
  editBet: string;
  updateButton: string;
  cancelButton: string;
  betType: string;
  date: string;
  stakeLabel: string;
  addGame: string;
  totalOdds: string;
  registerButton: string;
  historyTitle: string;
  entries: string;
  tableDate: string;
  tableEvent: string;
  tableOdds: string;
  tableStake: string;
  tableProfit: string;
  tableActions: string;
  noBets: string;
  multiple: string;
  win: string;
  loss: string;
  void: string;
  pending: string;
  resetStatus: string;
  confirmDelete: string;
  iaPrompt: string;
  placeholderType: string;
  placeholderStake: string;
  placeholderEvent: string;
  placeholderOdd: string;
  // Auth translations
  authError: string;
  loginTitle: string;
  registerTitle: string;
  nameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  loginButton: string;
  createAccountButton: string;
  noAccount: string;
  hasAccount: string;
  // Import/Export
  exportLabel: string;
  importLabel: string;
  importSuccess: string;
  importError: string;
}
