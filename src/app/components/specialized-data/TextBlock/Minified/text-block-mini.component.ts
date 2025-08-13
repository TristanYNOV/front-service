import { Component, Input } from '@angular/core';
import {TextBlockData} from '../../../../interfaces/dataItem.interface';

@Component({
  selector: 'app-text-block-mini',
  standalone: true,
  templateUrl: './text-block-mini.component.html',
})
export class TextBlockMiniComponent {
  @Input() item!: TextBlockData;
}
