import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PanelDescriptionDialogData {
  description: string | null;
}

export interface PanelDescriptionDialogResult {
  description: string | null;
}

@Component({
  selector: 'app-panel-description-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './panel-description-dialog.component.html',
})
export class PanelDescriptionDialogComponent {
  readonly data = inject<PanelDescriptionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PanelDescriptionDialogComponent, PanelDescriptionDialogResult | null>);

  readonly description = signal(this.data.description ?? '');

  close() {
    this.dialogRef.close(null);
  }

  submit() {
    const trimmed = this.description().trim();
    this.dialogRef.close({ description: trimmed ? trimmed : null });
  }
}
