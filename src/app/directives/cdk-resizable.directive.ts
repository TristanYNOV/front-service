import { AfterViewInit, Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: '[cdkResizable]',
  standalone: true,
})
export class CdkResizableDirective implements AfterViewInit, OnDestroy {
  @Output() cdkResizeStart = new EventEmitter<void>();
  @Output() cdkResizeEnd = new EventEmitter<DOMRectReadOnly>();
  private observer?: ResizeObserver;
  private lastSize?: DOMRectReadOnly;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.lastSize = entry.contentRect;
        }
      });
      this.observer.observe(this.elementRef.nativeElement);
    }

    const element = this.elementRef.nativeElement;
    element.addEventListener('mousedown', this.checkResizeStart);
    element.addEventListener('touchstart', this.checkResizeStart);
    element.addEventListener('mouseup', this.emitSize);
    element.addEventListener('touchend', this.emitSize);
  }

  ngOnDestroy() {
    const element = this.elementRef.nativeElement;
    this.observer?.disconnect();
    element.removeEventListener('mousedown', this.checkResizeStart);
    element.removeEventListener('touchstart', this.checkResizeStart);
    element.removeEventListener('mouseup', this.emitSize);
    element.removeEventListener('touchend', this.emitSize);
  }

  private checkResizeStart = (event: MouseEvent | TouchEvent) => {
    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const edgeSize = 10;
    if (x > rect.width - edgeSize && y > rect.height - edgeSize) {
      this.cdkResizeStart.emit();
    }
  };

  private emitSize = () => {
    if (this.lastSize) {
      this.cdkResizeEnd.emit(this.lastSize);
    }
  };
}
