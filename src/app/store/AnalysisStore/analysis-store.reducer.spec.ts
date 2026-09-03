import { PanelResourceResponse } from '../../interfaces/analysis-store';
import {
  analysisStoreDeletePanelSuccess,
  analysisStoreMakePanelPrivateSuccess,
} from './analysis-store.actions';
import { analysisStoreReducer, initialAnalysisStoreState } from './analysis-store.reducer';

describe('analysisStoreReducer panel ownership actions', () => {
  const publicPanel = buildPanelResource('panel-public', 'public');
  const privatePanel = buildPanelResource('panel-private', 'private');

  it('updates a listed panel when it is made private', () => {
    const state = {
      ...initialAnalysisStoreState,
      panel: {
        ...initialAnalysisStoreState.panel,
        currentResourceId: publicPanel.id,
        visibility: publicPanel.visibility,
        resources: [publicPanel, privatePanel],
      },
    };
    const updatedPanel = { ...publicPanel, visibility: 'private' as const, clubId: null };

    const next = analysisStoreReducer(
      state,
      analysisStoreMakePanelPrivateSuccess({ resource: updatedPanel }),
    );

    expect(next.panel.visibility).toBe('private');
    expect(next.panel.resources.find(resource => resource.id === publicPanel.id)?.visibility).toBe('private');
    expect(next.panel.resources.length).toBe(2);
  });

  it('removes a deleted panel from the list and detaches the current remote id', () => {
    const state = {
      ...initialAnalysisStoreState,
      panel: {
        ...initialAnalysisStoreState.panel,
        currentResourceId: publicPanel.id,
        visibility: publicPanel.visibility,
        resources: [publicPanel, privatePanel],
      },
    };

    const next = analysisStoreReducer(
      state,
      analysisStoreDeletePanelSuccess({ resourceId: publicPanel.id }),
    );

    expect(next.panel.currentResourceId).toBeNull();
    expect(next.panel.visibility).toBe('private');
    expect(next.panel.resources.map(resource => resource.id)).toEqual([privatePanel.id]);
  });
});

function buildPanelResource(id: string, visibility: PanelResourceResponse['visibility']): PanelResourceResponse {
  return {
    id,
    ownerUserId: 'owner-1',
    title: id,
    description: null,
    visibility,
    clubId: null,
    contentJson: { schemaVersion: '1.0.0', type: 'sequencer-panel', panelName: id, btnList: [] },
    hasAnonymizedContent: false,
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
  };
}
