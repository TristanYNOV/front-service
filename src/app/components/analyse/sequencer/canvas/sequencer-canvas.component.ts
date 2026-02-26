import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SequencerPanelService } from '../../../../core/service/sequencer-panel.service';
import { SequencerBtn } from '../../../../interfaces/sequencer-btn.interface';
import {
  contentMinHeightPx,
  contentMinWidthPx,
  contentPaddingPx,
  minButtonHeightPx,
  minButtonWidthPx,
  panDragThresholdPx,
} from '../../../../utils/sequencer/sequencer-canvas-defaults.util';
import { formatNormalizedHotkey } from '../../../../utils/sequencer/sequencer-hotkey-options.util';

@Component({
  selector: 'app-sequencer-canvas',
  standalone: true,
  templateUrl: './sequencer-canvas.component.html',
  styleUrl: './sequencer-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class SequencerCanvasComponent {
  private readonly panelService = inject(SequencerPanelService);

  @Input({ required: true }) btnList: SequencerBtn[] = [];
  @Input({ required: true }) editMode = false;
  @Input({ required: true }) activeIndefiniteIds: string[] = [];
  @Input() lastTriggeredBtnId: string | null = null;
  @Input() triggerCountByBtnId: Record<string, number> = {};

  @Output() triggerBtn = new EventEmitter<SequencerBtn>();
  @Output() editBtn = new EventEmitter<SequencerBtn>();
  @Output() deleteBtn = new EventEmitter<SequencerBtn>();

  readonly contentStyle = computed(() => {
    const maxRight = this.btnList.reduce((acc, btn) => {
      const right = (btn.layout?.x ?? 0) + (btn.layout?.w ?? minButtonWidthPx);
      return Math.max(acc, right);
    }, 0);

    const maxBottom = this.btnList.reduce((acc, btn) => {
      const bottom = (btn.layout?.y ?? 0) + (btn.layout?.h ?? minButtonHeightPx);
      return Math.max(acc, bottom);
    }, 0);

    return {
      width: `${Math.max(contentMinWidthPx, maxRight + contentPaddingPx)}px`,
      height: `${Math.max(contentMinHeightPx, maxBottom + contentPaddingPx)}px`,
    };
  });

  readonly contentBounds = computed(() => {
    const style = this.contentStyle();
    return {
      width: Number.parseInt(style.width, 10) || contentMinWidthPx,
      height: Number.parseInt(style.height, 10) || contentMinHeightPx,
    };
  });

  private readonly panState = signal<{
    viewport: HTMLElement;
    startClientX: number;
    startClientY: number;
    startScrollLeft: number;
    startScrollTop: number;
    hasMoved: boolean;
  } | null>(null);

  private readonly dragState = signal<{
    btnId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  private readonly resizeState = signal<{
    btnId: string;
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } | null>(null);

  ensureBtnLayout(btn: SequencerBtn) {
    return this.panelService.ensureLayout(btn);
  }

  btnStyle(btn: SequencerBtn) {
    const layout = this.ensureBtnLayout(btn);
    return {
      left: `${layout.x}px`,
      top: `${layout.y}px`,
      width: `${layout.w}px`,
      height: `${layout.h}px`,
      zIndex: `${layout.z ?? 1}`,
    };
  }

  onViewportMouseDown(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    const viewport = event.currentTarget as HTMLElement | null;
    const target = event.target as HTMLElement | null;
    if (!viewport || !target) {
      return;
    }

    const isBackground = target.dataset['panSurface'] === 'true';
    if (!isBackground) {
      return;
    }

    this.panState.set({
      viewport,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
      hasMoved: false,
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onCanvasMouseMove(event: MouseEvent) {
    const pan = this.panState();
    if (pan) {
      const deltaX = event.clientX - pan.startClientX;
      const deltaY = event.clientY - pan.startClientY;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance > panDragThresholdPx) {
        pan.viewport.scrollLeft = pan.startScrollLeft - deltaX;
        pan.viewport.scrollTop = pan.startScrollTop - deltaY;
        this.panState.set({ ...pan, hasMoved: true });
      }
    }

    const drag = this.dragState();
    if (drag) {
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const next = this.clampLayoutWithinCanvas(drag.btnId, {
        x: drag.originX + deltaX,
        y: drag.originY + deltaY,
      });
      this.panelService.updateLayout(drag.btnId, next);
    }

    const resize = this.resizeState();
    if (resize) {
      const deltaX = event.clientX - resize.startX;
      const deltaY = event.clientY - resize.startY;
      const next = this.clampLayoutWithinCanvas(resize.btnId, {
        w: Math.max(minButtonWidthPx, resize.originW + deltaX),
        h: Math.max(minButtonHeightPx, resize.originH + deltaY),
      });
      this.panelService.updateLayout(resize.btnId, next);
    }
  }

  @HostListener('document:mouseup')
  onCanvasMouseUp() {
    this.panState.set(null);
    this.dragState.set(null);
    this.resizeState.set(null);
  }

  onBtnMouseDown(event: MouseEvent, btn: SequencerBtn) {
    event.stopPropagation();
    this.panelService.bringBtnToFront(btn.id);

    if (!this.editMode || event.button !== 0) {
      return;
    }

    const layout = this.ensureBtnLayout(btn);
    this.dragState.set({
      btnId: btn.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: layout.x,
      originY: layout.y,
    });
  }

  onResizeHandleMouseDown(event: MouseEvent, btn: SequencerBtn) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.editMode || event.button !== 0) {
      return;
    }

    this.panelService.bringBtnToFront(btn.id);
    const layout = this.ensureBtnLayout(btn);
    this.resizeState.set({
      btnId: btn.id,
      startX: event.clientX,
      startY: event.clientY,
      originW: layout.w,
      originH: layout.h,
    });
  }

  onBtnClick(event: MouseEvent, btn: SequencerBtn) {
    event.stopPropagation();
    if (this.editMode) {
      return;
    }
    this.triggerBtn.emit(btn);
  }

  onEditIconClick(event: MouseEvent, btn: SequencerBtn) {
    event.stopPropagation();
    this.editBtn.emit(btn);
  }

  onDeleteIconClick(event: MouseEvent, btn: SequencerBtn) {
    event.stopPropagation();
    this.deleteBtn.emit(btn);
  }

  isActive(btnId: string) {
    return this.activeIndefiniteIds.includes(btnId);
  }

  triggerCount(btnId: string) {
    return this.triggerCountByBtnId[btnId] ?? 0;
  }

  formatHotkey(normalized?: string | null) {
    return formatNormalizedHotkey(normalized) || '—';
  }

  private clampLayoutWithinCanvas(btnId: string, patch: { x?: number; y?: number; w?: number; h?: number }) {
    const target = this.btnList.find(btn => btn.id === btnId);
    if (!target) {
      return patch;
    }

    const base = this.ensureBtnLayout(target);
    const bounds = this.contentBounds();

    const w = Math.max(minButtonWidthPx, Math.min(patch.w ?? base.w, bounds.width));
    const h = Math.max(minButtonHeightPx, Math.min(patch.h ?? base.h, bounds.height));
    const maxX = Math.max(0, bounds.width - w);
    const maxY = Math.max(0, bounds.height - h);
    const x = Math.min(Math.max(patch.x ?? base.x, 0), maxX);
    const y = Math.min(Math.max(patch.y ?? base.y, 0), maxY);

    return { x, y, w, h };
  }
}
