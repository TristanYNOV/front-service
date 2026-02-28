import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TimebaseService } from './timebase.service';
import { VideoService } from './video.service';

class MockVideoService {
  readonly positionMs = signal(0);
  readonly durationMs = signal(0);
  readonly isPlaying = signal(false);

  play = jasmine.createSpy('play');
  pause = jasmine.createSpy('pause');
  seekMs = jasmine.createSpy('seekMs');
}

describe('TimebaseService', () => {
  let service: TimebaseService;
  let videoService: MockVideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TimebaseService, { provide: VideoService, useClass: MockVideoService }] });
    service = TestBed.inject(TimebaseService);
    videoService = TestBed.inject(VideoService) as unknown as MockVideoService;
  });

  it('delegates to video service when a video is loaded', () => {
    videoService.durationMs.set(12000);

    service.play();
    service.seekTo(1500);
    service.pause();

    expect(service.mode()).toBe('video');
    expect(videoService.play).toHaveBeenCalled();
    expect(videoService.seekMs).toHaveBeenCalledWith(1500);
    expect(videoService.pause).toHaveBeenCalled();
  });

  it('runs chrono mode with play/pause/seek', fakeAsync(() => {
    service.seekTo(500);
    service.play();

    tick(120);
    const afterTick = service.currentTimeMs();
    expect(afterTick).toBeGreaterThan(500);

    service.pause();
    const pausedAt = service.currentTimeMs();
    tick(120);
    expect(Math.round(service.currentTimeMs())).toBe(Math.round(pausedAt));

    service.seekTo(2500);
    expect(Math.round(service.currentTimeMs())).toBe(2500);
  }));
});
