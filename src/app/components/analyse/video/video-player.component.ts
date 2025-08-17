import { Component } from '@angular/core';
import {CdkDragResizeDirective} from '../../../directives/cdk-drag-resize.directive';

@Component({
  selector: 'app-video-player',
  standalone: true,
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
  imports: [CdkDragResizeDirective],
})
export class VideoPlayerComponent {
  readonly dragPosition = { x: 0, y: 0 };
}
