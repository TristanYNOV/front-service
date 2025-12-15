import { Directive, ElementRef, EventEmitter, Output, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CdkDragResizeDirective, DragResizeRect } from '../../directives/cdk-drag-resize.directive';

export interface PaneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Directive({
  selector: '[appAnalysisPane]',
  standalone: true,
})
export class AnalysisPaneDirective implements OnDestroy {
  @Output() dragEnd = new EventEmitter<PaneRect>();
  @Output() resizeEnd = new EventEmitter<PaneRect>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly dragResize = inject(CdkDragResizeDirective);
  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(this.dragResize.cdkResizeEnded.subscribe(rect => this.emitRect(this.resizeEnd, rect)));
    this.subscriptions.add(this.dragResize.cdkDragEnded.subscribe(rect => this.emitRect(this.dragEnd, rect)));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private emitRect(emitter: EventEmitter<PaneRect>, rect?: DragResizeRect) {
    const bounds = this.elementRef.nativeElement.getBoundingClientRect();
    const value = rect
      ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      : { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
    emitter.emit(value);
  }
}
