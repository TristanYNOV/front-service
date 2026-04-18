import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

export interface PanelPublishDialogData {
  hasClubId: boolean;
  currentVisibility: 'private' | 'club' | 'public';
}

export interface PanelPublishDialogResult {
  visibility: 'club' | 'public';
}

@Component({
  selector: 'app-panel-publish-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatRadioModule],
  templateUrl: './panel-publish-dialog.component.html',
})
export class PanelPublishDialogComponent {
  readonly data = inject<PanelPublishDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PanelPublishDialogComponent, PanelPublishDialogResult | null>);

  readonly visibility = signal<'club' | 'public'>(this.data.currentVisibility === 'club' && this.data.hasClubId ? 'club' : 'public');

  close() {
    this.dialogRef.close(null);
  }

  submit() {
    this.dialogRef.close({ visibility: this.visibility() });
  }
}
