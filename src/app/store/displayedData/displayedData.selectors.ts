import { createSelector } from '@ngrx/store';
import {AppState} from '../initial-state.state';

export const selectDisplayedData = (state: AppState) => state.displayedData;

export const selectAllDisplayedData = createSelector(
  selectDisplayedData,
  (state) => state.data
);

// Selector pour récupérer uniquement les articles
export const selectArticles = createSelector(
  selectAllDisplayedData,
  (data) => data.filter((item) => item.type === 'article')
);

// Selector pour récupérer uniquement les PriceTables
export const selectPriceTables = createSelector(
  selectAllDisplayedData,
  (data) => data.filter((item) => item.type === 'priceTable')
);
