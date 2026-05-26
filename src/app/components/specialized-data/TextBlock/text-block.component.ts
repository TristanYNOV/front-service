import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextData } from '../../../interfaces/dataItem.interface';
import { getTextContent, TextBlockContent } from '../data-item-content.registry';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '../../../core/i18n/language.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-text-block',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './text-block.component.html',
})
export class TextBlockComponent {
  @Input({ required: true }) data!: TextData;
  private readonly languageService = inject(LanguageService);

  get content(): TextBlockContent {
    return getTextContent(this.data.id, this.languageService.getCurrentLang());
  }
}
