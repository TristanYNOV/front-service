
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';

export interface PanelDescriptionDialogData {
  description: string | null;
}

export interface PanelDescriptionDialogResult {
  description: string | null;
}

@Component({
  selector: 'app-panel-description-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslocoPipe],
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
