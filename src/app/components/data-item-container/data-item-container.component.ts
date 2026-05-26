import { Component, inject, Input } from '@angular/core';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { CommonModule } from '@angular/common';
import { PriceTableComponent } from '../specialized-data/PriceTable/price-table.component';
import { TextBlockComponent } from '../specialized-data/TextBlock/text-block.component';
import { Store } from '@ngrx/store';
import { removeFromDisplay, saveFromDisplay } from '../../store/Data/dataState.actions';
import { MatIconModule } from '@angular/material/icon';
import { DataItemMeta, getDataItemMeta } from '../specialized-data/data-item-content.registry';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-data-item-container',
  standalone: true,
  imports: [CommonModule, PriceTableComponent, TextBlockComponent, MatIconModule, TranslocoPipe],
  templateUrl: './data-item-container.component.html',
})
export class DataItemContainerComponent {
  @Input({ required: true }) item!: AnyDataItems;

  private readonly store = inject(Store);
  private readonly languageService = inject(LanguageService);

  get metadata(): DataItemMeta {
    return getDataItemMeta(this.item, this.languageService.getCurrentLang());
  }

  onDelete(): void {
    this.store.dispatch(removeFromDisplay({ id: this.item.id }));
  }

  onSave(): void {
    this.store.dispatch(saveFromDisplay({ id: this.item.id }));
  }
}
