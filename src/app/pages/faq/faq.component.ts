import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map, startWith } from 'rxjs/operators';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  private readonly transloco = inject(TranslocoService);

  private readonly faqItemsValue = toSignal(
    this.transloco.langChanges$.pipe(
      startWith(this.transloco.getActiveLang()),
      map(() => this.transloco.translateObject('faq.items') as unknown),
      map(value => Array.isArray(value) ? value as FaqItem[] : []),
    ),
    { initialValue: [] as FaqItem[] },
  );

  readonly faqItems = computed(() => this.faqItemsValue());
}
