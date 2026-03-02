import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

interface TimelineLabelsDialogData {
  occurrenceId: string;
  selectedLabelIds: string[];
  labelDefs: { id: string; name: string }[];
  toggleLabel: (occurrenceId: string, labelId: string) => void;
}

@Component({
  selector: 'app-timeline-labels-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatCheckboxModule, MatButtonModule],
  templateUrl: './timeline-labels-dialog.component.html',
  styleUrl: './timeline-labels-dialog.component.scss',
})
export class TimelineLabelsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TimelineLabelsDialogComponent>);
  readonly data = inject<TimelineLabelsDialogData>(MAT_DIALOG_DATA);

  readonly search = signal('');

  readonly filteredLabelDefs = computed(() => {
    const searchTerm = this.search().trim().toLowerCase();
    if (!searchTerm) {
      return this.data.labelDefs;
    }
    return this.data.labelDefs.filter(definition => definition.name.toLowerCase().includes(searchTerm));
  });

  isChecked(labelId: string) {
    return this.data.selectedLabelIds.includes(labelId);
  }

  onToggleLabel(labelId: string) {
    this.data.toggleLabel(this.data.occurrenceId, labelId);
    if (this.isChecked(labelId)) {
      this.data.selectedLabelIds = this.data.selectedLabelIds.filter(id => id !== labelId);
      return;
    }
    this.data.selectedLabelIds = [...this.data.selectedLabelIds, labelId];
  }

  close() {
    this.dialogRef.close();
  }
}
