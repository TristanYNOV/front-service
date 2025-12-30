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

  protected readonly videoService = inject(VideoService);
  protected readonly analysisNameService = inject(AnalysisNameService);

  readonly videoName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly hasVideo = computed(() => this.videoName() !== null);
  readonly isEditingTitle = signal(false);
  readonly titleInput = signal(this.analysisNameService.analysisName());

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
}
