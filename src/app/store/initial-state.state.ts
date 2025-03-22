import {DisplayedDataState} from './displayedData/displayedData.reducers';
import {SavedDataState} from './savedData/savedData.reducers';

export interface AppState {
  displayedData: DisplayedDataState;
  savedData: SavedDataState;
}
