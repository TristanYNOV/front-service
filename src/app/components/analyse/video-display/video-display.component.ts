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
import { VideoService } from '../../../core/services/video.service';
import { AnalysisNameService } from '../../../core/services/analysis-name.service';

@Component({
  selector: 'app-video-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-display.component.html',
  styleUrl: './video-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoDisplayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('hotkeysZone') hotkeysZone?: ElementRef<HTMLElement>;

  protected readonly videoService = inject(VideoService);
  protected readonly analysisNameService = inject(AnalysisNameService);

  readonly videoName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly hasVideo = computed(() => this.videoName() !== null);
  readonly isEditingTitle = signal(false);
  readonly titleInput = signal(this.analysisNameService.analysisName());

  private readonly boundHotkeyHandler = (event: KeyboardEvent) => this.onKeydown(event);
  private hotkeysActive = false;

  private readonly titleSync = effect(() => {
    if (!this.isEditingTitle()) {
      this.titleInput.set(this.analysisNameService.analysisName());
    }
  });

  ngAfterViewInit() {
    if (this.videoElement) {
      this.videoService.attachVideo(this.videoElement.nativeElement);
    }
  }

  ngOnDestroy() {
    this.titleSync.destroy();
    this.videoService.detachVideo();
    this.disableHotkeys();
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
    this.videoService.seekMs(0);
  }

  onVideoError() {
    this.errorMessage.set('La vidéo n’a pas pu être chargée.');
  }

  private changeVideo(file: File) {
    if (this.videoService.isPlaying()) {
      this.videoService.pause();
    }
    this.videoService.clearVideo();
    this.videoService.loadVideo(file);
    this.videoName.set(file.name);
    this.errorMessage.set(null);
  }

  startEditingTitle() {
    this.isEditingTitle.set(true);
    this.titleInput.set(this.analysisNameService.analysisName());
  }

  cancelEditingTitle() {
    this.isEditingTitle.set(false);
    this.titleInput.set(this.analysisNameService.analysisName());
  }

  saveTitle() {
    const nextValue = this.titleInput().trim();
    if (nextValue.length > 0) {
      this.analysisNameService.setAnalysisName(nextValue);
    }
    this.isEditingTitle.set(false);
  }

  onTitleInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }
    this.titleInput.set(input.value);
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
        this.increaseRate();
        return;
      case '-':
        event.preventDefault();
        this.decreaseRate();
        return;
      default:
        return;
    }
  }

  onScrub(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = Number.parseFloat(input.value);
    if (Number.isFinite(value)) {
      this.videoService.seekMs(value);
    }
  }

  increaseRate() {
    this.videoService.setRate(this.videoService.playbackRate() + 0.25);
  }

  decreaseRate() {
    this.videoService.setRate(this.videoService.playbackRate() - 0.25);
  }

  focusHotkeys() {
    this.hotkeysZone?.nativeElement.focus();
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

  private isFormField(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
      return true;
    }
    if (tagName === 'input') {
      const input = target as HTMLInputElement;
      return input.type === 'text' || input.type === 'search' || input.type === 'email' || input.type === 'number';
    }
    return false;
  }

  enableHotkeys() {
    if (this.hotkeysActive) {
      return;
    }
    window.addEventListener('keydown', this.boundHotkeyHandler);
    this.hotkeysActive = true;
  }

  disableHotkeys() {
    if (!this.hotkeysActive) {
      return;
    }
    window.removeEventListener('keydown', this.boundHotkeyHandler);
    this.hotkeysActive = false;
  }
}
