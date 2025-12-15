import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter, inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
} from '@angular/core';

export interface DragResizeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AspectLock = false | 'auto' | number | string;
type ResizeDirection = 'top' | 'bottom' | 'left' | 'right' | 'corner';

@Directive({
  selector: '[appCdkDragResize]',
  standalone: true,
})
export class CdkDragResizeDirective implements AfterViewInit, OnDestroy, OnChanges {
  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly zone = inject(NgZone);

  @Input() cdkDragBoundary?: string | HTMLElement;
  @Input() cdkDragFreeDragPosition: { x: number; y: number } = { x: 0, y: 0 };
  @Input() boundsSelector?: string;
  @Input() minSize: { w: number; h: number } = { w: 160, h: 120 };
  @Input() zIndex = 1;
  @Input() zIndexMin = 1;
  @Input() zIndexMax = 10;
  @Input() lockAspectRatio: AspectLock = false;

  @Output() cdkDragStarted = new EventEmitter<DragResizeRect>();
  @Output() cdkDragMoved = new EventEmitter<DragResizeRect>();
  @Output() cdkDragEnded = new EventEmitter<DragResizeRect>();
  @Output() cdkResizeStarted = new EventEmitter<DragResizeRect>();
  @Output() cdkResized = new EventEmitter<DragResizeRect>();
  @Output() cdkResizeEnded = new EventEmitter<DragResizeRect>();
  @Output() zIndexChange = new EventEmitter<number>();

  private cleanup: (() => void)[] = [];
  private aspectRatio?: number;
  private pointerId?: number;
  private pointerMoved = false;
  private activeMode: 'drag' | 'resize' | null = null;
  private resizeDir: ResizeDirection = 'corner';
  private startRect!: DragResizeRect;
  private startPointer = { x: 0, y: 0 };
  private host!: HTMLElement;
  private ring!: HTMLElement;
  private content!: HTMLElement;
  private removeActiveWindowListeners?: () => void;
  private initialLayoutRect?: DOMRect;

  ngAfterViewInit(): void {
    this.host = this.elementRef.nativeElement;
    this.initialLayoutRect = this.host.getBoundingClientRect();
    this.host.classList.add('rzr-wrap');
    this.host.style.position = this.host.style.position || 'absolute';
    this.host.style.zIndex = `${this.zIndex}`;

    this.setupStructure();
    this.applyInitialPosition();
    this.initAspectRatio();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.host) {
      return;
    }

    if (changes['zIndex'] && !changes['zIndex'].isFirstChange()) {
      this.host.style.zIndex = `${this.zIndex}`;
    }

    if (changes['cdkDragFreeDragPosition'] && this.cdkDragFreeDragPosition) {
      this.applyPositionFromInput();
    }
  }

  ngOnDestroy(): void {
    this.removeActiveWindowListeners?.();
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
  }

  onZUp(): void {
    const next = Math.min(this.zIndexMax, this.zIndex + 1);
    if (next !== this.zIndex) {
      this.zIndex = next;
      this.host.style.zIndex = `${this.zIndex}`;
      this.zIndexChange.emit(this.zIndex);
    }
  }

  onZDown(): void {
    const next = Math.max(this.zIndexMin, this.zIndex - 1);
    if (next !== this.zIndex) {
      this.zIndex = next;
      this.host.style.zIndex = `${this.zIndex}`;
      this.zIndexChange.emit(this.zIndex);
    }
  }

  private setupStructure() {
    const existingChildren = Array.from(this.host.childNodes);

    this.ring = this.renderer.createElement('div');
    this.ring.classList.add('rzr-ring');

    this.content = this.renderer.createElement('div');
    this.content.classList.add('rzr-content');

    existingChildren.forEach(child => this.renderer.appendChild(this.content, child));

    this.renderer.appendChild(this.host, this.ring);
    this.renderer.appendChild(this.host, this.content);

    this.createHandle('top', 'n-resize');
    this.createHandle('bottom', 's-resize');
    this.createHandle('left', 'w-resize');
    this.createHandle('right', 'e-resize');
    this.createHandle('corner', 'move', 'top-left');
    this.createHandle('corner', 'nwse-resize', 'bottom-right');
    this.createZButtons();
  }

  private applyInitialPosition() {
    const parentRect = this.getBoundsRect();
    const layoutRect = this.initialLayoutRect ?? this.host.getBoundingClientRect();
    const width = layoutRect.width || this.minSize.w;
    const height = layoutRect.height || this.minSize.h;
    const x = this.cdkDragFreeDragPosition?.x ?? layoutRect.left - parentRect.left;
    const y = this.cdkDragFreeDragPosition?.y ?? layoutRect.top - parentRect.top;
    this.applyRect(this.clampRect({ x, y, width, height }));
  }

  private initAspectRatio() {
    if (this.lockAspectRatio === false) {
      return;
    }
    if (typeof this.lockAspectRatio === 'number') {
      this.aspectRatio = this.lockAspectRatio;
      return;
    }
    if (typeof this.lockAspectRatio === 'string' && this.lockAspectRatio !== 'auto') {
      const parsed = this.lockAspectRatio.split('/').map(v => Number(v));
      if (parsed.length === 2 && parsed.every(v => Number.isFinite(v) && v > 0)) {
        this.aspectRatio = parsed[0] / parsed[1];
      }
      return;
    }
    this.aspectRatio = 16 / 9;
    if (this.lockAspectRatio === 'auto') {
      const video = this.content.querySelector('video');
      if (video) {
        const handler = () => {
          if (video.videoWidth && video.videoHeight) {
            this.aspectRatio = video.videoWidth / video.videoHeight;
          }
        };
        video.addEventListener('loadedmetadata', handler);
        this.cleanup.push(() => video.removeEventListener('loadedmetadata', handler));
        if (video.videoWidth && video.videoHeight) {
          this.aspectRatio = video.videoWidth / video.videoHeight;
        }
      } else if (this.host.dataset['aspect']) {
        const value = Number(this.host.dataset['aspect']);
        if (Number.isFinite(value) && value > 0) {
          this.aspectRatio = value;
        }
      }
    }
  }

  private createHandle(direction: ResizeDirection, cursor: string, position?: 'top-left' | 'bottom-right') {
    const handle = this.renderer.createElement('div');
    handle.classList.add('rzr-handle', `rzr-handle-${direction}`);
    if (position) {
      handle.classList.add(`rzr-handle-${position}`);
    }
    this.renderer.setStyle(handle, 'cursor', cursor);

    const remove = this.renderer.listen(handle, 'pointerdown', (event: PointerEvent) =>
      this.onHandlePointerDown(event, direction, position),
    );
    this.cleanup.push(remove);

    this.renderer.appendChild(this.ring, handle);
  }

  private createZButtons() {
    const container = this.renderer.createElement('div');
    container.classList.add('rzr-zindex');

    const up = this.renderer.createElement('button');
    up.type = 'button';
    up.textContent = '+';
    up.classList.add('rzr-zup');
    const removeUp = this.renderer.listen(up, 'click', () => this.onZUp());
    this.cleanup.push(removeUp);

    const down = this.renderer.createElement('button');
    down.type = 'button';
    down.textContent = '-';
    down.classList.add('rzr-zdown');
    const removeDown = this.renderer.listen(down, 'click', () => this.onZDown());
    this.cleanup.push(removeDown);

    this.renderer.appendChild(container, up);
    this.renderer.appendChild(container, down);
    this.renderer.appendChild(this.ring, container);
  }

  private onHandlePointerDown(event: PointerEvent, direction: ResizeDirection, position?: 'top-left' | 'bottom-right') {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();

    this.pointerId = event.pointerId;
    this.pointerMoved = false;
    this.activeMode = direction === 'corner' && position === 'top-left' ? 'drag' : 'resize';
    this.resizeDir = direction;
    this.startPointer = { x: event.clientX, y: event.clientY };
    this.startRect = this.getCurrentRect();

    const emitStart = this.activeMode === 'drag' ? this.cdkDragStarted : this.cdkResizeStarted;
    emitStart.emit(this.startRect);

    this.zone.runOutsideAngular(() => {
      const moveListener = (e: PointerEvent) => this.onPointerMove(e);
      const upListener = (e: PointerEvent) => this.onPointerUp(e);
      window.addEventListener('pointermove', moveListener, true);
      window.addEventListener('pointerup', upListener, true);
      this.removeActiveWindowListeners = () => {
        window.removeEventListener('pointermove', moveListener, true);
        window.removeEventListener('pointerup', upListener, true);
      };
    });
  }

  private applyPositionFromInput() {
    const current = this.getCurrentRect();
    const x = this.cdkDragFreeDragPosition?.x ?? current.x;
    const y = this.cdkDragFreeDragPosition?.y ?? current.y;
    const next = this.clampRect({ x, y, width: current.width, height: current.height });
    if (this.areRectsEqual(next, current)) {
      return;
    }
    this.applyRect(next);
  }

  private onPointerMove(event: PointerEvent) {
    if (this.pointerId !== undefined && event.pointerId !== this.pointerId) {
      return;
    }
    if (!this.activeMode) {
      return;
    }
    event.preventDefault();
    const dx = Math.round(event.clientX - this.startPointer.x);
    const dy = Math.round(event.clientY - this.startPointer.y);

    if (!this.pointerMoved && Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      return;
    }

    this.pointerMoved = true;

    if (this.activeMode === 'drag') {
      const next = this.clampRect({
        x: this.startRect.x + dx,
        y: this.startRect.y + dy,
        width: this.startRect.width,
        height: this.startRect.height,
      });
      this.applyRect(next);
      this.cdkDragMoved.emit(next);
      return;
    }

    const rect = { ...this.startRect };
    switch (this.resizeDir) {
      case 'top':
        rect.y += dy;
        rect.height -= dy;
        break;
      case 'bottom':
        rect.height += dy;
        break;
      case 'left':
        rect.x += dx;
        rect.width -= dx;
        break;
      case 'right':
        rect.width += dx;
        break;
      case 'corner':
        rect.width += dx;
        rect.height += dy;
        break;
    }

    const adjusted = this.applyAspect(rect, this.resizeDir);
    const clamped = this.clampRect(adjusted);
    this.applyRect(clamped);
    this.cdkResized.emit(clamped);
  }

  private onPointerUp(event: PointerEvent) {
    if (this.pointerId !== undefined && event.pointerId !== this.pointerId) {
      return;
    }
    if (!this.activeMode) {
      return;
    }
    const finalRect = this.getCurrentRect();
    if (this.activeMode === 'drag') {
      this.cdkDragEnded.emit(finalRect);
    } else {
      this.cdkResizeEnded.emit(finalRect);
    }
    this.removeActiveWindowListeners?.();
    this.removeActiveWindowListeners = undefined;
    this.activeMode = null;
    this.pointerId = undefined;
    this.pointerMoved = false;
  }

  private getBoundsElement(): HTMLElement | null {
    if (this.boundsSelector) {
      const target = document.querySelector(this.boundsSelector);
      if (target instanceof HTMLElement) {
        return target;
      }
    }

    if (this.cdkDragBoundary) {
      if (typeof this.cdkDragBoundary === 'string') {
        const boundary = document.querySelector(this.cdkDragBoundary);
        if (boundary instanceof HTMLElement) {
          return boundary;
        }
        return null;
      }
      if (this.cdkDragBoundary instanceof HTMLElement) {
        return this.cdkDragBoundary;
      }
    }

    return this.host.parentElement;
  }

  private getBoundsRect(): DOMRect {
    return this.getBoundsElement()?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
  }

  private clampRect(rect: DragResizeRect): DragResizeRect {
    const bounds = this.getBoundsRect();
    const width = Math.round(Math.min(bounds.width, Math.max(rect.width, this.minSize.w)));
    const height = Math.round(Math.min(bounds.height, Math.max(rect.height, this.minSize.h)));
    const maxX = Math.max(0, bounds.width - width);
    const maxY = Math.max(0, bounds.height - height);
    const x = Math.round(Math.min(Math.max(rect.x, 0), maxX));
    const y = Math.round(Math.min(Math.max(rect.y, 0), maxY));
    return { x, y, width, height };
  }

  private applyRect(rect: DragResizeRect) {
    this.host.style.left = `${rect.x}px`;
    this.host.style.top = `${rect.y}px`;
    this.host.style.width = `${rect.width}px`;
    this.host.style.height = `${rect.height}px`;
  }

  private areRectsEqual(a: DragResizeRect, b: DragResizeRect): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }

  private getCurrentRect(): DragResizeRect {
    const bounds = this.getBoundsRect();
    const rect = this.host.getBoundingClientRect();
    return {
      x: rect.left - bounds.left,
      y: rect.top - bounds.top,
      width: rect.width,
      height: rect.height,
    };
  }

  private applyAspect(rect: DragResizeRect, direction: ResizeDirection): DragResizeRect {
    if (!this.aspectRatio) {
      return rect;
    }
    if (direction === 'top' || direction === 'bottom') {
      rect.width = rect.height * this.aspectRatio;
    } else if (direction === 'left' || direction === 'right') {
      rect.height = rect.width / this.aspectRatio;
    } else {
      const lockedWidth = rect.height * this.aspectRatio;
      const lockedHeight = rect.width / this.aspectRatio;
      if (Math.abs(lockedWidth - rect.width) > Math.abs(lockedHeight - rect.height)) {
        rect.width = lockedWidth;
      } else {
        rect.height = lockedHeight;
      }
    }
    return rect;
  }
}
