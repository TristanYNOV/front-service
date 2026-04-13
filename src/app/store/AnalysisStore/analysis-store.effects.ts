import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { AnalysisStoreApi } from '../../core/api/analysis-store.api';
import {
  hasAnonymizedButtons,
  mapPanelStateToSequencerPanelV1,
  mapSequencerPanelV1ToPanelState,
} from '../../core/mappers/analysis-store/panel-analysis-store.mapper';
import { SequencerPanelService } from '../../core/service/sequencer-panel.service';
import {
  mapAnalysisTimelineV1ToTimelineDocument,
  mapTimelineStateToAnalysisTimelineV1,
} from '../../core/mappers/analysis-store/timeline-analysis-store.mapper';
import { initTimeline } from '../Timeline/timeline.actions';
import { selectTimelineState } from '../Timeline/timeline.selectors';
import {
  analysisStoreHydratePanelFromValidatedPayload,
  analysisStoreHydrateTimelineResourceMeta,
  analysisStoreLoadPanelFromValidatedPayload,
  analysisStoreLoadTimelineFromValidatedPayload,
  analysisStoreSavePanel,
  analysisStoreSavePanelFailure,
  analysisStoreSavePanelSuccess,
  analysisStoreSaveTimeline,
  analysisStoreSaveTimelineFailure,
  analysisStoreSaveTimelineSuccess,
} from './analysis-store.actions';
import { selectAnalysisStorePanelState, selectAnalysisStoreTimelineState } from './analysis-store.selectors';

@Injectable()
export class AnalysisStoreEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly analysisStoreApi = inject(AnalysisStoreApi);
  private readonly sequencerPanelService = inject(SequencerPanelService);

  readonly savePanel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreSavePanel),
      withLatestFrom(this.store.select(selectAnalysisStorePanelState)),
      switchMap(([action, panelState]) => {
        if (!panelState.currentContent) {
          return of(analysisStoreSavePanelFailure({ error: 'No panel content to save.' }));
        }

        const mappedPanel = mapPanelStateToSequencerPanelV1(panelState.currentContent);
        const hasAnonymizedContent = hasAnonymizedButtons(panelState.currentContent);
        const payload = {
          id: action.payload?.id ?? panelState.currentResourceId ?? undefined,
          title: action.payload?.title ?? panelState.title ?? mappedPanel.panelName,
          description: action.payload?.description ?? panelState.description,
          visibility: action.payload?.visibility ?? panelState.visibility,
          clubId: action.payload?.clubId ?? panelState.clubId,
          hasAnonymizedContent,
          contentJson: mappedPanel as unknown as Record<string, unknown>,
        };

        return this.analysisStoreApi.upsertPanel(payload).pipe(
          map(resource => analysisStoreSavePanelSuccess({ resource })),
          catchError(error => of(analysisStoreSavePanelFailure({ error: error?.message ?? 'Panel save failed' }))),
        );
      }),
    ),
  );

  readonly saveTimeline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreSaveTimeline),
      withLatestFrom(this.store.select(selectTimelineState), this.store.select(selectAnalysisStoreTimelineState)),
      switchMap(([action, timelineState, resourceMeta]) => {
        const mappedTimeline = mapTimelineStateToAnalysisTimelineV1(timelineState);
        const payload = {
          id: action.payload?.id ?? resourceMeta.currentResourceId ?? undefined,
          title: action.payload?.title ?? resourceMeta.title ?? mappedTimeline.timelineName,
          description: action.payload?.description ?? resourceMeta.description,
          hasAnonymizedContent: action.payload?.hasAnonymizedContent ?? resourceMeta.hasAnonymizedContent,
          contentJson: mappedTimeline as unknown as Record<string, unknown>,
        };

        return this.analysisStoreApi.upsertTimeline(payload).pipe(
          map(resource => analysisStoreSaveTimelineSuccess({ resource })),
          catchError(error => of(analysisStoreSaveTimelineFailure({ error: error?.message ?? 'Timeline save failed' }))),
        );
      }),
    ),
  );

  readonly loadPanelFromValidatedPayload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreLoadPanelFromValidatedPayload),
      map(({ payload, context }) =>
        analysisStoreHydratePanelFromValidatedPayload({
          panel: mapSequencerPanelV1ToPanelState(payload),
          context,
        }),
      ),
    ),
  );

  readonly syncHydratedPanelToSequencerService$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreHydratePanelFromValidatedPayload),
        tap(({ panel }) => this.sequencerPanelService.setPanel(panel)),
      ),
    { dispatch: false },
  );

  readonly loadTimelineFromValidatedPayload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreLoadTimelineFromValidatedPayload),
      map(({ payload }) => {
        const mappedTimeline = mapAnalysisTimelineV1ToTimelineDocument(payload);
        return initTimeline({
          schemaVersion: mappedTimeline.schemaVersion,
          meta: mappedTimeline.meta,
          definitions: mappedTimeline.definitions,
          occurrences: mappedTimeline.occurrences,
        });
      }),
    ),
  );

  readonly hydrateTimelineMetaFromValidatedPayload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreLoadTimelineFromValidatedPayload),
      map(({ payload, context }) => analysisStoreHydrateTimelineResourceMeta({ timeline: payload, context })),
    ),
  );
}
