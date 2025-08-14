import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { DataItemContainerComponent } from '../data-item-container/data-item-container.component';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-discover-canvas',
  standalone: true,
  imports: [CommonModule, DataItemContainerComponent, CdkDrag],
  templateUrl: './discover-canvas.component.html',
  host: { class: 'block h-full' },
})
export class DiscoverCanvasComponent implements OnChanges {
  @Input() items: AnyDataItems[] = [];

  positions: Record<string, { x: number; y: number }> = {};
  dragDisabled: Record<string, boolean> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.items.forEach((item, index) => {
        if (!this.positions[item.id]) {
          this.positions[item.id] = { x: 0, y: index * 120 };
        }
        if (this.dragDisabled[item.id] === undefined) {
          this.dragDisabled[item.id] = false;
        }
      });
    }
  }

  onResizeStart(item: AnyDataItems): void {
    this.dragDisabled[item.id] = true;
  }

  onResizeEnd(item: AnyDataItems): void {
    this.dragDisabled[item.id] = false;
  }

  onDragEnd(item: AnyDataItems, event: CdkDragEnd): void {
    const { x, y } = event.source.getFreeDragPosition();
    this.positions[item.id] = { x, y };
  }
}
