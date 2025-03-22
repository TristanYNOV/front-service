import { createAction, props } from '@ngrx/store';
import {DisplayedData} from '../../interfaces/displayedData.interface';

export const loadDisplayedData = createAction('[DisplayedData] Load Data',props<{ data: DisplayedData[] }>());
export const clearDisplayedData = createAction('[DisplayedData] Clear Data');

export const addDisplayedData = createAction('[DisplayedData] Add Data to display', props<{ data: DisplayedData }>());
// Failed to add data in display state if there is already 4 data in state
export const addDisplayedDataFailed = createAction('[DisplayedData] Add Data to display failed',props<{ data: DisplayedData }>());
export const addDisplayedDataSuccess = createAction('[DisplayedData] Add Data to display failed',props<{ data: DisplayedData }>());
