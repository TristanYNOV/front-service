import { Component, Input } from '@angular/core';
import { TextData } from '../../../../interfaces/dataItem.interface';
import { getTextContent } from '../../data-item-content.registry';

@Component({
  selector: 'app-text-block-mini',
  standalone: true,
  templateUrl: './text-block-mini.component.html',
})
export class TextBlockMiniComponent {
  @Input({ required: true }) item!: TextData;

  get miniDescription(): string {
    return getTextContent(this.item.id).miniDescription ?? '';
  }
}
