import { DOCUMENT } from '@angular/common';
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
  analysisStoreExportTimeline,
  analysisStoreExportTimelineFailure,
  analysisStoreExportTimelineSuccess,
  analysisStoreHydratePanelFromValidatedPayload,
  analysisStoreHydrateTimelineResourceMeta,
  analysisStoreImportTimeline,
  analysisStoreImportTimelineFailure,
  analysisStoreImportTimelineSuccess,
  analysisStoreLoadPanelFromValidatedPayload,
  analysisStoreLoadRemoteTimeline,
  analysisStoreLoadRemoteTimelineFailure,
  analysisStoreLoadRemoteTimelineSuccess,
  analysisStoreLoadTimelineFromValidatedPayload,
  analysisStoreLoadTimelineList,
  analysisStoreLoadTimelineListFailure,
  analysisStoreLoadTimelineListSuccess,
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
  private readonly document = inject(DOCUMENT);

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

  readonly importTimeline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreImportTimeline),
      switchMap(({ payload, context }) =>
        this.analysisStoreApi.validateTimelineImport(payload).pipe(
          switchMap(response => {
            if (!response.valid || !response.normalizedPayload) {
              return of(analysisStoreImportTimelineFailure({ error: 'Import timeline invalide.' }));
            }

            return of(
              analysisStoreLoadTimelineFromValidatedPayload({ payload: response.normalizedPayload, context }),
              analysisStoreImportTimelineSuccess(),
            );
          }),
          catchError(error =>
            of(analysisStoreImportTimelineFailure({ error: error?.message ?? 'Timeline import validation failed' })),
          ),
        ),
      ),
    ),
  );

  readonly exportTimeline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreExportTimeline),
      withLatestFrom(this.store.select(selectTimelineState)),
      tap(([, timelineState]) => {
        const mappedTimeline = mapTimelineStateToAnalysisTimelineV1(timelineState);
        const fileName = `${mappedTimeline.timelineName || 'timeline'}.json`;
        const blob = new Blob([JSON.stringify(mappedTimeline, null, 2)], { type: 'application/json' });
        const link = this.document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      }),
      map(() => analysisStoreExportTimelineSuccess()),
      catchError(error => of(analysisStoreExportTimelineFailure({ error: error?.message ?? 'Timeline export failed' }))),
    ),
  );

  readonly loadTimelineList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreLoadTimelineList),
      switchMap(() =>
        this.analysisStoreApi.listTimelines().pipe(
          map(resources => analysisStoreLoadTimelineListSuccess({ resources })),
          catchError(error =>
            of(analysisStoreLoadTimelineListFailure({ error: error?.message ?? 'Timeline list loading failed' })),
          ),
        ),
      ),
    ),
  );

  readonly loadRemoteTimeline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreLoadRemoteTimeline),
      switchMap(({ resource }) =>
        this.analysisStoreApi.exportTimeline(resource.id).pipe(
          switchMap(payload =>
            of(
              analysisStoreLoadTimelineFromValidatedPayload({
                payload,
                context: {
                  resourceId: resource.id,
                  title: resource.title,
                  description: resource.description,
                  hasAnonymizedContent: resource.hasAnonymizedContent,
                },
              }),
              analysisStoreLoadRemoteTimelineSuccess(),
            ),
          ),
          catchError(error =>
            of(analysisStoreLoadRemoteTimelineFailure({ error: error?.message ?? 'Timeline loading failed' })),
          ),
        ),
      ),
    ),
  );
}
