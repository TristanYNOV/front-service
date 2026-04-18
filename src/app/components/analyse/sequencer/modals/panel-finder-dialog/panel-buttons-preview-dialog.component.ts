import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface PanelButtonsPreviewDialogData {
  title: string;
  names: string[];
}

@Component({
  selector: 'app-panel-buttons-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="bg-layer-3 text-default m-0 text-center">{{ data.title }}</h2>
    <mat-dialog-content class="bg-layer-3 text-default pt-3">
      @if (data.names.length === 0) {
        <p class="text-muted m-0 text-xs">Aucune donnée disponible.</p>
      } @else {
        <ul class="m-0 pl-4 text-sm">
          @for (name of data.names; track name) {
            <li>{{ name }}</li>
          }
        </ul>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="bg-layer-3 pb-3 pr-3">
      <button mat-button type="button" (click)="close()">Fermer</button>
    </mat-dialog-actions>
  `,
})
export class PanelButtonsPreviewDialogComponent {
  readonly data = inject<PanelButtonsPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PanelButtonsPreviewDialogComponent>);

  close() {
    this.dialogRef.close();
  }
}
