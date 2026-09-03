import { VideoService } from './video.service';

function buildVideoElement(durationSec = 10): HTMLVideoElement {
  const element = document.createElement('video');
  Object.defineProperty(element, 'duration', {
    configurable: true,
    value: durationSec,
  });
  spyOn(element, 'load').and.stub();
  spyOn(element, 'play').and.returnValue(Promise.resolve());
  spyOn(element, 'pause').and.stub();
  spyOn(element, 'removeAttribute').and.callThrough();
  return element;
}

describe('VideoService', () => {
  let service: VideoService;
  let createObjectUrlSpy: jasmine.Spy;
  let revokeObjectUrlSpy: jasmine.Spy;

  beforeEach(() => {
    service = new VideoService();
    createObjectUrlSpy = spyOn(URL, 'createObjectURL').and.returnValue(
      'blob:http://localhost/video-1',
    );
    revokeObjectUrlSpy = spyOn(URL, 'revokeObjectURL').and.stub();
  });

  it('queues a loaded video until an element is attached', () => {
    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });

    service.loadVideo(file);

    expect(createObjectUrlSpy).toHaveBeenCalledWith(file);
    expect(service.positionMs()).toBe(0);
    expect(service.durationMs()).toBe(0);
    expect(service.isPlaying()).toBe(false);

    const element = buildVideoElement();
    service.attachVideo(element);

    expect(element.src).toContain('blob:http://localhost/video-1');
    expect(element.load).toHaveBeenCalled();
    expect(service.durationMs()).toBe(10000);
  });

  it('clamps seek position and playback rate to supported bounds', () => {
    const element = buildVideoElement();
    service.attachVideo(element);

    service.seekMs(15000);
    expect(element.currentTime).toBe(10);
    expect(service.positionMs()).toBe(10000);

    service.seekMs(-100);
    expect(element.currentTime).toBe(0);
    expect(service.positionMs()).toBe(0);

    service.setRate(10);
    expect(service.playbackRate()).toBe(2);
    expect(element.playbackRate).toBe(2);

    service.setRate(0);
    expect(service.playbackRate()).toBe(0.25);
    expect(element.playbackRate).toBe(0.25);
  });

  it('clears the current video and revokes the object URL', () => {
    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
    const element = buildVideoElement();

    service.attachVideo(element);
    service.loadVideo(file);
    service.setRate(1.5);
    service.seekMs(3000);

    service.clearVideo();

    expect(element.pause).toHaveBeenCalled();
    expect(element.removeAttribute).toHaveBeenCalledWith('src');
    expect(element.load).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:http://localhost/video-1');
    expect(service.positionMs()).toBe(0);
    expect(service.durationMs()).toBe(0);
    expect(service.isPlaying()).toBe(false);
    expect(service.playbackRate()).toBe(1);
    expect(service.fps()).toBeNull();
  });
});
