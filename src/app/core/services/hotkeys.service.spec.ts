import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HotkeysService } from './hotkeys.service';
import { VideoService } from './video.service';
import { TimebaseService } from './timebase.service';

class MockVideoService {
  readonly playbackRate = signal(1);

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
  let timebaseService: { playPause: jasmine.Spy };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HotkeysService,
        { provide: VideoService, useClass: MockVideoService },
        { provide: TimebaseService, useValue: { playPause: jasmine.createSpy('playPause') } },
      ],
    });
    service = TestBed.inject(HotkeysService);
    timebaseService = TestBed.inject(TimebaseService) as unknown as { playPause: jasmine.Spy };
  });

  afterEach(() => {
    service.disable();
  });

  it('handles reserved hotkeys globally without focus', () => {
    service.initReservedVideoHotkeys();
    service.enable();

    dispatchKeydown({ key: ' ', code: 'Space' });

    expect(timebaseService.playPause).toHaveBeenCalled();
  });

  it('ignores hotkeys while typing in inputs or contenteditable', () => {
    service.initReservedVideoHotkeys();
    service.enable();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(timebaseService.playPause).not.toHaveBeenCalled();

    input.blur();
    input.remove();

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.appendChild(editable);
    editable.focus();

    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(timebaseService.playPause).not.toHaveBeenCalled();

    editable.remove();
  });

  it('refuses reserved hotkeys for sequencer bindings', () => {
    service.initReservedVideoHotkeys();

    const result = service.registerSequencerHotkey(
      { key: ' ', code: 'Space' },
      'sequence:test',
      jasmine.createSpy('handler'),
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
      jasmine.createSpy('handler'),
    );
    const second = service.registerSequencerHotkey(
      { key: 'a' },
      'sequence:second',
      jasmine.createSpy('handler'),
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
      jasmine.createSpy('handler'),
    );

    const removed = service.unassignSequencerHotkey({ key: 'b' });
    expect(removed).toBeTrue();

    const reassigned = service.registerSequencerHotkey(
      { key: 'b' },
      'sequence:reuse',
      jasmine.createSpy('handler'),
    );
    expect(reassigned.ok).toBeTrue();
  });

  it('supports distinct hotkeys for 2 and Shift+2', () => {
    const first = service.registerSequencerHotkey(
      { key: '2', code: 'Digit2' },
      'sequence:two',
      jasmine.createSpy('handler'),
    );
    const second = service.registerSequencerHotkey(
      { key: '2', code: 'Digit2', shiftKey: true },
      'sequence:shift-two',
      jasmine.createSpy('handler'),
    );

    expect(first.ok).toBeTrue();
    expect(second.ok).toBeTrue();
  });

  it('normalizes letter hotkeys from event.key to uppercase', () => {
    const first = service.registerSequencerHotkey(
      { key: 'a' },
      'sequence:letter-a',
      jasmine.createSpy('handler'),
    );
    const second = service.registerSequencerHotkey(
      { key: 'A', shiftKey: true },
      'sequence:letter-shift-a',
      jasmine.createSpy('handler'),
    );

    expect(first.ok).toBeTrue();
    expect(second.ok).toBeTrue();
    expect(service.isHotkeyUsed({ key: 'a' }).normalized).toBe('A');
    expect(service.isHotkeyUsed({ key: 'A', shiftKey: true }).normalized).toBe('Shift+A');
  });

  it('accepts picker letter chords using KeyX code and matches keyboard keydown', () => {
    const handler = jasmine.createSpy('handler');
    const result = service.registerSequencerHotkey(
      { key: 'Z', code: 'KeyZ' },
      'sequence:keyz',
      handler,
    );

    expect(result.ok).toBeTrue();
    expect(service.isHotkeyUsed({ key: 'z', code: 'KeyZ' }).normalized).toBe('Z');

    service.enable();
    dispatchKeydown({ key: 'z', code: 'KeyZ' });
    expect(handler).toHaveBeenCalled();
  });

  it('stops handling hotkeys after disable', () => {
    service.initReservedVideoHotkeys();
    service.enable();

    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(timebaseService.playPause).toHaveBeenCalledTimes(1);

    service.disable();
    dispatchKeydown({ key: ' ', code: 'Space' });
    expect(timebaseService.playPause).toHaveBeenCalledTimes(1);
  });
});
