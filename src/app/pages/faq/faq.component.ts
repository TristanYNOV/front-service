import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  readonly itemIndexes = [0, 1, 2, 3, 4];
}
