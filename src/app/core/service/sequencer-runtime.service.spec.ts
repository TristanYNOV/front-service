import { TestBed } from '@angular/core/testing';
import { SequencerPanelService } from './sequencer-panel.service';
import { SequencerRuntimeService } from './sequencer-runtime.service';

describe('SequencerRuntimeService', () => {
  let runtime: SequencerRuntimeService;
  let panel: SequencerPanelService;
  let logSpy: jasmine.Spy<(message?: unknown, ...optionalParams: unknown[]) => void>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SequencerPanelService, SequencerRuntimeService],
    });

    panel = TestBed.inject(SequencerPanelService);
    runtime = TestBed.inject(SequencerRuntimeService);
    logSpy = spyOn(console, 'log');
  });

  it('applies trigger own action first, then deactivates and activates links in label/event order', () => {
    panel.addEventBtn({ id: 'evt-main', name: 'main', eventProps: { kind: 'indefinite', preMs: 0, postMs: 0 }, deactivateIds: ['evt-old', 'lbl-old', 'missing'], activateIds: ['evt-next', 'lbl-next', 'evt-once'] });
    panel.addEventBtn({ id: 'evt-old', name: 'oldEvent', eventProps: { kind: 'indefinite', preMs: 0, postMs: 0 } });
    panel.addEventBtn({ id: 'evt-next', name: 'nextEvent', eventProps: { kind: 'indefinite', preMs: 0, postMs: 0 } });
    panel.addEventBtn({ id: 'evt-once', name: 'onceEvent', eventProps: { kind: 'limited', preMs: 0, postMs: 0 } });
    panel.addLabelBtn({ id: 'lbl-old', name: 'oldLabel', labelProps: { mode: 'indefinite' } });
    panel.addLabelBtn({ id: 'lbl-next', name: 'nextLabel', labelProps: { mode: 'indefinite' } });

    runtime.trigger('evt-old', 'click');
    runtime.trigger('lbl-old', 'click');
    logSpy.calls.reset();

    runtime.trigger('evt-main', 'click');

    const messages = logSpy.calls.allArgs().map(args => String(args[0]));
    expect(messages).toEqual([
      '[Sequencer] EVENT INDEFINITE main START',
      '[Sequencer] LABEL INDEFINITE oldLabel ENDED',
      '[Sequencer] EVENT INDEFINITE oldEvent ENDED | Labels=[]',
      '[Sequencer] LABEL INDEFINITE nextLabel START',
      '[Sequencer] EVENT INDEFINITE nextEvent START',
      '[Sequencer] EVENT main TRIGGERED | LabelsActive=[nextLabel]',
    ]);
  });

  it('attaches once labels to active indefinite events and prints them when event ends', () => {
    panel.addEventBtn({ id: 'evt-2a', name: '2a', eventProps: { kind: 'indefinite', preMs: 0, postMs: 0 } });
    panel.addLabelBtn({ id: 'lbl-success', name: 'success', labelProps: { mode: 'once' } });

    runtime.trigger('evt-2a', 'click');
    runtime.trigger('lbl-success', 'click');
    runtime.trigger('evt-2a', 'click');

    const messages = logSpy.calls.allArgs().map(args => String(args[0]));
    expect(messages).toContain('[Sequencer] LABEL ONCE success TRIGGERED | ApplyToEvents=[2a]');
    expect(messages).toContain('[Sequencer] EVENT INDEFINITE 2a ENDED | Labels=[success]');
  });
});
