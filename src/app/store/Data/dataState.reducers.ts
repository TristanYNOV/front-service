import { AnyDataItems } from '../../interfaces/dataItem.interface';
import {createReducer} from '@ngrx/store';

export interface DataState {
  idle: AnyDataItems[];
  displayed: AnyDataItems[];
  saved: AnyDataItems[];
}

// TODO: Store it in special service
const appPrice: AnyDataItems = {
  id: 'price-table-default',
  type: 'price',
  state: 'displayed',
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

export const initialDataState: DataState = {
  idle: [],
  displayed: [appPrice],
  saved: [],
};

export const dataStateReducer = createReducer(
  initialDataState
);
