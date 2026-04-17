import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  effect,
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { filter, firstValueFrom, skip, take } from 'rxjs';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { SequencerPanelService } from '../../../core/service/sequencer-panel.service';
import { SequencerRuntimeService } from '../../../core/service/sequencer-runtime.service';
import { HotkeysService } from '../../../core/services/hotkeys.service';
import { AnalysisStoreVisibility, SequencerPanelV1 } from '../../../interfaces/analysis-store';
import { EventBtn, LabelBtn, SequencerBtn, StatBtn } from '../../../interfaces/sequencer-btn.interface';
import {
  analysisStoreCopyRemotePanel,
  analysisStoreExportPanel,
  analysisStoreImportPanel,
  analysisStoreLoadPanelList,
  analysisStoreLoadRemotePanel,
  analysisStoreResetPanelState,
  analysisStoreSavePanel,
  analysisStoreSetCurrentPanel,
} from '../../../store/AnalysisStore/analysis-store.actions';
import {
  selectAnalysisStorePanelOps,
  selectAnalysisStorePanelResources,
  selectAnalysisStorePanelState,
} from '../../../store/AnalysisStore/analysis-store.selectors';
import { hasImportDataLoss } from '../../../utils/sequencer/sequencer-panel-import.util';
import { CreateEventBtnDialogComponent } from './createBtn/event/create-event-btn-dialog.component';
import { CreateLabelBtnDialogComponent } from './createBtn/label/create-label-btn-dialog.component';
import { CreateStatBtnDialogComponent } from './createBtn/stat/create-stat-btn-dialog.component';
import { SequencerCanvasComponent } from './canvas/sequencer-canvas.component';
import { PanelFinderDialogComponent, PanelFinderDialogResult } from './modals/panel-finder-dialog/panel-finder-dialog.component';
import { PanelDescriptionDialogComponent } from './modals/panel-description-dialog/panel-description-dialog.component';
import { PanelPublishDialogComponent } from './modals/panel-publish-dialog/panel-publish-dialog.component';

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
    MatSnackBarModule,
    SequencerCanvasComponent,
  ],
})
export class SequencerPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('panelRoot', { static: true }) panelRoot?: ElementRef<HTMLElement>;
  @ViewChild('panelFileInput', { static: true }) panelFileInput?: ElementRef<HTMLInputElement>;

  private readonly panelService = inject(SequencerPanelService);
  private readonly runtimeService = inject(SequencerRuntimeService);
  private readonly hotkeysService = inject(HotkeysService);
  private readonly authSession = inject(AuthSessionService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private resizeObserver?: ResizeObserver;
  private readonly panelState = this.store.selectSignal(selectAnalysisStorePanelState);
  private readonly panelResources = this.store.selectSignal(selectAnalysisStorePanelResources);

  readonly panelName = this.panelService.panelName;
  readonly btnList = this.panelService.btnList;
  readonly editMode = this.panelService.editMode;
  readonly lastTriggeredBtnId = this.runtimeService.lastTriggeredBtnId;
  readonly activeIndefiniteIds = this.runtimeService.activeIndefiniteIds;

  readonly showRenameInput = signal(false);
  readonly renameDraft = signal(this.panelName());
  readonly compactMode = signal(false);
  readonly showEditIcons = computed(() => this.editMode() && !this.compactMode());

  readonly sortedBtnList = computed(() => [...this.btnList()]);

  constructor() {
    effect(() => {
      const panel = this.panelService.getPanel();
      this.store.dispatch(analysisStoreSetCurrentPanel({ panel }));
    });
  }

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
  openStatDialog(btn?: StatBtn) {
    this.dialog.open(CreateStatBtnDialogComponent, {
      width: '70%',
      data: { mode: btn ? 'edit' : 'create', btn },
    });
  }

  onBtnClick(btn: SequencerBtn) {
    if (this.editMode() || btn.type === 'stat') {
      return;
    }
    this.runtimeService.trigger(btn.id, 'click');
  }

  openEditDialog(btn: SequencerBtn) {
    if (btn.type === 'event') {
      this.openEventDialog(btn);
      return;
    }

    if (btn.type === 'label') {
      this.openLabelDialog(btn);
      return;
    }

    this.openStatDialog(btn);
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

  triggerImportPanel() {
    this.panelFileInput?.nativeElement.click();
  }

  async onImportPanelFileSelected(event: Event) {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }

    target.value = '';
    try {
      const rawContent = await file.text();
      const parsedPayload = JSON.parse(rawContent) as Record<string, unknown>;

      if (this.shouldConfirmReplaceCurrentPanelOnImport(parsedPayload)) {
        const shouldContinue = await this.confirmDialogService.confirm({
          title: 'Écraser le panel courant ?',
          message: 'Le panel courant sera remplacé par le fichier importé.',
          confirmLabel: 'Écraser',
          cancelLabel: 'Annuler',
        });
        if (!shouldContinue) {
          return;
        }
      }

      this.store.dispatch(analysisStoreImportPanel({ payload: parsedPayload }));
    } catch {
      this.snackBar.open('Le fichier sélectionné n’est pas un JSON valide.', 'Fermer', { duration: 3500 });
      return;
    }
  }

  exportPanel() {
    this.store.dispatch(analysisStoreExportPanel());
  }

  savePrivatePanel() {
    this.store.dispatch(
      analysisStoreSavePanel({
        payload: {
          visibility: 'private',
          clubId: null,
        },
      }),
    );
  }

  async createNewPanel() {
    if (this.panelService.getPanel().btnList.length > 0) {
      const shouldContinue = await this.confirmDialogService.confirm({
        title: 'Create a new panel?',
        message: 'The current panel contains buttons. Continuing will discard the current panel.',
        confirmLabel: 'Create new panel',
        cancelLabel: 'Cancel',
      });

      if (!shouldContinue) {
        return;
      }
    }

    this.panelService.resetPanel();
    this.runtimeService.resetRuntimeState();
    this.store.dispatch(analysisStoreResetPanelState());
  }

  async openPanelFinderDialog() {
    this.store.dispatch(analysisStoreLoadPanelList());
    await firstValueFrom(
      this.store.select(selectAnalysisStorePanelOps).pipe(
        skip(1),
        filter(ops => !ops.isLoadingList),
        take(1),
      ),
    );

    const panels = this.panelResources();
    if (!panels.length) {
      this.snackBar.open('Aucun panel distant disponible.', 'Fermer', { duration: 2800 });
      return;
    }

    const dialogRef = this.dialog.open(PanelFinderDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      panelClass: 'analysis-panel-finder-dialog',
      data: {
        panels,
        currentUserId: this.authSession.user()?.id ?? null,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: PanelFinderDialogResult | null) => {
      if (!result) {
        return;
      }

      if (!(await this.confirmReplaceCurrentPanel())) {
        return;
      }

      if (result.action === 'use') {
        this.store.dispatch(analysisStoreLoadRemotePanel({ resource: result.panel }));
        return;
      }

      this.store.dispatch(analysisStoreCopyRemotePanel({ sourceResource: result.panel }));
    });
  }

  openEditDescriptionDialog() {
    const dialogRef = this.dialog.open(PanelDescriptionDialogComponent, {
      width: '460px',
      maxWidth: '94vw',
      panelClass: 'analysis-panel-description-dialog',
      data: { description: this.panelState().description },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.store.dispatch(
        analysisStoreSavePanel({
          payload: {
            description: result.description,
          },
        }),
      );
    });
  }

  openPublishDialog() {
    const panelState = this.panelState();
    const dialogRef = this.dialog.open(PanelPublishDialogComponent, {
      width: '420px',
      data: {
        hasClubId: !!panelState.clubId,
        currentVisibility: panelState.visibility,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.dispatchPublishSave(result.visibility);
    });
  }

  private dispatchPublishSave(visibility: AnalysisStoreVisibility) {
    const panelState = this.panelState();
    const clubId = visibility === 'club' ? panelState.clubId : null;
    this.store.dispatch(
      analysisStoreSavePanel({
        payload: {
          visibility,
          clubId,
        },
      }),
    );
  }

  private async confirmReplaceCurrentPanel(): Promise<boolean> {
    const panelContent = this.panelService.getPanel();
    if (!panelContent.btnList.length) {
      return true;
    }

    return this.confirmDialogService.confirm({
      title: 'Écraser le panel courant ?',
      message: 'Le panel courant sera remplacé par le panel distant sélectionné.',
      confirmLabel: 'Écraser',
      cancelLabel: 'Annuler',
    });
  }

  private shouldConfirmReplaceCurrentPanelOnImport(rawPayload: Record<string, unknown>): boolean {
    const panelContent = this.panelService.getPanel();
    const maybePanelPayload = rawPayload as Partial<SequencerPanelV1>;

    if (!Array.isArray(maybePanelPayload.btnList)) {
      return panelContent.btnList.length > 0;
    }

    return hasImportDataLoss(panelContent, maybePanelPayload as SequencerPanelV1);
  }
}
