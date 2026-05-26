import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-theme-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatRadioModule, TranslocoPipe],
  templateUrl: './theme-modal.component.html',
})
export class ThemeModalComponent {
  private readonly dialogRef = inject(MatDialogRef<ThemeModalComponent>);

  close(): void {
    this.dialogRef.close();
  }
}
