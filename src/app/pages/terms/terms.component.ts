import { Component } from '@angular/core';
import { LegalContentComponent } from '../../components/legal-content/legal-content.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [LegalContentComponent],
  templateUrl: './terms.component.html',
})
export class TermsComponent {}
