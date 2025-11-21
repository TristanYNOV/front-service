import { AfterViewInit, Directive, ElementRef, EventEmitter, OnDestroy, Output, inject } from '@angular/core';

@Directive({
  selector: '[appCdkResizable]',
  standalone: true,
})
export class CdkResizableDirective implements AfterViewInit, OnDestroy {
  @Output() cdkResizeStart = new EventEmitter<void>();
  @Output() cdkResizeEnd = new EventEmitter<DOMRectReadOnly>();
  private observer?: ResizeObserver;
  private lastSize?: DOMRectReadOnly;
  private resizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;

  private elementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);

  ngAfterViewInit() {
    if (typeof window === 'undefined') {
      return;
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          this.lastSize = entry.contentRect;
        }
      });
      this.observer.observe(this.elementRef.nativeElement);
    }

    const element = this.elementRef.nativeElement;
    element.addEventListener('mousedown', this.checkResizeStart, true);
    element.addEventListener('touchstart', this.checkResizeStart, true);
    element.addEventListener('mouseup', this.emitSize);
    element.addEventListener('touchend', this.emitSize);
  }

  ngOnDestroy() {
    if (typeof window === 'undefined') {
      return;
    }
    const element = this.elementRef.nativeElement;
    this.observer?.disconnect();
    element.removeEventListener('mousedown', this.checkResizeStart, true);
    element.removeEventListener('touchstart', this.checkResizeStart, true);
    element.removeEventListener('mouseup', this.emitSize);
    element.removeEventListener('touchend', this.emitSize);
    window.removeEventListener('mousemove', this.onPointerMove, true);
    window.removeEventListener('touchmove', this.onPointerMove, true);
    window.removeEventListener('mouseup', this.stopResizing, true);
    window.removeEventListener('touchend', this.stopResizing, true);
  }

  private checkResizeStart = (event: MouseEvent | TouchEvent) => {
    if (typeof window === 'undefined') {
      return;
    }
    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const edgeSize = 10;
    if (x > rect.width - edgeSize && y > rect.height - edgeSize) {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.cdkResizeStart.emit();
      this.resizing = true;
      this.startX = clientX;
      this.startY = clientY;
      this.startWidth = rect.width;
      this.startHeight = rect.height;
      window.addEventListener('mousemove', this.onPointerMove, true);
      window.addEventListener('touchmove', this.onPointerMove, true);
      window.addEventListener('mouseup', this.stopResizing, true);
      window.addEventListener('touchend', this.stopResizing, true);
    }
  };

  private emitSize = () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (this.lastSize) {
      this.cdkResizeEnd.emit(this.lastSize);
    }
  };

  private onPointerMove = (event: MouseEvent | TouchEvent) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!this.resizing) {
      return;
    }
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const element = this.elementRef.nativeElement;
    const nextWidth = Math.max(0, this.startWidth + (clientX - this.startX));
    const nextHeight = Math.max(0, this.startHeight + (clientY - this.startY));
    element.style.width = `${nextWidth}px`;
    element.style.height = `${nextHeight}px`;
    const rect = element.getBoundingClientRect();
    this.lastSize = rect;
  };

  private stopResizing = () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!this.resizing) {
      return;
    }
    this.resizing = false;
    window.removeEventListener('mousemove', this.onPointerMove, true);
    window.removeEventListener('touchmove', this.onPointerMove, true);
    window.removeEventListener('mouseup', this.stopResizing, true);
    window.removeEventListener('touchend', this.stopResizing, true);
    if (this.lastSize) {
      this.cdkResizeEnd.emit(this.lastSize);
    }
  };
}
