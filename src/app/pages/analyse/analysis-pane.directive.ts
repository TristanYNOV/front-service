import { Directive, ElementRef, EventEmitter, HostListener, Output, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CdkResizableDirective } from '../../directives/cdk-resizable.directive';

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
  private readonly resizeDirective = inject(CdkResizableDirective);
  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      this.resizeDirective.cdkResizeEnd.subscribe(() => this.emitRect(this.resizeEnd)),
    );
  }

  @HostListener('cdkDragEnded')
  onDragEnded() {
    this.emitRect(this.dragEnd);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private emitRect(emitter: EventEmitter<PaneRect>) {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    emitter.emit({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }
}
