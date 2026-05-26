import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-service-unavailable',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './service-unavailable.component.html',
})
export class ServiceUnavailableComponent {}
