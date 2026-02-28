import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { VideoService } from './video.service';
import { TIMELINE_PLAYHEAD_UPDATE_HZ_MAX } from '../../interfaces/timeline/timeline-defaults.constants';

@Injectable({ providedIn: 'root' })
export class TimebaseService {
  private readonly videoService = inject(VideoService);
  private readonly clockCurrentTimeMs = signal(0);
  private readonly clockPlaying = signal(false);
  private readonly modeSignal = signal<'video' | 'clock'>('clock');
  readonly mode = this.modeSignal.asReadonly();

  readonly currentTimeMs = computed(() =>
    this.modeSignal() === 'video' ? this.videoService.positionMs() : this.clockCurrentTimeMs(),
  );
  readonly isPlaying = computed(() =>
    this.modeSignal() === 'video' ? this.videoService.isPlaying() : this.clockPlaying(),
  );
  readonly durationMs = computed(() =>
    this.modeSignal() === 'video' ? this.videoService.durationMs() || undefined : undefined,
  );

  private intervalId?: number;
  private clockStartEpochMs = 0;
  private clockStartValueMs = 0;

  constructor() {
    effect(() => {
      const hasVideo = this.videoService.durationMs() > 0;
      this.modeSignal.set(hasVideo ? 'video' : 'clock');
      if (hasVideo) {
        this.stopClockTicker();
      }
    });
  }

  play() {
    if (this.modeSignal() === 'video') {
      this.videoService.play();
      return;
    }
    if (this.clockPlaying()) {
      return;
    }
    this.clockPlaying.set(true);
    this.clockStartEpochMs = performance.now();
    this.clockStartValueMs = this.clockCurrentTimeMs();
    this.startClockTicker();
  }

  pause() {
    if (this.modeSignal() === 'video') {
      this.videoService.pause();
      return;
    }
    this.clockPlaying.set(false);
    this.stopClockTicker();
  }

  togglePlayPause() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekTo(ms: number) {
    const clamped = Math.max(0, Math.round(ms));
    if (this.modeSignal() === 'video') {
      this.videoService.seekMs(clamped);
      return;
    }
    this.clockCurrentTimeMs.set(clamped);
    this.clockStartValueMs = clamped;
    this.clockStartEpochMs = performance.now();
  }

  private startClockTicker() {
    this.stopClockTicker();
    const cadenceMs = Math.max(16, Math.round(1000 / TIMELINE_PLAYHEAD_UPDATE_HZ_MAX));
    this.intervalId = window.setInterval(() => {
      if (!this.clockPlaying()) {
        return;
      }
      const delta = performance.now() - this.clockStartEpochMs;
      this.clockCurrentTimeMs.set(this.clockStartValueMs + delta);
    }, cadenceMs);
  }

  private stopClockTicker() {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
