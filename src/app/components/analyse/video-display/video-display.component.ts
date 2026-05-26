import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { VideoService } from '../../../core/services/video.service';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-video-display',
  standalone: true,
  imports: [FormsModule, MatIconModule, TranslocoPipe],
  templateUrl: './video-display.component.html',
  styleUrl: './video-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoDisplayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private readonly maxRateInput = 2;
  private readonly minRateInput = 0.25;
  private readonly stepRate = 0.25;

  protected readonly videoService = inject(VideoService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly transloco = inject(TranslocoService);

  readonly videoName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly hasVideo = computed(() => this.videoName() !== null);

  seekInputMs = 0;
  rateInput = 1;

  private readonly rateSync = effect(() => {
    this.rateInput = this.videoService.playbackRate();
  });

  ngAfterViewInit() {
    if (this.videoElement) {
      this.videoService.attachVideo(this.videoElement.nativeElement);
    }
  }

  ngOnDestroy() {
    this.rateSync.destroy();
    this.videoService.detachVideo();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    const file = input.files[0];
    this.changeVideo(file);
    input.value = '';
  }

  onChangeVideoClick() {
    this.fileInput?.nativeElement.click();
  }


  async onClearVideo() {
    if (!this.hasVideo()) {
      return;
    }

    const confirmed = await this.confirmDialogService.confirm({
      title: this.transloco.translate('video.removeTitle'),
      message: this.transloco.translate('video.removeMessage'),
      confirmLabel: this.transloco.translate('actions.remove'),
      cancelLabel: this.transloco.translate('actions.cancel'),
    });

    if (!confirmed) {
      return;
    }

    this.videoService.clearVideo();
    this.videoName.set(null);
    this.errorMessage.set(null);
    this.seekInputMs = 0;
  }

  onVideoLoaded() {
    this.seekInputMs = 0;
  }

  onVideoError() {
    this.errorMessage.set('video.loadFailed');
  }

  onSeekInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    const nextMs = Number(target.value);
    if (Number.isFinite(nextMs)) {
      this.videoService.seekMs(nextMs);
    }
  }

  upRateChange() {
    const newRateInput = this.rateInput + this.stepRate;
    if(newRateInput > this.maxRateInput ) {
      return;
    } else {
      this.videoService.setRate(newRateInput);
    }
  }

  reduceRateChange() {
    const newRateInput = this.rateInput - this.stepRate;
    if(newRateInput < this.minRateInput ) {
      return;
    } else {
      this.videoService.setRate(newRateInput);
    }
  }

  focusHotkeys() {
    // Legacy no-op to avoid template errors if a click binding still exists.
  }

  formatDuration(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) {
      return '0:00';
    }
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private changeVideo(file: File) {
    if (this.videoService.isPlaying()) {
      this.videoService.pause();
    }
    this.videoService.clearVideo();
    this.videoService.loadVideo(file);
    this.videoName.set(file.name);
    this.errorMessage.set(null);
    this.seekInputMs = 0;
  }

}
