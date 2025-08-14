import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { DataItemContainerComponent } from '../data-item-container/data-item-container.component';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { CdkDragResizeDirective } from '../../directives/cdk-drag-resize.directive';

@Component({
  selector: 'app-discover-canvas',
  standalone: true,
  imports: [CommonModule, DataItemContainerComponent, CdkDragResizeDirective],
  templateUrl: './discover-canvas.component.html',
  host: { class: 'block h-full' },
})
export class DiscoverCanvasComponent implements OnChanges {
  @Input() items: AnyDataItems[] = [];

  positions: Record<string, { x: number; y: number }> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.items.forEach((item, index) => {
        if (!this.positions[item.id]) {
          this.positions[item.id] = { x: 0, y: index * 120 };
        }
      });
    }
  }
  onDragEnd(item: AnyDataItems, event: CdkDragEnd): void {
    const { x, y } = event.source.getFreeDragPosition();
    this.positions[item.id] = { x, y };
  }
}
