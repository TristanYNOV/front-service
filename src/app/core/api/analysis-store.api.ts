import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { runtimeEnvironment } from '../config/runtime-environment';
import {
  AnalysisStoreImportValidationPayload,
  AnalysisTimelineV1,
  CreatePanelResourceBody,
  CreateTimelineResourceBody,
  PanelImportValidationResponse,
  PanelResourceResponse,
  SequencerPanelV1,
  TimelineImportValidationResponse,
  TimelineResourceResponse,
  UpdatePanelResourceBody,
  UpdateTimelineResourceBody,
  UpsertPanelResourceBody,
  UpsertTimelineResourceBody,
} from '../../interfaces/analysis-store';

@Injectable({ providedIn: 'root' })
export class AnalysisStoreApi {
  private readonly http = inject(HttpClient);
  private readonly endpoints = runtimeEnvironment.analysisStoreEndpoints;

  validateTimelineImport(payload: AnalysisStoreImportValidationPayload): Observable<TimelineImportValidationResponse> {
    return this.http.post<TimelineImportValidationResponse>(this.endpoints.importsTimelinesValidate, payload);
  }

  validatePanelImport(payload: AnalysisStoreImportValidationPayload): Observable<PanelImportValidationResponse> {
    return this.http.post<PanelImportValidationResponse>(this.endpoints.importsPanelsValidate, payload);
  }

  listTimelines(): Observable<TimelineResourceResponse[]> {
    return this.http.get<TimelineResourceResponse[]>(this.endpoints.timelines);
  }

  getTimeline(id: string): Observable<TimelineResourceResponse> {
    return this.http.get<TimelineResourceResponse>(this.buildResourceUrl(this.endpoints.timelines, id));
  }

  exportTimeline(id: string): Observable<AnalysisTimelineV1> {
    return this.http.get<AnalysisTimelineV1>(this.buildExportUrl(this.endpoints.timelines, id));
  }

  upsertTimeline(payload: UpsertTimelineResourceBody): Observable<TimelineResourceResponse> {
    if (payload.id) {
      return this.updateTimeline(payload.id, payload);
    }

    return this.createTimeline(payload as CreateTimelineResourceBody);
  }

  createTimeline(payload: CreateTimelineResourceBody): Observable<TimelineResourceResponse> {
    return this.http.post<TimelineResourceResponse>(this.endpoints.timelines, payload);
  }

  updateTimeline(id: string, payload: UpdateTimelineResourceBody): Observable<TimelineResourceResponse> {
    return this.http.patch<TimelineResourceResponse>(this.buildResourceUrl(this.endpoints.timelines, id), payload);
  }

  deleteTimeline(id: string): Observable<void> {
    return this.http.delete<void>(this.buildResourceUrl(this.endpoints.timelines, id));
  }

  listPanels(): Observable<PanelResourceResponse[]> {
    return this.http.get<PanelResourceResponse[]>(this.endpoints.panels);
  }

  getPanel(id: string): Observable<PanelResourceResponse> {
    return this.http.get<PanelResourceResponse>(this.buildResourceUrl(this.endpoints.panels, id));
  }

  exportPanel(id: string): Observable<SequencerPanelV1> {
    return this.http.get<SequencerPanelV1>(this.buildExportUrl(this.endpoints.panels, id));
  }

  upsertPanel(payload: UpsertPanelResourceBody): Observable<PanelResourceResponse> {
    if (payload.id) {
      return this.updatePanel(payload.id, payload);
    }

    return this.createPanel(payload as CreatePanelResourceBody);
  }

  createPanel(payload: CreatePanelResourceBody): Observable<PanelResourceResponse> {
    return this.http.post<PanelResourceResponse>(this.endpoints.panels, payload);
  }

  updatePanel(id: string, payload: UpdatePanelResourceBody): Observable<PanelResourceResponse> {
    return this.http.patch<PanelResourceResponse>(this.buildResourceUrl(this.endpoints.panels, id), payload);
  }

  deletePanel(id: string): Observable<void> {
    return this.http.delete<void>(this.buildResourceUrl(this.endpoints.panels, id));
  }

  copyPanel(id: string): Observable<PanelResourceResponse> {
    return this.http.post<PanelResourceResponse>(`${this.buildResourceUrl(this.endpoints.panels, id)}/copy`, {});
  }

  private buildResourceUrl(collectionUrl: string, id: string): string {
    return `${collectionUrl}/${encodeURIComponent(id)}`;
  }

  private buildExportUrl(collectionUrl: string, id: string): string {
    return `${this.buildResourceUrl(collectionUrl, id)}/export`;
  }
}
