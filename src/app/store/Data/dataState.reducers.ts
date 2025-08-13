import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { createReducer, on } from '@ngrx/store';
import {
  addToIdle,
  displayFromIdle,
  removeFromDisplay,
  removeFromIdle,
  saveFromDisplay,
  saveFromIdle,
} from './dataState.actions';
import { DataItemState, DataItemType } from '../../enum/state.enum';

export interface DataState {
  idle: AnyDataItems[];
  displayed: AnyDataItems[];
  saved: AnyDataItems[];
}

// TODO: Store it in special service
const appPrice: AnyDataItems = {
  id: 'price-table-default',
  type: DataItemType.Price,
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

const clubGuide: AnyDataItems = {
  id: 'club-guide',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const cguInfo: AnyDataItems = {
  id: 'cgu',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const upcomingFeatures: AnyDataItems = {
  id: 'upcoming-features',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

export const initialDataState: DataState = {
  idle: [idleAppPrice, clubGuide, cguInfo, upcomingFeatures],
  displayed: [appPrice],
  saved: [],
};

export const dataStateReducer = createReducer(
  initialDataState,
  // IDLE PART
  on(addToIdle, (state, { item }) => {
    // Empêche l'ajout d'un élément déjà présent dans l'un des états
    const exists =
      state.idle.some(el => el.id === item.id) ||
      state.displayed.some(el => el.id === item.id) ||
      state.saved.some(el => el.id === item.id);
    if (exists) {
      return state;
    }
    return {
      ...state,
      idle: [...state.idle, item],
    };
  }),
  on(removeFromIdle, (state, { id }) => ({
    ...state,
    idle: state.idle.filter(item => item.id !== id),
  })),
  on(displayFromIdle, (state, { id }) => {
    const item = state.idle.find(el => el.id === id);
    // Ne rien faire si l'élément n'existe pas ou est déjà affiché
    if (!item || state.displayed.some(el => el.id === id)) {
      return state;
    }
    return {
      ...state,
      idle: state.idle.filter(el => el.id !== id),
      displayed: [...state.displayed, { ...item, state: DataItemState.Displayed }],
    };
  }),
  on(saveFromIdle, (state, { id }) => {
    const item = state.idle.find(el => el.id === id);
    // Ne rien faire si l'élément n'existe pas ou est déjà sauvegardé
    if (!item || state.saved.some(el => el.id === id)) {
      return state;
    }
    return {
      ...state,
      idle: state.idle.filter(el => el.id !== id),
      saved: [...state.saved, { ...item, state: DataItemState.Saved }],
    };
  }),

  // DISPLAY PART
  on(removeFromDisplay, (state, { id }) => ({
    ...state,
    displayed: state.displayed.filter(item => item.id !== id),
  })),
  on(saveFromDisplay, (state, { id }) => {
    const item = state.displayed.find(el => el.id === id);
    // Ne rien faire si l'élément n'existe pas ou est déjà sauvegardé
    if (!item || state.saved.some(el => el.id === id)) {
      return state;
    }
    return {
      ...state,
      displayed: state.displayed.filter(el => el.id !== id),
      saved: [...state.saved, { ...item, state: DataItemState.Saved }],
    };
  }),
);
