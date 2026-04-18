import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextData } from '../../../interfaces/dataItem.interface';
import { getTextContent, TextBlockContent } from '../data-item-content.registry';

@Component({
  selector: 'app-text-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-block.component.html',
})
export class TextBlockComponent {
  @Input({ required: true }) data!: TextData;

  get content(): TextBlockContent {
    return getTextContent(this.data.id);
  }
}
