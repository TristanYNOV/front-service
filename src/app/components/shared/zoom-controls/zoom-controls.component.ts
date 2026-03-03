import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() disabled = false;
  @Input() ariaLabel = 'Zoom controls';
  @Output() valueChange = new EventEmitter<number>();

  zoomOut() {
    this.emitClamped(this.value - this.step);
  }

  zoomIn() {
    this.emitClamped(this.value + this.step);
  }

  onThumbInput(event: Event) {
    const sliderInput = event.target as HTMLInputElement | null;
    if (!sliderInput) {
      return;
    }

    this.emitClamped(Number.isFinite(sliderInput.valueAsNumber) ? sliderInput.valueAsNumber : Number(sliderInput.value));
  }


  private emitClamped(nextValue: number) {
    this.valueChange.emit(this.clamp(nextValue));
  }

  private clamp(value: number) {
    return Math.min(this.max, Math.max(this.min, value));
  }
}
