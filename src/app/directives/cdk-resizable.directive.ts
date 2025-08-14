import { AfterViewInit, Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: '[cdkResizable]',
  standalone: true,
})
export class CdkResizableDirective implements AfterViewInit, OnDestroy {
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

    this.elementRef.nativeElement.addEventListener('mouseup', this.emitSize);
    this.elementRef.nativeElement.addEventListener('touchend', this.emitSize);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.elementRef.nativeElement.removeEventListener('mouseup', this.emitSize);
    this.elementRef.nativeElement.removeEventListener('touchend', this.emitSize);
  }

  private emitSize = () => {
    if (this.lastSize) {
      this.cdkResizeEnd.emit(this.lastSize);
    }
  };
}
