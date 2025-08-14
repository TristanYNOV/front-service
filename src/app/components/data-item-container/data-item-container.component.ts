import { Component, Input } from '@angular/core';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { CommonModule } from '@angular/common';
import { PriceTableComponent } from '../specialized-data/PriceTable/price-table.component';
import { TextBlockComponent } from '../specialized-data/TextBlock/text-block.component';
import { Store } from '@ngrx/store';
import { removeFromDisplay, saveFromDisplay } from '../../store/Data/dataState.actions';
import { CdkResizableDirective as CdkResizable } from '../../directives/cdk-resizable.directive';

@Component({
  selector: 'app-data-item-container',
  standalone: true,
  imports: [
    CommonModule,
    PriceTableComponent,
    TextBlockComponent,
    CdkResizable,
  ],
  templateUrl: './data-item-container.component.html',
})
export class DataItemContainerComponent {
  @Input() item!: AnyDataItems;

  constructor(private readonly store: Store) {}

  onDelete() {
    console.log(this.item);
    this.store.dispatch(removeFromDisplay({ id: this.item.id }));
  }

  onSave() {
    console.log(this.item);
    this.store.dispatch(saveFromDisplay({ id: this.item.id }));
  }

  onResizeEnd(rect: DOMRectReadOnly) {
    const { width, height } = rect;
    console.log(`Resized to w: ${width}, h: ${height}`);
    // Dispatch to store or notify parent if persistence is required
  }
}
