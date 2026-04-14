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
import { firstValueFrom } from 'rxjs';
import { AnalysisStoreApi } from '../../../core/api/analysis-store.api';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { mapPanelStateToSequencerPanelV1 } from '../../../core/mappers/analysis-store/panel-analysis-store.mapper';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { SequencerPanelService } from '../../../core/service/sequencer-panel.service';
import { SequencerRuntimeService } from '../../../core/service/sequencer-runtime.service';
import { HotkeysService } from '../../../core/services/hotkeys.service';
import { AnalysisStoreVisibility } from '../../../interfaces/analysis-store';
import { EventBtn, LabelBtn, SequencerBtn, StatBtn } from '../../../interfaces/sequencer-btn.interface';
import {
  analysisStoreLoadPanelFromValidatedPayload,
  analysisStoreSavePanel,
  analysisStoreSetCurrentPanel,
} from '../../../store/AnalysisStore/analysis-store.actions';
import { selectAnalysisStorePanelState } from '../../../store/AnalysisStore/analysis-store.selectors';
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
  private readonly analysisStoreApi = inject(AnalysisStoreApi);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private resizeObserver?: ResizeObserver;
  private readonly panelState = this.store.selectSignal(selectAnalysisStorePanelState);

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
      this.analysisStoreApi.validatePanelImport(parsedPayload).subscribe({
        next: async response => {
          if (!response.valid || !response.normalizedPayload) {
            this.snackBar.open('Import invalide: vérifiez le fichier JSON.', 'Fermer', { duration: 3500 });
            return;
          }

          if (hasImportDataLoss(this.panelService.getPanel(), response.normalizedPayload)) {
            const shouldContinue = await this.confirmDialogService.confirm({
              title: 'Écraser le panel courant ?',
              message: 'Des boutons seront perdus. Voulez-vous continuer ?',
              confirmLabel: 'Écraser',
              cancelLabel: 'Annuler',
            });
            if (!shouldContinue) {
              return;
            }
          }

          this.store.dispatch(analysisStoreLoadPanelFromValidatedPayload({ payload: response.normalizedPayload }));
          this.snackBar.open('Panel importé avec succès.', 'Fermer', { duration: 2500 });
        },
        error: () => {
          this.snackBar.open('Échec de validation du panel importé.', 'Fermer', { duration: 3500 });
        },
      });
    } catch {
      this.snackBar.open('Le fichier sélectionné n’est pas un JSON valide.', 'Fermer', { duration: 3500 });
      return;
    }
  }

  exportPanel() {
    const mapped = mapPanelStateToSequencerPanelV1(this.panelService.getPanel());
    const blob = new Blob([JSON.stringify(mapped, null, 2)], { type: 'application/json' });
    const fileName = `${mapped.panelName || 'panel'}.json`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    this.snackBar.open('Export JSON généré.', 'Fermer', { duration: 2000 });
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

  async openPanelFinderDialog() {
    try {
      const panels = await firstValueFrom(this.analysisStoreApi.listPanels());
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

        if (result.action === 'use') {
          await this.loadPanelResource(result.panel.id, result.panel);
          return;
        }

        await this.copyAndLoadPanel(result.panel.id);
      });
    } catch {
      this.snackBar.open('Impossible de charger la liste des panels.', 'Fermer', { duration: 3500 });
    }
  }

  openEditDescriptionDialog() {
    const dialogRef = this.dialog.open(PanelDescriptionDialogComponent, {
      width: '460px',
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

  private async loadPanelResource(panelId: string, contextResource: { id: string; title: string; description: string | null; visibility: AnalysisStoreVisibility; clubId: string | null; hasAnonymizedContent: boolean; }) {
    try {
      const payload = await firstValueFrom(this.analysisStoreApi.exportPanel(panelId));
      if (hasImportDataLoss(this.panelService.getPanel(), payload)) {
        const shouldContinue = await this.confirmDialogService.confirm({
          title: 'Écraser le panel courant ?',
          message: 'Le panel courant sera remplacé. Voulez-vous continuer ?',
          confirmLabel: 'Écraser',
          cancelLabel: 'Annuler',
        });
        if (!shouldContinue) {
          return;
        }
      }

      this.store.dispatch(
        analysisStoreLoadPanelFromValidatedPayload({
          payload,
          context: {
            resourceId: contextResource.id,
            title: contextResource.title,
            description: contextResource.description,
            visibility: contextResource.visibility,
            clubId: contextResource.clubId,
            hasAnonymizedContent: contextResource.hasAnonymizedContent,
          },
        }),
      );
      this.snackBar.open('Panel chargé.', 'Fermer', { duration: 2200 });
    } catch {
      this.snackBar.open('Impossible de charger ce panel.', 'Fermer', { duration: 3500 });
    }
  }

  private async copyAndLoadPanel(sourcePanelId: string) {
    try {
      const copied = await firstValueFrom(this.analysisStoreApi.copyPanel(sourcePanelId));
      await this.loadPanelResource(copied.id, copied);
    } catch {
      this.snackBar.open('Impossible de copier ce panel.', 'Fermer', { duration: 3500 });
    }
  }
}
