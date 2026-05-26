import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { AppTheme, ThemeService } from '../../../theme/theme.service';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-theme-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatRadioModule, TranslocoPipe],
  templateUrl: './theme-modal.component.html',
})
export class ThemeModalComponent {
  private readonly dialogRef = inject(MatDialogRef<ThemeModalComponent>);
  private readonly themeService = inject(ThemeService);

  readonly themes = this.themeService.themes;
  readonly selectedTheme = signal<AppTheme>(this.themeService.getTheme());

  selectTheme(theme: string): void {
    if (!this.themeService.isValidTheme(theme)) {
      return;
    }

    this.themeService.setTheme(theme);
    this.selectedTheme.set(theme);
  }

  close(): void {
    this.dialogRef.close();
  }
}
