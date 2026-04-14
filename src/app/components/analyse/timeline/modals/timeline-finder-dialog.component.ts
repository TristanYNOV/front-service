import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TimelineResourceResponse } from '../../../../interfaces/analysis-store';

export interface TimelineFinderDialogData {
  timelines: TimelineResourceResponse[];
}

@Component({
  selector: 'app-timeline-finder-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './timeline-finder-dialog.component.html',
})
export class TimelineFinderDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TimelineFinderDialogComponent, TimelineResourceResponse | null>);
  readonly data = inject<TimelineFinderDialogData>(MAT_DIALOG_DATA);
  readonly searchTerm = signal('');
  readonly displayedColumns = ['title', 'updatedAt', 'action'];

  readonly filteredTimelines = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    return this.data.timelines
      .filter(resource => !search || resource.title.toLowerCase().includes(search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  select(resource: TimelineResourceResponse) {
    this.dialogRef.close(resource);
  }

  close() {
    this.dialogRef.close(null);
  }
}
