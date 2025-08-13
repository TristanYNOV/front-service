import {DataItemState, DataItemType} from '../enum/state.enum';


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
  videoRetention: string;
  price: number; // en euros
}

// Specialized Data Item
export interface PriceTableData extends DataItemBase {
  type: DataItemType.Price;
  plans: PriceOption[];
}
