import { Component } from '@angular/core';
import { VideoPlayerComponent } from './video-player.component';
import { SequencerPanelComponent } from './sequencer-panel.component';
import { TimelineComponent } from './timeline.component';

@Component({
  selector: 'app-analyse',
  standalone: true,
  templateUrl: './analyse.component.html',
  imports: [VideoPlayerComponent, SequencerPanelComponent, TimelineComponent],
})
export class AnalyseComponent {}
