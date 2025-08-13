import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataItemBase } from '../../../interfaces/dataItem.interface';

@Component({
  selector: 'app-text-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-block.component.html',
})
export class TextBlockComponent {
  @Input() data!: DataItemBase;
}

