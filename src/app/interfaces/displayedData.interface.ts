export type DisplayedData = Article | PriceTable; // Le type DisplayedData peut être un Article ou un PriceTable

export interface Article {
  id: string;
  title: string;
  type: 'article';
  data: string[];
}

export interface PriceTable {
  id: string;
  title: string;
  type: 'priceTable';
  data: Price[];
}

export interface Price {
  subscription: string;
  price: number;
  description: string;
}
