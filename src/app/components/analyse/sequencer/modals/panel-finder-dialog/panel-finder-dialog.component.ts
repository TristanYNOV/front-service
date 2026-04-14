import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { AnalysisStoreVisibility, PanelResourceResponse, SequencerPanelV1 } from '../../../../../interfaces/analysis-store';
import { SequencerPanelBtnV1 } from '../../../../../interfaces/analysis-store/analysis-store-panel.interface';
import { PanelButtonsPreviewDialogComponent } from './panel-buttons-preview-dialog.component';

export interface PanelFinderDialogData {
  panels: PanelResourceResponse[];
  currentUserId: string | null;
}

export interface PanelFinderDialogResult {
  action: 'use' | 'copy';
  panel: PanelResourceResponse;
}

@Component({
  selector: 'app-panel-finder-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
  ],
  templateUrl: './panel-finder-dialog.component.html',
})
export class PanelFinderDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PanelFinderDialogComponent, PanelFinderDialogResult | null>);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<PanelFinderDialogData>(MAT_DIALOG_DATA);

  readonly searchTerm = signal('');
  readonly visibilityFilter = signal<'all' | AnalysisStoreVisibility>('all');
  readonly onlyMine = signal(false);

  readonly displayedColumns = ['title', 'visibility', 'events', 'labels', 'action'];

  readonly filteredPanels = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();
    const visibilityFilter = this.visibilityFilter();
    const onlyMine = this.onlyMine();

    return this.data.panels
      .filter(panel => {
        if (visibilityFilter !== 'all' && panel.visibility !== visibilityFilter) {
          return false;
        }
        if (onlyMine && !this.isOwner(panel)) {
          return false;
        }
        if (!searchTerm) {
          return true;
        }
        return panel.title.toLowerCase().includes(searchTerm);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  visibilityLabel(visibility: AnalysisStoreVisibility) {
    if (visibility === 'public') {
      return 'Public';
    }
    if (visibility === 'club') {
      return 'Club';
    }
    return 'Privé';
  }

  isOwner(panel: PanelResourceResponse) {
    return !!this.data.currentUserId && panel.ownerUserId === this.data.currentUserId;
  }

  showEvents(panel: PanelResourceResponse) {
    const names = this.extractNames(panel, 'event');
    this.dialog.open(PanelButtonsPreviewDialogComponent, {
      width: '420px',
      panelClass: 'analysis-panel-finder-preview-dialog',
      data: {
        title: 'Events du panel',
        names,
      },
    });
  }

  showLabels(panel: PanelResourceResponse) {
    const names = this.extractNames(panel, 'label');
    this.dialog.open(PanelButtonsPreviewDialogComponent, {
      width: '420px',
      panelClass: 'analysis-panel-finder-preview-dialog',
      data: {
        title: 'Labels du panel',
        names,
      },
    });
  }

  usePanel(panel: PanelResourceResponse) {
    this.dialogRef.close({ action: 'use', panel });
  }

  copyPanel(panel: PanelResourceResponse) {
    this.dialogRef.close({ action: 'copy', panel });
  }

  close() {
    this.dialogRef.close(null);
  }

  private extractNames(panel: PanelResourceResponse, type: SequencerPanelBtnV1['type']) {
    const payload = panel.contentJson as Partial<SequencerPanelV1>;
    const btnList = Array.isArray(payload.btnList) ? payload.btnList : [];
    return btnList
      .filter((button): button is SequencerPanelBtnV1 => !!button && typeof button === 'object' && 'type' in button)
      .filter(button => button.type === type)
      .map(button => button.name)
      .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
  }
}
