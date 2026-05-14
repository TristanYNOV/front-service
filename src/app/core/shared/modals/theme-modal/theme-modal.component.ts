import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-theme-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatRadioModule],
  templateUrl: './theme-modal.component.html',
})
export class ThemeModalComponent {
  private readonly dialogRef = inject(MatDialogRef<ThemeModalComponent>);

  close(): void {
    this.dialogRef.close();
  }
}
