import { Component, Input } from '@angular/core';
import { TextData } from '../../../../interfaces/dataItem.interface';
import { getTextContent } from '../../data-item-content.registry';
import { LanguageService } from '../../../../core/i18n/language.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-text-block-mini',
  standalone: true,
  templateUrl: './text-block-mini.component.html',
})
export class TextBlockMiniComponent {
  @Input({ required: true }) item!: TextData;
  private readonly languageService = inject(LanguageService);

  get miniDescription(): string {
    return getTextContent(this.item.id, this.languageService.getCurrentLang()).miniDescription ?? '';
  }
}
