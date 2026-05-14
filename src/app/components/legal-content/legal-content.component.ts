import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal-content',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './legal-content.component.html',
})
export class LegalContentComponent {
  @Input() compact = false;
}
