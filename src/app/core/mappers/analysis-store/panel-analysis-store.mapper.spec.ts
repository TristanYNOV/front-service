import {
  mapPanelStateToSequencerPanelV1,
  mapSequencerPanelV1ToPanelState,
} from './panel-analysis-store.mapper';
import { SequencerPanel } from '../../../interfaces/sequencer-panel.interface';

describe('panel-analysis-store.mapper', () => {
  it('preserves sequencer event, label, links, layout, hotkey and stat properties across v1 mapping', () => {
    const panel: SequencerPanel = {
      panelName: 'Full fidelity panel',
      btnList: [
        {
          type: 'event',
          id: 'evt-limited',
          name: 'Limited event',
          colorHex: '#123456',
          isAnonymized: true,
          hotkeyNormalized: 'A',
          deactivateIds: ['lbl-indefinite'],
          activateIds: ['evt-indefinite'],
          layout: { x: 11, y: 22, w: 180, h: 90, z: 3 },
          eventProps: { kind: 'limited', preMs: 1500, postMs: 2500 },
        },
        {
          type: 'event',
          id: 'evt-indefinite',
          name: 'Indefinite event',
          colorHex: '#223344',
          isAnonymized: false,
          hotkeyNormalized: null,
          deactivateIds: [],
          activateIds: [],
          layout: { x: 31, y: 42, w: 181, h: 91, z: 4 },
          eventProps: { kind: 'indefinite', preMs: 0, postMs: 0 },
        },
        {
          type: 'label',
          id: 'lbl-indefinite',
          name: 'Indefinite label',
          colorHex: '#654321',
          isAnonymized: false,
          hotkeyNormalized: 'Shift+D',
          deactivateIds: ['evt-limited'],
          activateIds: ['evt-indefinite'],
          layout: { x: 51, y: 62, w: 182, h: 92, z: 5 },
          labelProps: { mode: 'indefinite' },
        },
        {
          type: 'stat',
          id: 'stat-ratio',
          name: 'Ratio',
          colorHex: '#abcdef',
          isAnonymized: false,
          hotkeyNormalized: null,
          deactivateIds: [],
          activateIds: [],
          layout: { x: 71, y: 82, w: 183, h: 93, z: 6 },
          stat: {
            mode: 'complex',
            expression: {
              kind: 'group',
              op: '/',
              left: {
                kind: 'query',
                query: { eventIds: ['evt-limited'], labelIds: ['lbl-indefinite'], metric: 'count', labelMatch: 'all' },
              },
              right: { kind: 'constant', value: 2 },
            },
            editor: {
              terms: [
                {
                  id: 'term_scored',
                  displayName: 'Scored',
                  kind: 'query',
                  query: {
                    eventIds: ['evt-limited'],
                    labelIds: ['lbl-indefinite'],
                    labelColorById: { 'lbl-indefinite': '#654321' },
                    metric: 'count',
                    labelMatch: 'all',
                  },
                },
                { id: 'term_two', displayName: 'Two', kind: 'constant', constantValue: 2 },
              ],
              tokens: [
                { kind: 'term', termId: 'term_scored' },
                { kind: 'operator', op: '/' },
                { kind: 'term', termId: 'term_two' },
              ],
            },
          },
        },
      ],
    };

    const payload = mapPanelStateToSequencerPanelV1(panel);
    const restored = mapSequencerPanelV1ToPanelState(payload);

    expect(payload.btnList[0].type).toBe('event');
    if (payload.btnList[0].type === 'event') {
      expect(payload.btnList[0].eventProps.kind).toBe('limited');
      expect(payload.btnList[0].eventProps.preMs).toBe(1500);
      expect(payload.btnList[0].eventProps.postMs).toBe(2500);
    }

    expect(payload.btnList[2].type).toBe('label');
    if (payload.btnList[2].type === 'label') {
      expect(payload.btnList[2].labelProps.mode).toBe('indefinite');
      expect(payload.btnList[2].labelProps.colorHex).toBe('#654321');
    }

    expect(restored).toEqual(panel);
  });

  it('keeps legacy analysis-store panel payloads importable with safe defaults', () => {
    const restored = mapSequencerPanelV1ToPanelState({
      schemaVersion: '1.0.0',
      type: 'sequencer-panel',
      panelName: 'Legacy panel',
      meta: {
        createdAtIso: '2026-08-29T00:00:00.000Z',
        updatedAtIso: '2026-08-29T00:00:00.000Z',
        exportedAtIso: '2026-08-29T00:00:00.000Z',
        sourceUserId: null,
        sourceApp: 'analysis-store-service',
        sourceAppVersion: '1.0.0',
      },
      btnList: [
        {
          type: 'event',
          id: 'evt-old',
          name: 'Old event',
          layout: { x: 0, y: 0, w: 160, h: 80, z: 1 },
          hotkeyNormalized: null,
          deactivateIds: [],
          activateIds: [],
          eventProps: { eventName: 'Old event', colorHex: '#111111' },
        },
        {
          type: 'label',
          id: 'lbl-old',
          name: 'Old label',
          layout: { x: 0, y: 90, w: 160, h: 80, z: 2 },
          hotkeyNormalized: null,
          deactivateIds: [],
          activateIds: [],
          labelProps: { label: 'Old label', colorHex: '#222222' },
        },
        {
          type: 'stat',
          id: 'stat-old',
          name: 'Old stat',
          layout: { x: 0, y: 180, w: 160, h: 80, z: 3 },
          hotkeyNormalized: null,
          deactivateIds: [],
          activateIds: [],
          stat: { statName: 'Old stat', value: 7, colorHex: '#333333' },
        },
      ],
    });

    expect(restored.btnList[0].type).toBe('event');
    if (restored.btnList[0].type === 'event') {
      expect(restored.btnList[0].eventProps).toEqual({ kind: 'limited', preMs: 0, postMs: 0 });
    }

    expect(restored.btnList[1].type).toBe('label');
    if (restored.btnList[1].type === 'label') {
      expect(restored.btnList[1].labelProps.mode).toBe('once');
      expect(restored.btnList[1].colorHex).toBe('#222222');
    }

    expect(restored.btnList[2].type).toBe('stat');
    if (restored.btnList[2].type === 'stat' && restored.btnList[2].stat.mode === 'complex') {
      expect(restored.btnList[2].stat.expression).toEqual({ kind: 'constant', value: 7 });
    }
  });
});
