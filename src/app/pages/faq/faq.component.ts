import { Component } from '@angular/core';
import { FAQ_ITEMS } from '../../core/seo/seo.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  readonly items = FAQ_ITEMS;
}
