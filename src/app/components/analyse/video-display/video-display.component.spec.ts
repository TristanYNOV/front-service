import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoDisplayComponent } from './video-display.component';
import { VideoService } from '../../../core/services/video.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

describe('VideoDisplayComponent', () => {
  let fixture: ComponentFixture<VideoDisplayComponent>;
  let component: VideoDisplayComponent;

  const videoServiceMock = {
    playbackRate: signal(1),
    fps: signal<number | null>(null),
    positionMs: signal(0),
    durationMs: signal(0),
    isPlaying: signal(false),
    attachVideo: jasmine.createSpy('attachVideo'),
    detachVideo: jasmine.createSpy('detachVideo'),
    stepFrames: jasmine.createSpy('stepFrames'),
    togglePlayPause: jasmine.createSpy('togglePlayPause'),
    clearVideo: jasmine.createSpy('clearVideo'),
    loadVideo: jasmine.createSpy('loadVideo'),
    pause: jasmine.createSpy('pause'),
    seekMs: jasmine.createSpy('seekMs'),
    setRate: jasmine.createSpy('setRate'),
  };

  const confirmDialogServiceMock = {
    confirm: jasmine.createSpy('confirm').and.resolveTo(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoDisplayComponent],
      providers: [
        { provide: VideoService, useValue: videoServiceMock },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows a central choose video button when no video is loaded', () => {
    const root = fixture.nativeElement as HTMLElement;
    const chooseButtons = Array.from(root.querySelectorAll('button'))
      .filter(button => button.textContent?.includes('Choisir une vidéo'));
    const centralButton = root.querySelector<HTMLButtonElement>('.absolute .btn-primary');

    expect(chooseButtons.length).toBe(2);
    expect(centralButton?.textContent).toContain('Choisir une vidéo');
  });

  it('opens the file picker from the central choose video button', () => {
    spyOn(component, 'onChangeVideoClick');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const centralButton = root.querySelector<HTMLButtonElement>('.absolute .btn-primary');
    centralButton?.click();

    expect(component.onChangeVideoClick).toHaveBeenCalled();
  });
});
