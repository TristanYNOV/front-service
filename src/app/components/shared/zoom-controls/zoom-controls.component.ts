import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-zoom-controls',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSliderModule],
  templateUrl: './zoom-controls.component.html',
})
export class ZoomControlsComponent {
  @Input({ required: true }) value = 1;
  @Input({ required: true }) min = 0.25;
  @Input({ required: true }) max = 1;
  @Input({ required: true }) step = 0.05;
  @Input() invert = false;
  @Input() disabled = false;
  @Input() ariaLabel = 'Zoom controls';
  @Input() showPercent = true;

  @Output() valueChange = new EventEmitter<number>();

  readonly sliderValue = computed(() => (this.invert ? this.min + this.max - this.value : this.value));

  zoomOut() {
    this.emitClamped(this.value - this.step);
  }

  zoomIn() {
    this.emitClamped(this.value + this.step);
  }

  onSliderInput(event: Event) {
    const sliderInput = event.target as HTMLInputElement | null;
    if (!sliderInput) {
      return;
    }

    const raw = Number(sliderInput.value);
    const nextValue = this.invert ? this.min + this.max - raw : raw;
    this.emitClamped(nextValue);
  }

  zoomPercent() {
    return `${Math.round(this.value * 100)}%`;
  }

  private emitClamped(nextValue: number) {
    const clampedValue = this.clamp(nextValue);
    this.valueChange.emit(clampedValue);
  }

  private clamp(value: number) {
    return Math.min(this.max, Math.max(this.min, value));
  }
}
