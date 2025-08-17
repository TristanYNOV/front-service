import { Component } from '@angular/core';
import {VideoPlayerComponent} from '../../components/analyse/video/video-player.component';
import {SequencerPanelComponent} from '../../components/analyse/sequencer/sequencer-panel.component';
import {TimelineComponent} from '../../components/analyse/timeline/timeline.component';

@Component({
  selector: 'app-analyse',
  standalone: true,
  templateUrl: './analyse.component.html',
  imports: [VideoPlayerComponent, SequencerPanelComponent, TimelineComponent],
})
export class AnalyseComponent {}
