import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './pricing.component.html',
})
export class PricingComponent {}
