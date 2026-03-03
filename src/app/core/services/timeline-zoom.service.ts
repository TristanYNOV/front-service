import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimelineZoomService {
  readonly minUi = 0.05;
  readonly maxUi = 1;
  readonly stepUi = 0.05;
  readonly defaultUi = 1;

  private readonly _uiZoom = signal(this.defaultUi);
  readonly uiZoom = this._uiZoom.asReadonly();

  setUiZoom(value: number) {
    this._uiZoom.set(this.clamp(value));
  }

  zoomIn() {
    this.setUiZoom(this.uiZoom() + this.stepUi);
  }

  zoomOut() {
    this.setUiZoom(this.uiZoom() - this.stepUi);
  }

  private clamp(value: number) {
    return Math.min(this.maxUi, Math.max(this.minUi, value));
  }
}
