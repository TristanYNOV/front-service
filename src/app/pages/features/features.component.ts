import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslocoPipe } from '@jsverse/transloco';
import { DiscoverCanvasComponent } from '../../components/discover-canvas/discover-canvas.component';
import { selectDisplayedItems } from '../../store/Data/dataState.selectors';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [DiscoverCanvasComponent, TranslocoPipe],
  templateUrl: './features.component.html',
})
export class FeaturesComponent {
  private readonly store = inject(Store);
  readonly displayedItems = this.store.selectSignal(selectDisplayedItems);
}
