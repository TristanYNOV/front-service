import { DataItemState, DataItemType } from '../enum/state.enum';

export interface DataItemBase {
  id: string;
  type: DataItemType;
  state: DataItemState;
}

export interface TextData extends DataItemBase {
  type: DataItemType.Text;
}

export type AnyDataItems = PriceTableData | TextData;

// Price Table Entry
export interface PriceOption {
  name: string;
  features: string[];
  videoRetention: string;
  price: number; // en euros
}

// Specialized Data Item
export interface PriceTableData extends DataItemBase {
  type: DataItemType.Price;
  plans: PriceOption[];
}
