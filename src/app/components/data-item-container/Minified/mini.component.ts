import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AnyDataItems } from '../../../interfaces/dataItem.interface';

@Component({
  selector: 'app-mini',
  standalone: true,
  imports: [],
  templateUrl: './mini.component.html',
})
export class MiniComponent {
  @Input({required: true}) item!: AnyDataItems;

  constructor(private readonly store: Store) {}

}
