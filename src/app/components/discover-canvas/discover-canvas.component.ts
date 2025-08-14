import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { DataItemContainerComponent } from '../data-item-container/data-item-container.component';
import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-discover-canvas',
  standalone: true,
  imports: [CommonModule, DataItemContainerComponent, CdkDrag],
  templateUrl: './discover-canvas.component.html',
})
export class DiscoverCanvasComponent {
  @Input() items: AnyDataItems[] = [];

  positions: Record<string, { x: number; y: number }> = {};

  onDragEnd(item: AnyDataItems, event: CdkDragEnd): void {
    const { x, y } = event.source.getFreeDragPosition();
    this.positions[item.id] = { x, y };
  }
}
