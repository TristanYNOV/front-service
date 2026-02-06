import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HotkeysService } from './hotkeys.service';
import { VideoService } from './video.service';

class MockVideoService {
  readonly playbackRate = signal(1);

  togglePlayPause = jasmine.createSpy('togglePlayPause');
  seekMs = jasmine.createSpy('seekMs');
  stepFrames = jasmine.createSpy('stepFrames');
  setRate = jasmine.createSpy('setRate');

  nowMs() {
    return 2000;
  }
}

const dispatchKeydown = (options: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', options);
  document.dispatchEvent(event);
};

describe('HotkeysService', () => {
  let service: HotkeysService;
  let videoService: MockVideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HotkeysService,
        { provide: VideoService, useClass: MockVideoService },
      ],
    });
    service = TestBed.inject(HotkeysService);
    videoService = TestBed.inject(VideoService) as unknown as MockVideoService;
  });

  afterEach(() => {
    service.disable();
  });

  it('handles reserved hotkeys globally without focus', () => {
    service.initReservedVideoHotkeys();
    service.enable();

    dispatchKeydown({ key: ' ', code: 'Space' });

    expect(videoService.togglePlayPause).toHaveBeenCalled();
  });

  it('ignores hotkeys while typing in inputs or contenteditable', () => {
    service.initReservedVideoHotkeys();
    service.enable();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(videoService.togglePlayPause).not.toHaveBeenCalled();

    input.blur();
    input.remove();

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.appendChild(editable);
    editable.focus();

    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(videoService.togglePlayPause).not.toHaveBeenCalled();

    editable.remove();
  });

  it('refuses reserved hotkeys for sequencer bindings', () => {
    service.initReservedVideoHotkeys();

    const result = service.registerSequencerHotkey(
      { key: ' ', code: 'Space' },
      'sequence:test',
      () => {},
    );

    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.errorCode).toBe('RESERVED_HOTKEY');
      expect(result.usedBy?.kind).toBe('reserved');
    }
  });

  it('refuses already used sequencer hotkeys', () => {
    const first = service.registerSequencerHotkey(
      { key: 'a' },
      'sequence:first',
      () => {},
    );
    const second = service.registerSequencerHotkey(
      { key: 'a' },
      'sequence:second',
      () => {},
    );

    expect(first.ok).toBeTrue();
    expect(second.ok).toBeFalse();
    if (!second.ok) {
      expect(second.errorCode).toBe('ALREADY_USED');
      expect(second.usedBy?.kind).toBe('sequencer');
    }
  });

  it('unassigns sequencer hotkeys and frees them for reuse', () => {
    service.registerSequencerHotkey(
      { key: 'b' },
      'sequence:remove',
      () => {},
    );

    const removed = service.unassignSequencerHotkey({ key: 'b' });
    expect(removed).toBeTrue();

    const reassigned = service.registerSequencerHotkey(
      { key: 'b' },
      'sequence:reuse',
      () => {},
    );
    expect(reassigned.ok).toBeTrue();
  });

  it('supports distinct hotkeys for 2 and Shift+2', () => {
    const first = service.registerSequencerHotkey(
      { key: '2', code: 'Digit2' },
      'sequence:two',
      () => {},
    );
    const second = service.registerSequencerHotkey(
      { key: '2', code: 'Digit2', shiftKey: true },
      'sequence:shift-two',
      () => {},
    );

    expect(first.ok).toBeTrue();
    expect(second.ok).toBeTrue();
  });

  it('stops handling hotkeys after disable', () => {
    service.initReservedVideoHotkeys();
    service.enable();

    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(videoService.togglePlayPause).toHaveBeenCalledTimes(1);

    service.disable();
    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(videoService.togglePlayPause).toHaveBeenCalledTimes(1);
  });
});
