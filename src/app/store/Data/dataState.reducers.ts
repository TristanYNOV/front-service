import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { createReducer, on } from '@ngrx/store';
import {
  addToIdle,
  clearIdleData,
  displayFromIdle,
  displayFromSaved,
  loadDiscoverData,
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

const appPrice: AnyDataItems = {
  id: 'price-table-default',
  type: DataItemType.Price,
  state: DataItemState.Idle,
  plans: [
    {
      name: 'Indépendant',
      features: ['Analyse vidéo personnelle', 'Hébergement 12h'],
      videoRetention: '12h',
      price: 3,
    },
    {
      name: 'Indépendant Premium',
      features: ['Analyse vidéo personnelle', 'Hébergement 1 semaine'],
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

const projectGoal: AnyDataItems = {
  id: 'project-goal',
  type: DataItemType.Text,
  state: DataItemState.Displayed,
};

const uxUiWorkflow: AnyDataItems = {
  id: 'ux-ui-workflow',
  type: DataItemType.Text,
  state: DataItemState.Displayed,
};

const analysisPageOverview: AnyDataItems = {
  id: 'analysis-page-overview',
  type: DataItemType.Text,
  state: DataItemState.Displayed,
};

const videoShortcuts: AnyDataItems = {
  id: 'video-shortcuts',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const sequencerOverview: AnyDataItems = {
  id: 'sequencer-overview',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const timelineOverview: AnyDataItems = {
  id: 'timeline-overview',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const ffmpegInstallation: AnyDataItems = {
  id: 'ffmpeg-installation',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

export const initialDataState: DataState = {
  idle: [],
  displayed: [],
  saved: [],
};

export const dataStateReducer = createReducer(
  initialDataState,
  on(loadDiscoverData, state => ({
    ...state,
    idle: [appPrice, videoShortcuts, sequencerOverview, timelineOverview, ffmpegInstallation],
    displayed: [projectGoal, uxUiWorkflow, analysisPageOverview],
  })),
  on(clearIdleData, state => ({
    ...state,
    idle: [],
    displayed: [],
  })),
  on(addToIdle, (state, { item }) => {
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
    if (!item || state.displayed.some(el => el.id === id)) {
      return state;
    }

    return {
      ...state,
      displayed: [...state.displayed, { ...item, state: DataItemState.Displayed }],
    };
  }),
  on(saveFromIdle, (state, { id }) => {
    const item = state.idle.find(el => el.id === id);
    if (!item || state.saved.some(el => el.id === id)) {
      return state;
    }

    return {
      ...state,
      saved: [...state.saved, { ...item, state: DataItemState.Saved }],
    };
  }),
  on(removeFromDisplay, (state, { id }) => ({
    ...state,
    displayed: state.displayed.filter(item => item.id !== id),
  })),
  on(saveFromDisplay, (state, { id }) => {
    const item = state.displayed.find(el => el.id === id);
    if (!item || state.saved.some(el => el.id === id)) {
      return state;
    }

    return {
      ...state,
      displayed: state.displayed.filter(el => el.id !== id),
      saved: [...state.saved, { ...item, state: DataItemState.Saved }],
    };
  }),
  on(displayFromSaved, (state, { id }) => {
    const item = state.saved.find(el => el.id === id);
    if (!item || state.displayed.some(el => el.id === id)) {
      return state;
    }

    return {
      ...state,
      saved: state.saved.filter(el => el.id !== id),
      displayed: [...state.displayed, { ...item, state: DataItemState.Displayed }],
    };
  }),
);
