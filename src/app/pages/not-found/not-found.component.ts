import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent {}
