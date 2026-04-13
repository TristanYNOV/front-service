import { SequencerPanelV1 } from '../../../interfaces/analysis-store';
import { SequencerPanel } from '../../../interfaces/sequencer-panel.interface';
import {
  EventBtn,
  LabelBtn,
  SequencerBtn,
  SequencerStatDefinition,
  SequencerStatEditorTerm,
  SequencerStatExpressionToken,
  StatBtn,
} from '../../../interfaces/sequencer-btn.interface';

const ANALYSIS_STORE_SCHEMA_VERSION = '1.0.0' as const;
const SOURCE_APP = 'front-service';
const SOURCE_APP_VERSION = 'unknown';

export function mapPanelStateToSequencerPanelV1(panel: SequencerPanel): SequencerPanelV1 {
  const nowIso = new Date().toISOString();

  return {
    schemaVersion: ANALYSIS_STORE_SCHEMA_VERSION,
    type: 'sequencer-panel',
    panelName: panel.panelName?.trim() || 'My Panel',
    meta: {
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      exportedAtIso: nowIso,
      sourceUserId: null,
      sourceApp: SOURCE_APP,
      sourceAppVersion: SOURCE_APP_VERSION,
    },
    btnList: panel.btnList.map(btn => ({
      ...mapCommonButtonFields(btn),
      ...(btn.type === 'event'
        ? {
            type: 'event' as const,
            eventProps: {
              eventName: btn.name,
              colorHex: btn.colorHex ?? null,
            },
          }
        : btn.type === 'label'
          ? {
              type: 'label' as const,
              labelProps: {
                label: btn.name,
                colorHex: null,
              },
            }
          : {
              type: 'stat' as const,
              stat: {
                statName: btn.name,
                value: extractStatNumericValue(btn.stat),
                colorHex: btn.colorHex ?? null,
              },
            }),
    })),
  };
}

export function mapSequencerPanelV1ToPanelState(payload: SequencerPanelV1): SequencerPanel {
  return {
    panelName: payload.panelName?.trim() || 'My Panel',
    btnList: payload.btnList.map(btn => {
      if (btn.type === 'event') {
        const eventBtn: EventBtn = {
          type: 'event',
          id: btn.id,
          name: btn.name,
          hotkeyNormalized: btn.hotkeyNormalized,
          deactivateIds: btn.deactivateIds,
          activateIds: btn.activateIds,
          layout: btn.layout,
          colorHex: btn.eventProps.colorHex ?? undefined,
          eventProps: {
            kind: 'limited',
            preMs: 0,
            postMs: 0,
          },
        };

        return eventBtn;
      }

      if (btn.type === 'label') {
        const labelBtn: LabelBtn = {
          type: 'label',
          id: btn.id,
          name: btn.name,
          hotkeyNormalized: btn.hotkeyNormalized,
          deactivateIds: btn.deactivateIds,
          activateIds: btn.activateIds,
          layout: btn.layout,
          labelProps: {
            mode: 'once',
          },
        };

        return labelBtn;
      }

      const statBtn: StatBtn = {
        type: 'stat',
        id: btn.id,
        name: btn.name,
        hotkeyNormalized: btn.hotkeyNormalized,
        deactivateIds: btn.deactivateIds,
        activateIds: btn.activateIds,
        layout: btn.layout,
        colorHex: btn.stat.colorHex ?? undefined,
        stat: createStatFromLegacyValue(btn.stat.value),
      };

      return statBtn;
    }),
  };
}

function mapCommonButtonFields(btn: SequencerBtn) {
  return {
    id: btn.id,
    name: btn.name,
    layout: { ...(btn.layout ?? { x: 16, y: 16, w: 240, h: 120 }), z: btn.layout?.z ?? 1 },
    hotkeyNormalized: btn.hotkeyNormalized ?? null,
    deactivateIds: btn.deactivateIds ?? [],
    activateIds: btn.activateIds ?? [],
  };
}

function extractStatNumericValue(definition: SequencerStatDefinition): number {
  if (definition.mode === 'complex' && definition.expression.kind === 'constant') {
    return definition.expression.value;
  }

  return 0;
}

function createStatFromLegacyValue(value: number): SequencerStatDefinition {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const termId = 'legacy_constant';
  const terms: SequencerStatEditorTerm[] = [
    {
      id: termId,
      displayName: 'Legacy Value',
      kind: 'constant',
      constantValue: normalizedValue,
    },
  ];
  const tokens: SequencerStatExpressionToken[] = [{ kind: 'term', termId }];

  return {
    mode: 'complex',
    expression: {
      kind: 'constant',
      value: normalizedValue,
    },
    editor: {
      terms,
      tokens,
    },
  };
}
