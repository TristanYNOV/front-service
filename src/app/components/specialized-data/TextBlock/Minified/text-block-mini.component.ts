import { Component, Input } from '@angular/core';
import { TextData } from '../../../../interfaces/dataItem.interface';
import { getTextContent } from '../../data-item-content.registry';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-text-block-mini',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './text-block-mini.component.html',
})
export class TextBlockMiniComponent {
  @Input({ required: true }) item!: TextData;

  get miniDescriptionKey(): string {
    return getTextContent(this.item.id).miniDescriptionKey ?? '';
  }
}
