import { createAction, props } from '@ngrx/store';
import { AnyDataItems } from '../../interfaces/dataItem.interface';

// Ajouter un élément dans les idle
export const addToIdle = createAction(
  '[DataState] Add to idle',
  props<{ item: AnyDataItems }>()
);

// Supprimer un élément des idle
export const removeFromIdle = createAction(
  '[DataState] Remove from idle',
  props<{ id: string }>()
);

// Afficher une donnée depuis les idle (la met dans displayed)
export const displayFromIdle = createAction(
  '[DataState] Display from idle',
  props<{ id: string }>()
);
