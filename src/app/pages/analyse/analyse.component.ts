import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoDisplayComponent } from '../../components/analyse/video-display/video-display.component';
import { SequencerPanelComponent } from '../../components/analyse/sequencer/sequencer-panel.component';
import { TimelineComponent } from '../../components/analyse/timeline/timeline.component';
import { AnalysisPaneDirective, PaneRect } from './analysis-pane.directive';
import { CdkDragResizeDirective } from '../../directives/cdk-drag-resize.directive';
import { LayoutEditModeService } from '../../core/services/layout-edit-mode.service';
import { HotkeysService } from '../../core/services/hotkeys.service';

type PaneKey = 'video' | 'sequencer' | 'timeline';

interface PaneState {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-analyse',
  standalone: true,
  templateUrl: './analyse.component.html',
  imports: [
    CommonModule,
    VideoDisplayComponent,
    SequencerPanelComponent,
    TimelineComponent,
    AnalysisPaneDirective,
    CdkDragResizeDirective,
  ],
})
export class AnalyseComponent implements AfterViewInit, OnDestroy {
  @ViewChild('analysisContainer', { static: true }) analysisContainer?: ElementRef<HTMLElement>;
  private readonly changeDetectorRef: ChangeDetectorRef = inject(ChangeDetectorRef);
  protected readonly layoutEditMode = inject(LayoutEditModeService);
  private readonly hotkeysService = inject(HotkeysService);

  readonly minWidth = 160;
  readonly minHeight = 120;

  panes: Record<PaneKey, PaneState> = {
    video: { x: 0, y: 0, width: 640, height: 360 },
    sequencer: { x: 0, y: 0, width: 320, height: 360 },
    timeline: { x: 0, y: 0, width: 640, height: 240 },
  };

  ngAfterViewInit() {
    this.measureContainer();
    this.initializeLayout();
    this.hotkeysService.initReservedVideoHotkeys();
    this.hotkeysService.enable();
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.hotkeysService.disable();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.measureContainer();
    this.realignPanes();
  }

  panePosition(key: PaneKey) {
    const pane = this.panes[key];
    return { x: pane.x, y: pane.y };
  }

  paneStyle(key: PaneKey) {
    const pane = this.panes[key];
    return {
      width: `${pane.width}px`,
      height: `${pane.height}px`,
      minWidth: `${this.minWidth}px`,
      minHeight: `${this.minHeight}px`,
    };
  }

  onPaneDragEnd(key: PaneKey, rect: PaneRect) {
    this.applyUpdate(key, rect);
  }

  onPaneResizeEnd(key: PaneKey, rect: PaneRect) {
    this.applyUpdate(key, rect);
  }

  private initializeLayout() {
    const { width, height } = this.getContainerRect();
    const videoWidth = Math.max(width * 0.7, this.minWidth);
    const videoHeight = Math.max(height * 0.6, this.minHeight);
    const sequencerWidth = Math.max(width * 0.3, this.minWidth);
    const sequencerHeight = Math.max(height * 0.6, this.minHeight);
    const timelineHeight = Math.max(height * 0.4, this.minHeight);

    this.panes = {
      video: this.clampRect({ x: 0, y: 0, width: videoWidth, height: videoHeight }),
      sequencer: this.clampRect({
        x: width - sequencerWidth,
        y: 0,
        width: sequencerWidth,
        height: sequencerHeight,
      }),
      timeline: this.clampRect({ x: 0, y: height - timelineHeight, width: width, height: timelineHeight }),
    };
  }

  private applyUpdate(key: PaneKey, rect: PaneRect) {
    const relativeRect = this.toRelativeRect(rect);
    const clampedRect = this.clampRect(relativeRect);
    if (this.hasExcessiveOverlap(key, clampedRect)) {
      return;
    }
    this.panes = { ...this.panes, [key]: clampedRect };
  }

  private hasExcessiveOverlap(targetKey: PaneKey, rect: PaneState): boolean {
    const target = this.toAbsolute(rect);
    return (Object.entries(this.panes) as [PaneKey, PaneState][])
      .filter(([key]) => key !== targetKey)
      .some(( pane) => {
        const comparison = this.toAbsolute(pane[1]);
        const intersection = this.intersectionArea(target, comparison);
        const minArea = Math.min(this.area(target), this.area(comparison));
        return minArea > 0 && intersection / minArea >= 0.9;
      });
  }

  private intersectionArea(a: DOMRect, b: DOMRect) {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    return width * height;
  }

  private area(rect: DOMRect) {
    return rect.width * rect.height;
  }

  private toRelativeRect(rect: PaneRect): PaneRect {
    // Drag-resize events already report coordinates relative to the analysis container
    // thanks to the directive's boundary handling, so we can pass them through without
    // re-offsetting. Keeping these values untouched prevents panes from jumping when
    // a click emits an unchanged rect.
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }

  private toAbsolute(rect: PaneState): DOMRect {
    const container = this.getContainerRect();
    return new DOMRect(
      container.left + rect.x,
      container.top + rect.y,
      rect.width,
      rect.height,
    );
  }

  private clampRect(rect: PaneRect): PaneState {
    const container = this.getContainerRect();
    const width = Math.round(Math.min(container.width, Math.max(rect.width, this.minWidth)));
    const height = Math.round(Math.min(container.height, Math.max(rect.height, this.minHeight)));
    const maxX = Math.max(0, container.width - width);
    const maxY = Math.max(0, container.height - height);
    const x = Math.round(Math.min(Math.max(rect.x, 0), maxX));
    const y = Math.round(Math.min(Math.max(rect.y, 0), maxY));
    return { x, y, width, height };
  }

  private getContainerRect(): DOMRect {
    const element = this.analysisContainer?.nativeElement;
    if (!element) {
      return new DOMRect(0, 0, 0, 0);
    }
    element.style.position = 'relative';
    return element.getBoundingClientRect();
  }

  private measureContainer() {
    this.getContainerRect();
  }

  private realignPanes() {
    (Object.keys(this.panes) as PaneKey[]).forEach(key => {
      const pane = this.panes[key];
      this.panes = { ...this.panes, [key]: this.clampRect(pane) };
    });
  }
}
