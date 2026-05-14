import { createReducer, on } from '@ngrx/store';
import { DataItemState, DataItemType } from '../../enum/state.enum';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
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

export interface DataState {
  idle: AnyDataItems[];
  displayed: AnyDataItems[];
  saved: AnyDataItems[];
}

const featuresGuide: AnyDataItems = {
  id: 'features-guide',
  type: DataItemType.Text,
  state: DataItemState.Displayed,
};

const videoShortcuts: AnyDataItems = {
  id: 'video-shortcuts',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const videoAnalysisHowItWorks: AnyDataItems = {
  id: 'video-analysis-how-it-works',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const analysisPanelHowItWorks: AnyDataItems = {
  id: 'analysis-panel-how-it-works',
  type: DataItemType.Text,
  state: DataItemState.Idle,
};

const saveAndShareHowItWorks: AnyDataItems = {
  id: 'save-and-share-how-it-works',
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
    idle: [videoShortcuts, videoAnalysisHowItWorks, analysisPanelHowItWorks, saveAndShareHowItWorks],
    displayed: [featuresGuide],
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
