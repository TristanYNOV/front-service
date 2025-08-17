import { Component } from '@angular/core';
import { CdkDragResizeDirective } from '../../directives/cdk-drag-resize.directive';

@Component({
  selector: 'app-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  imports: [CdkDragResizeDirective],
})
export class TimelineComponent {
  readonly dragPosition = { x: 0, y: 0 };
}
