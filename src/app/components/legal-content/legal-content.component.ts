import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-legal-content',
  standalone: true,
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './legal-content.component.html',
})
export class LegalContentComponent {
  @Input() compact = false;

  readonly sections = ['temporary', 'purpose', 'account', 'data', 'deletion'];
}
