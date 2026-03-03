import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimelineZoomService {
  readonly min = 0.05;
  readonly max = 1;
  readonly step = 0.05;
  readonly default = 1;

  private readonly _uiZoom = signal(this.default);
  readonly uiZoom = this._uiZoom.asReadonly();

  setUiZoom(value: number) {
    this._uiZoom.set(this.clamp(value));
  }

  zoomIn() {
    this.setUiZoom(this.uiZoom() + this.step);
  }

  zoomOut() {
    this.setUiZoom(this.uiZoom() - this.step);
  }

  private clamp(value: number) {
    return Math.min(this.max, Math.max(this.min, value));
  }
}
