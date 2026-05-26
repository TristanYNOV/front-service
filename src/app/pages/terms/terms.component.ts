import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LegalContentComponent } from '../../components/legal-content/legal-content.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [LegalContentComponent, TranslocoPipe],
  templateUrl: './terms.component.html',
})
export class TermsComponent {}
