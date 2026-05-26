import { Component, Input } from '@angular/core';

import { TextData } from '../../../interfaces/dataItem.interface';
import { getTextContent, TextBlockContent } from '../data-item-content.registry';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-text-block',
  standalone: true,
  imports: [MatIconModule, TranslocoPipe],
  templateUrl: './text-block.component.html',
})
export class TextBlockComponent {
  @Input({ required: true }) data!: TextData;

  get content(): TextBlockContent {
    return getTextContent(this.data.id);
  }
}
