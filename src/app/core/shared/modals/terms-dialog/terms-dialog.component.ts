import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LegalContentComponent } from '../../../../components/legal-content/legal-content.component';

@Component({
  selector: 'app-terms-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, LegalContentComponent],
  templateUrl: './terms-dialog.component.html',
})
export class TermsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TermsDialogComponent>);

  close(): void {
    this.dialogRef.close();
  }
}
