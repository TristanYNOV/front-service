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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoService } from '../../../core/services/video.service';

@Component({
  selector: 'app-video-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-display.component.html',
  styleUrl: './video-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoDisplayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('hotkeysZone') hotkeysZone?: ElementRef<HTMLElement>;

  protected readonly videoService = inject(VideoService);

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

  onVideoLoaded() {
    this.seekInputMs = 0;
  }

  onVideoError() {
    this.errorMessage.set('La vidéo n’a pas pu être chargée.');
  }

  onRateChange() {
    this.videoService.setRate(this.rateInput);
  }

  focusHotkeys() {
    this.hotkeysZone?.nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent) {
    if (this.isFormField(event.target)) {
      return;
    }

    const key = event.key;
    if (key === ' ' || event.code === 'Space') {
      event.preventDefault();
      this.videoService.togglePlayPause();
      return;
    }

    switch (key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.videoService.seekMs(this.videoService.nowMs() - 1000);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.videoService.seekMs(this.videoService.nowMs() + 1000);
        return;
      case ',':
        event.preventDefault();
        this.videoService.stepFrames(-1);
        return;
      case '.':
        event.preventDefault();
        this.videoService.stepFrames(1);
        return;
      case '/':
        event.preventDefault();
        this.videoService.setRate(this.videoService.playbackRate() + 0.25);
        return;
      case '-':
        event.preventDefault();
        this.videoService.setRate(this.videoService.playbackRate() - 0.25);
        return;
      default:
        return;
    }
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

  private isFormField(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tagName = target.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
  }
}
