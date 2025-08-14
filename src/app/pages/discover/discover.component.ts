import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DiscoverCanvasComponent } from '../../components/discover-canvas/discover-canvas.component';
import { selectDisplayedItems } from '../../store/Data/dataState.selectors';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [DiscoverCanvasComponent],
  templateUrl: './discover.component.html',
})
export class DiscoverComponent {
  private store = inject(Store);
  displayedItems = this.store.selectSignal(selectDisplayedItems);
}
