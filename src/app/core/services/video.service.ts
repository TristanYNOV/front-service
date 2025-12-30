import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private videoElement?: HTMLVideoElement;
  private videoUrl?: string;
  private pendingUrl?: string;
  private frameCallbackId?: number;
  private usesVideoFrameCallback = false;
  private lastFrameTimeSec?: number;

  readonly positionMs = signal(0);
  readonly durationMs = signal(0);
  readonly isPlaying = signal(false);
  readonly playbackRate = signal(1);
  readonly fps = signal<number | null>(null);

  attachVideo(element: HTMLVideoElement) {
    this.detachVideo();
    this.videoElement = element;
    this.usesVideoFrameCallback = typeof element.requestVideoFrameCallback === 'function';

    element.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    element.addEventListener('timeupdate', this.handleTimeUpdate);
    element.addEventListener('play', this.handlePlay);
    element.addEventListener('pause', this.handlePause);
    element.addEventListener('ratechange', this.handleRateChange);
    element.addEventListener('ended', this.handleEnded);

    if (this.pendingUrl) {
      element.src = this.pendingUrl;
      this.pendingUrl = undefined;
      element.load();
    }

    this.handleLoadedMetadata();
    this.handleRateChange();
  }

  detachVideo() {
    const element = this.videoElement;
    if (!element) {
      return;
    }

    element.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    element.removeEventListener('timeupdate', this.handleTimeUpdate);
    element.removeEventListener('play', this.handlePlay);
    element.removeEventListener('pause', this.handlePause);
    element.removeEventListener('ratechange', this.handleRateChange);
    element.removeEventListener('ended', this.handleEnded);

    this.cancelFrameCallback();
    this.videoElement = undefined;
    this.lastFrameTimeSec = undefined;
    this.usesVideoFrameCallback = false;
  }

  loadVideo(file: File) {
    const url = URL.createObjectURL(file);
    this.revokeVideoUrl();
    this.videoUrl = url;
    this.fps.set(null);
    this.positionMs.set(0);
    this.durationMs.set(0);
    this.isPlaying.set(false);
    this.applySource(url);
  }

  clearVideo() {
    const element = this.videoElement;
    if (element) {
      element.pause();
      element.removeAttribute('src');
      element.load();
    }
    this.revokeVideoUrl();
    this.fps.set(null);
    this.positionMs.set(0);
    this.durationMs.set(0);
    this.isPlaying.set(false);
    this.playbackRate.set(1);
    this.lastFrameTimeSec = undefined;
  }

  play() {
    void this.videoElement?.play();
  }

  pause() {
    this.videoElement?.pause();
  }

  togglePlayPause() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekMs(ms: number) {
    const element = this.videoElement;
    if (!element) {
      return;
    }
    const duration = this.durationMs();
    const clamped = Math.max(0, Math.min(ms, duration || ms));
    element.currentTime = clamped / 1000;
    this.positionMs.set(clamped);
  }

  setRate(rate: number) {
    const clamped = Math.min(2, Math.max(0.25, rate));
    this.playbackRate.set(clamped);
    if (this.videoElement) {
      this.videoElement.playbackRate = clamped;
    }
  }

  stepFrames(delta: number) {
    const fps = this.fps();
    const stepMs = fps ? 1000 / fps : 1000 / 30;
    this.seekMs(this.positionMs() + delta * stepMs);
  }

  nowMs() {
    return (this.videoElement?.currentTime ?? 0) * 1000;
  }

  private applySource(url: string) {
    if (this.videoElement) {
      this.videoElement.src = url;
      this.videoElement.load();
    } else {
      this.pendingUrl = url;
    }
  }

  private handleLoadedMetadata = () => {
    const element = this.videoElement;
    if (!element) {
      return;
    }
    const durationMs = Number.isFinite(element.duration) ? element.duration * 1000 : 0;
    this.durationMs.set(durationMs);
    this.positionMs.set(element.currentTime * 1000);
  };

  private handleTimeUpdate = () => {
    if (this.usesVideoFrameCallback) {
      return;
    }
    const element = this.videoElement;
    if (!element) {
      return;
    }
    this.positionMs.set(element.currentTime * 1000);
  };

  private handlePlay = () => {
    this.isPlaying.set(true);
    this.startFrameCallback();
  };

  private handlePause = () => {
    this.isPlaying.set(false);
  };

  private handleEnded = () => {
    this.isPlaying.set(false);
  };

  private handleRateChange = () => {
    const element = this.videoElement;
    if (!element) {
      return;
    }
    this.playbackRate.set(element.playbackRate);
  };

  private startFrameCallback() {
    const element = this.videoElement;
    if (!element || !this.usesVideoFrameCallback) {
      return;
    }
    if (this.frameCallbackId !== undefined) {
      return;
    }
    const callback = (_now: number, metadata: VideoFrameCallbackMetadata) => {
      this.positionMs.set(metadata.mediaTime * 1000);
      if (this.lastFrameTimeSec !== undefined) {
        const delta = metadata.mediaTime - this.lastFrameTimeSec;
        if (delta > 0) {
          const estimate = 1 / delta;
          if (Number.isFinite(estimate)) {
            this.fps.set(Math.round(estimate * 100) / 100);
          }
        }
      }
      this.lastFrameTimeSec = metadata.mediaTime;
      this.frameCallbackId = element.requestVideoFrameCallback(callback);
    };
    this.frameCallbackId = element.requestVideoFrameCallback(callback);
  }

  private cancelFrameCallback() {
    const element = this.videoElement;
    if (!element) {
      return;
    }
    if (this.frameCallbackId !== undefined && 'cancelVideoFrameCallback' in element) {
      element.cancelVideoFrameCallback(this.frameCallbackId);
    }
    this.frameCallbackId = undefined;
  }

  private revokeVideoUrl() {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
      this.videoUrl = undefined;
    }
  }
}
