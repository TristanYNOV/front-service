import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SequencerZoomService {
  readonly min = 0.25;
  readonly max = 1;
  readonly step = 0.05;
  readonly default = 1;

  private readonly _zoom = signal(this.default);
  readonly zoom = this._zoom.asReadonly();

  setZoom(value: number) {
    this._zoom.set(this.clamp(value));
  }

  zoomIn() {
    this.setZoom(this.zoom() + this.step);
  }

  zoomOut() {
    this.setZoom(this.zoom() - this.step);
  }

  private clamp(value: number) {
    return Math.min(this.max, Math.max(this.min, value));
  }
}
