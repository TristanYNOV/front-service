import { Component, Input } from '@angular/core';
import {TextData} from '../../../../interfaces/dataItem.interface';

@Component({
  selector: 'app-text-block-mini',
  standalone: true,
  templateUrl: './text-block-mini.component.html',
})
export class TextBlockMiniComponent {
  @Input() item!: TextData;
}
