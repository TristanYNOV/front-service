
import { Injectable, inject, DOCUMENT } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { AnalysisStoreApi } from '../../core/api/analysis-store.api';
import { NotificationService } from '../../core/notifications/notification.service';
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
  analysisStoreCopyRemotePanel,
  analysisStoreCopyRemotePanelFailure,
  analysisStoreCopyRemotePanelSuccess,
  analysisStoreExportPanel,
  analysisStoreExportPanelFailure,
  analysisStoreExportPanelSuccess,
  analysisStoreExportTimeline,
  analysisStoreExportTimelineFailure,
  analysisStoreExportTimelineSuccess,
  analysisStoreHydratePanelFromValidatedPayload,
  analysisStoreHydrateTimelineResourceMeta,
  analysisStoreImportPanel,
  analysisStoreImportPanelFailure,
  analysisStoreImportPanelSuccess,
  analysisStoreImportTimeline,
  analysisStoreImportTimelineFailure,
  analysisStoreImportTimelineSuccess,
  analysisStoreLoadPanelList,
  analysisStoreLoadPanelListFailure,
  analysisStoreLoadPanelListSuccess,
  analysisStoreLoadRemotePanel,
  analysisStoreLoadRemotePanelFailure,
  analysisStoreLoadRemotePanelSuccess,
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
  private readonly notifications = inject(NotificationService);

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

  readonly importPanel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreImportPanel),
      switchMap(({ payload, context }) =>
        this.analysisStoreApi.validatePanelImport(payload).pipe(
          switchMap(response => {
            if (!response.valid || !response.normalizedPayload) {
              return of(analysisStoreImportPanelFailure({ error: 'Import panel invalide.' }));
            }

            return of(
              analysisStoreLoadPanelFromValidatedPayload({ payload: response.normalizedPayload, context }),
              analysisStoreImportPanelSuccess(),
            );
          }),
          catchError(error =>
            of(analysisStoreImportPanelFailure({ error: error?.message ?? 'Panel import validation failed' })),
          ),
        ),
      ),
    ),
  );

  readonly exportPanel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreExportPanel),
      withLatestFrom(this.store.select(selectAnalysisStorePanelState)),
      tap(([, panelState]) => {
        if (!panelState.currentContent) {
          throw new Error('No panel content to export.');
        }

        const mappedPanel = mapPanelStateToSequencerPanelV1(panelState.currentContent);
        const fileName = `${mappedPanel.panelName || 'panel'}.json`;
        const blob = new Blob([JSON.stringify(mappedPanel, null, 2)], { type: 'application/json' });
        const link = this.document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      }),
      map(() => analysisStoreExportPanelSuccess()),
      catchError(error => of(analysisStoreExportPanelFailure({ error: error?.message ?? 'Panel export failed' }))),
    ),
  );

  readonly loadPanelList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreLoadPanelList),
      switchMap(() =>
        this.analysisStoreApi.listPanels().pipe(
          map(resources => analysisStoreLoadPanelListSuccess({ resources })),
          catchError(error => of(analysisStoreLoadPanelListFailure({ error: error?.message ?? 'Panel list loading failed' }))),
        ),
      ),
    ),
  );

  readonly loadRemotePanel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreLoadRemotePanel),
      switchMap(({ resource }) =>
        this.analysisStoreApi.exportPanel(resource.id).pipe(
          switchMap(payload =>
            of(
              analysisStoreLoadPanelFromValidatedPayload({
                payload,
                context: {
                  resourceId: resource.id,
                  title: resource.title,
                  description: resource.description,
                  visibility: resource.visibility,
                  clubId: resource.clubId,
                  hasAnonymizedContent: resource.hasAnonymizedContent,
                },
              }),
              analysisStoreLoadRemotePanelSuccess(),
            ),
          ),
          catchError(error => of(analysisStoreLoadRemotePanelFailure({ error: error?.message ?? 'Panel loading failed' }))),
        ),
      ),
    ),
  );

  readonly copyRemotePanel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(analysisStoreCopyRemotePanel),
      switchMap(({ sourceResource }) =>
        this.analysisStoreApi.copyPanel(sourceResource.id).pipe(
          switchMap(copiedResource =>
            of(
              analysisStoreLoadRemotePanel({ resource: copiedResource }),
              analysisStoreCopyRemotePanelSuccess(),
            ),
          ),
          catchError(error => of(analysisStoreCopyRemotePanelFailure({ error: error?.message ?? 'Panel copy failed' }))),
        ),
      ),
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

  readonly notifyPanelSaveSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreSavePanelSuccess),
        tap(() => this.notifications.notifySuccess('notifications.panelSaved')),
      ),
    { dispatch: false },
  );

  readonly notifyPanelSaveFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreSavePanelFailure),
        tap(() => this.notifications.notifyError('errors.panelSave')),
      ),
    { dispatch: false },
  );

  readonly notifyPanelImportSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreImportPanelSuccess),
        tap(() => this.notifications.notifySuccess('notifications.panelImported')),
      ),
    { dispatch: false },
  );

  readonly notifyPanelImportFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreImportPanelFailure),
        tap(() => this.notifications.notifyError('errors.panelImportValidation')),
      ),
    { dispatch: false },
  );

  readonly notifyPanelExportSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreExportPanelSuccess),
        tap(() => this.notifications.notifySuccess('importExport.panelExportGenerated', undefined, 2200)),
      ),
    { dispatch: false },
  );

  readonly notifyPanelExportFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreExportPanelFailure),
        tap(() => this.notifications.notifyError('errors.panelExport')),
      ),
    { dispatch: false },
  );

  readonly notifyPanelLoadSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreLoadRemotePanelSuccess),
        tap(() => this.notifications.notifyInfo('notifications.panelLoaded', undefined, 2200)),
      ),
    { dispatch: false },
  );

  readonly notifyPanelLoadFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreLoadRemotePanelFailure),
        tap(() => this.notifications.notifyError('errors.panelLoad')),
      ),
    { dispatch: false },
  );

  readonly notifyPanelListFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreLoadPanelListFailure),
        tap(() => this.notifications.notifyError('errors.panelListLoad')),
      ),
    { dispatch: false },
  );

  readonly notifyPanelCopyFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreCopyRemotePanelFailure),
        tap(() => this.notifications.notifyError('errors.panelCopy')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineSaveSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreSaveTimelineSuccess),
        tap(() => this.notifications.notifySuccess('notifications.timelineSaved')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineSaveFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreSaveTimelineFailure),
        tap(() => this.notifications.notifyError('errors.timelineSave')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineImportSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreImportTimelineSuccess),
        tap(() => this.notifications.notifySuccess('notifications.timelineImported')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineImportFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreImportTimelineFailure),
        tap(() => this.notifications.notifyError('errors.timelineImportValidation')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineExportSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreExportTimelineSuccess),
        tap(() => this.notifications.notifySuccess('importExport.timelineExportGenerated', undefined, 2200)),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineExportFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreExportTimelineFailure),
        tap(() => this.notifications.notifyError('errors.timelineExport')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineLoadSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreLoadRemoteTimelineSuccess),
        tap(() => this.notifications.notifySuccess('notifications.timelineLoaded')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineLoadFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreLoadRemoteTimelineFailure),
        tap(() => this.notifications.notifyError('errors.timelineLoad')),
      ),
    { dispatch: false },
  );

  readonly notifyTimelineListFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(analysisStoreLoadTimelineListFailure),
        tap(() => this.notifications.notifyError('errors.timelineListLoad')),
      ),
    { dispatch: false },
  );
}
