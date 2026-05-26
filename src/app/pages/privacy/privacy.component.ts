import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent {
  readonly sections = ['account', 'timelines', 'panels', 'deletion', 'cookies'];
}
