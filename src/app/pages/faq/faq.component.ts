import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [AsyncPipe, TranslocoPipe],
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  private readonly transloco = inject(TranslocoService);

  readonly items$ = this.transloco.selectTranslateObject<FaqItem[]>('faq.items');
}
