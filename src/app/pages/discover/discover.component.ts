import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DataItemContainerComponent } from '../../components/data-item-container/data-item-container.component';
import {selectDisplayedItems} from '../../store/Data/dataState.selectors';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [DataItemContainerComponent],
  templateUrl: './discover.component.html',
})
export class DiscoverComponent {
  private store = inject(Store);
  displayedItems = this.store.selectSignal(selectDisplayedItems);
}
