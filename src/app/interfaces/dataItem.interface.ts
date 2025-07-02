import {DataItemState} from '../enum/state.enum';

export type DataItemType = 'price';

export type AnyDataItems = PriceTableData;

export interface DataItemBase {
  id: string;
  type: DataItemType;
  state: DataItemState;
}

// Price Table Entry
export interface PriceOption {
  name: string;
  features: string[];
  videoRetention: string; // "12h", "1 semaine"
  price: number; // en euros
}

// Specialized Data Item
export interface PriceTableData extends DataItemBase {
  type: 'price';
  plans: PriceOption[];
}
