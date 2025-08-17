import { Component } from '@angular/core';
import {CdkDragResizeDirective} from '../../../directives/cdk-drag-resize.directive';

@Component({
  selector: 'app-sequencer-panel',
  standalone: true,
  templateUrl: './sequencer-panel.component.html',
  styleUrl: './sequencer-panel.component.scss',
  imports: [CdkDragResizeDirective],
})
export class SequencerPanelComponent {
  readonly dragPosition = { x: 0, y: 0 };
}
