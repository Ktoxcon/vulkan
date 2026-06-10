export type ClientInterestOffering = {
  offeringId: string;
  name: string;
  type: string;
};

export type OfferingInterest = {
  offeringId: string;
  name: string;
  count: number;
};

export type InterestStats = {
  topProducts: OfferingInterest[];
  topServices: OfferingInterest[];
  total: number;
};
