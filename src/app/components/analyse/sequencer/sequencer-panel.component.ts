import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { SequencerPanelService } from '../../../core/service/sequencer-panel.service';
import { SequencerRuntimeService } from '../../../core/service/sequencer-runtime.service';
import { HotkeysService } from '../../../core/services/hotkeys.service';
import { EventBtn, LabelBtn, SequencerBtn } from '../../../interfaces/sequencer-btn.interface';
import { formatNormalizedHotkey } from '../../../utils/sequencer/sequencer-hotkey-options.util';
import { CreateEventBtnDialogComponent } from './createBtn/event/create-event-btn-dialog.component';
import { CreateLabelBtnDialogComponent } from './createBtn/label/create-label-btn-dialog.component';
import { SequencerCanvasComponent } from './canvas/sequencer-canvas.component';

@Component({
  selector: 'app-sequencer-panel',
  standalone: true,
  templateUrl: './sequencer-panel.component.html',
  styleUrl: './sequencer-panel.component.scss',
  imports: [
    CommonModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    SequencerCanvasComponent,
  ],
})
export class SequencerPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('panelRoot', { static: true }) panelRoot?: ElementRef<HTMLElement>;

  private readonly panelService = inject(SequencerPanelService);
  private readonly runtimeService = inject(SequencerRuntimeService);
  private readonly hotkeysService = inject(HotkeysService);
  private readonly dialog = inject(MatDialog);
  private resizeObserver?: ResizeObserver;

  readonly panelName = this.panelService.panelName;
  readonly btnList = this.panelService.btnList;
  readonly editMode = this.panelService.editMode;
  readonly recentTriggers = this.runtimeService.recentTriggers;
  readonly lastTriggeredBtnId = this.runtimeService.lastTriggeredBtnId;
  readonly triggerCountByBtnId = this.runtimeService.triggerCountByBtnId;
  readonly activeIndefiniteIds = this.runtimeService.activeIndefiniteIds;

  readonly showRenameInput = signal(false);
  readonly renameDraft = signal(this.panelName());
  readonly compactMode = signal(false);
  readonly showEditIcons = computed(() => this.editMode() && !this.compactMode());

  readonly sortedBtnList = computed(() => [...this.btnList()]);

  ngAfterViewInit() {
    this.panelService.ensureAllLayouts();
    const element = this.panelRoot?.nativeElement;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? element.clientWidth;
      const isCompact = width < 360;
      this.compactMode.set(isCompact);
      if (isCompact && this.editMode()) {
        this.panelService.setEditMode(false);
      }
    });
    this.resizeObserver.observe(element);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  toggleEditMode() {
    if (this.compactMode()) {
      return;
    }
    this.panelService.toggleEditMode();
  }

  openEventDialog(btn?: EventBtn) {
    this.dialog.open(CreateEventBtnDialogComponent, {
      width: '60%',
      data: { mode: btn ? 'edit' : 'create', btn },
    });
  }

  openLabelDialog(btn?: LabelBtn) {
    this.dialog.open(CreateLabelBtnDialogComponent, {
      width: '60%',
      data: { mode: btn ? 'edit' : 'create', btn },
    });
  }

  onBtnClick(btn: SequencerBtn) {
    if (this.editMode()) {
      return;
    }
    this.runtimeService.trigger(btn.id, 'click');
  }

  openEditDialog(btn: SequencerBtn) {
    if (btn.type === 'event') {
      this.openEventDialog(btn);
    } else {
      this.openLabelDialog(btn);
    }
  }

  deleteBtn(btn: SequencerBtn) {
    this.panelService.removeBtn(btn.id);
    this.hotkeysService.unassignSequencerHotkeyByAction(btn.id);
  }

  toggleRename() {
    if (!this.showRenameInput()) {
      this.renameDraft.set(this.panelName());
      this.showRenameInput.set(true);
      return;
    }
    this.saveRename();
  }

  saveRename() {
    this.panelService.setPanelName(this.renameDraft());
    this.showRenameInput.set(false);
  }

  onRenameInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    this.renameDraft.set(target.value);
  }

  formatHotkey(normalized?: string | null) {
    return formatNormalizedHotkey(normalized) || '—';
  }

  formatTimestamp(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { hour12: false });
  }
}
