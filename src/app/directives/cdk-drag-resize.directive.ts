import { Directive, inject } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { CdkResizableDirective } from './cdk-resizable.directive';

@Directive({
  selector: '[appCdkDragResize]',
  standalone: true,
  hostDirectives: [
    {
      directive: CdkDrag,
      inputs: ['cdkDragBoundary', 'cdkDragFreeDragPosition'],
      outputs: ['cdkDragEnded'],
    },
    { directive: CdkResizableDirective },
  ],
})
export class CdkDragResizeDirective {
  private readonly drag = inject(CdkDrag);
  private readonly resize = inject(CdkResizableDirective);
  private previouslyDisabled = false;

  constructor() {
    this.resize.cdkResizeStart.subscribe(() => {
      this.previouslyDisabled = this.drag.disabled;
      this.drag.disabled = true;
    });
    this.resize.cdkResizeEnd.subscribe(() => {
      this.drag.disabled = this.previouslyDisabled;
    });
  }
}
