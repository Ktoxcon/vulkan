export type NewPortfolioStatusEventInput = {
  portfolioId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
};
