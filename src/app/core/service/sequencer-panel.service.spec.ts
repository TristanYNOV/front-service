import { TestBed } from '@angular/core/testing';
import { SequencerPanelService } from './sequencer-panel.service';

describe('SequencerPanelService', () => {
  let service: SequencerPanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SequencerPanelService] });
    service = TestBed.inject(SequencerPanelService);
  });

  it('creates a stat button', () => {
    const created = service.addStatBtn({
      id: 'stat-shots',
      name: 'Tirs',
      colorHex: '#000000',
      stat: {
        mode: 'simple',
        query: { eventIds: ['evt_shot'], labelIds: [], metric: 'count', labelMatch: 'all' },
      },
    });

    expect(created?.type).toBe('stat');
    expect(service.getBtnById('stat-shots')?.type).toBe('stat');
  });

  it('serializes and deserializes stat buttons from JSON', () => {
    service.setPanelName('Stats panel');
    service.addStatBtn({
      id: 'stat-rate',
      name: 'Ratio',
      colorHex: '#ffffff',
      stat: {
        mode: 'complex',
        expression: {
          kind: 'group',
          op: '/',
          left: { kind: 'constant', value: 10 },
          right: { kind: 'constant', value: 2 },
        },
      },
    });

    const exported = service.exportAsJson();

    const next = TestBed.inject(SequencerPanelService);
    const imported = next.importFromJson(exported);

    expect(imported).toBeTrue();
    expect(next.panelName()).toBe('Stats panel');
    expect(next.getBtnById('stat-rate')?.type).toBe('stat');
  });

  it('keeps event and label support unchanged', () => {
    service.addEventBtn({
      id: 'evt-1',
      name: 'Event',
      eventProps: { kind: 'limited', preMs: 0, postMs: 0 },
    });
    service.addLabelBtn({
      id: 'lbl-1',
      name: 'Label',
      labelProps: { mode: 'once' },
    });

    const exported = service.exportAsJson();
    const parsed = JSON.parse(exported) as { btnList: { type: string }[] };
    const types = parsed.btnList.map(btn => btn.type);

    expect(types).toContain('event');
    expect(types).toContain('label');
  });

  it('keeps complex editor displayName during json round-trip', () => {
    service.addStatBtn({
      id: 'stat-editor',
      name: 'Editor',
      stat: {
        mode: 'complex',
        expression: { kind: 'constant', value: 1 },
        editor: {
          terms: [
            { id: 'term_1', displayName: 'Possessions', kind: 'query', query: { eventIds: ['evt_pos'], labelIds: [], metric: 'count', labelMatch: 'all' } },
          ],
          tokens: [{ kind: 'term', termId: 'term_1' }],
        },
      },
    });

    const exported = service.exportAsJson();
    const imported = service.importFromJson(exported);

    expect(imported).toBeTrue();
    const btn = service.getBtnById('stat-editor');
    expect(btn?.type).toBe('stat');
    if (btn?.type === 'stat' && btn.stat.mode === 'complex') {
      expect(btn.stat.editor?.terms[0].displayName).toBe('Possessions');
    }
  });
});
