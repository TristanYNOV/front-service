import { AnyDataItems } from '../../interfaces/dataItem.interface';
import {createReducer, on} from '@ngrx/store';
import {addToIdle, displayFromIdle, removeFromIdle} from './dataState.actions';
import {DataItemState} from '../../enum/state.enum';

export interface DataState {
  idle: AnyDataItems[];
  displayed: AnyDataItems[];
  saved: AnyDataItems[];
}

// TODO: Store it in special service
const appPrice: AnyDataItems = {
  id: 'price-table-default',
  type: 'price',
  state: DataItemState.Displayed,
  plans: [
    {
      name: 'Indépendant',
      features: ['Analyse vidéo sans club', 'Hébergement 12h'],
      videoRetention: '12h',
      price: 3,
    },
    {
      name: 'Indépendant Premium',
      features: ['Analyse vidéo sans club', 'Hébergement 1 semaine'],
      videoRetention: '1 semaine',
      price: 5,
    },
    {
      name: 'Club analyste',
      features: ['Licence club', 'Accès analyste', 'Hébergement 12h'],
      videoRetention: '12h',
      price: 5,
    },
    {
      name: 'Club analyste complet',
      features: ['Licence club', 'Accès coachs', 'Hébergement 12h'],
      videoRetention: '12h',
      price: 10,
    },
    {
      name: 'Club analyste premium',
      features: ['Licence club', 'Accès coachs', 'Hébergement 1 semaine'],
      videoRetention: '1 semaine',
      price: 15,
    },
  ],
};

const idleAppPrice = {
  ...appPrice,
  state: DataItemState.Idle,
}

export const initialDataState: DataState = {
  idle: [idleAppPrice],
  displayed: [appPrice],
  saved: [],
};

export const dataStateReducer = createReducer(
  initialDataState,

  // Ajouter un élément aux idle
  on(addToIdle, (state, { item }) => ({
    ...state,
    idle: [...state.idle, item],
  })),

  // Supprimer un élément des idle
  on(removeFromIdle, (state, { id }) => ({
    ...state,
    idle: state.idle.filter(item => item.id !== id),
  })),

  // Afficher un item depuis idle : le déplacer dans displayed
  on(displayFromIdle, (state, { id }) => {
    const item = state.idle.find(el => el.id === id);
    if (!item) return state;

    return {
      ...state,
      idle: state.idle.filter(el => el.id !== id),
      displayed: [...state.displayed, { ...item, state: DataItemState.Displayed }],
    };
  }),
);
