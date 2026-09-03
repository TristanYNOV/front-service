import { SequencerPanelBtnV1, SequencerPanelLayoutV1, SequencerPanelV1 } from '../../../interfaces/analysis-store';
import { SequencerPanel } from '../../../interfaces/sequencer-panel.interface';
import {
  EventBtn,
  LabelBtn,
  SequencerBtn,
  SequencerStatDefinition,
  SequencerStatEditorTerm,
  SequencerStatExpressionToken,
  SequencerStatNode,
  SequencerStatQuery,
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
	              kind: btn.eventProps.kind,
	              preMs: btn.eventProps.preMs,
	              postMs: btn.eventProps.postMs,
	            },
	          }
	        : btn.type === 'label'
	          ? {
	              type: 'label' as const,
	              labelProps: {
	                label: btn.name,
	                colorHex: btn.colorHex ?? null,
	                mode: btn.labelProps.mode,
	              },
	            }
	          : {
	              type: 'stat' as const,
	              stat: {
	                statName: btn.name,
	                value: extractStatNumericValue(btn.stat),
	                colorHex: btn.colorHex ?? null,
	                definition: cloneStatDefinition(btn.stat),
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
          isAnonymized: !!btn.isAnonymized,
          hotkeyNormalized: btn.hotkeyNormalized,
          deactivateIds: btn.deactivateIds,
          activateIds: btn.activateIds,
	          layout: btn.layout,
	          colorHex: btn.eventProps.colorHex ?? undefined,
	          eventProps: {
	            kind: btn.eventProps.kind ?? 'limited',
	            preMs: btn.eventProps.preMs ?? 0,
	            postMs: btn.eventProps.postMs ?? 0,
	          },
	        };

        return eventBtn;
      }

      if (btn.type === 'label') {
        const labelBtn: LabelBtn = {
          type: 'label',
          id: btn.id,
          name: btn.name,
          isAnonymized: !!btn.isAnonymized,
          hotkeyNormalized: btn.hotkeyNormalized,
	          deactivateIds: btn.deactivateIds,
	          activateIds: btn.activateIds,
	          layout: btn.layout,
	          colorHex: btn.labelProps.colorHex ?? undefined,
	          labelProps: {
	            mode: btn.labelProps.mode ?? 'once',
	          },
	        };

        return labelBtn;
      }

      const statBtn: StatBtn = {
        type: 'stat',
        id: btn.id,
        name: btn.name,
        isAnonymized: !!btn.isAnonymized,
        hotkeyNormalized: btn.hotkeyNormalized,
        deactivateIds: btn.deactivateIds,
	          activateIds: btn.activateIds,
	          layout: btn.layout,
	          colorHex: btn.stat.colorHex ?? undefined,
	          stat: btn.stat.definition ? cloneStatDefinition(btn.stat.definition) : createStatFromLegacyValue(btn.stat.value),
	        };

      return statBtn;
    }),
	  };
	}

export function normalizeSequencerPanelImportPayload(payload: unknown): SequencerPanelV1 | null {
  if (!isRecord(payload) || payload['type'] !== 'sequencer-panel' || !Array.isArray(payload['btnList'])) {
    return null;
  }

  const panelName = typeof payload['panelName'] === 'string' ? payload['panelName'] : 'My Panel';
  const btnList: SequencerPanelBtnV1[] = [];

  for (const item of payload['btnList']) {
    const normalizedBtn = normalizePanelButton(item);
    if (!normalizedBtn) {
      return null;
    }
    btnList.push(normalizedBtn);
  }

  return {
    schemaVersion: '1.0.0',
    type: 'sequencer-panel',
    panelName,
    meta: normalizeMeta(payload['meta']),
    btnList,
  };
}

function mapCommonButtonFields(btn: SequencerBtn) {
  return {
    id: btn.id,
    name: btn.name,
    isAnonymized: !!btn.isAnonymized,
    layout: { ...(btn.layout ?? { x: 16, y: 16, w: 240, h: 120 }), z: btn.layout?.z ?? 1 },
    hotkeyNormalized: btn.hotkeyNormalized ?? null,
    deactivateIds: btn.deactivateIds ?? [],
    activateIds: btn.activateIds ?? [],
  };
}

export function hasAnonymizedButtons(panel: SequencerPanel): boolean {
  return panel.btnList.some(btn => !!btn.isAnonymized);
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

function normalizePanelButton(value: unknown): SequencerPanelBtnV1 | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value['id'];
  const name = value['name'];
  const type = value['type'];
  if (typeof id !== 'string' || typeof name !== 'string') {
    return null;
  }

  const base = {
    id,
    name,
    isAnonymized: readBoolean(value, 'isAnonymized') ?? readBoolean(value, 'anonymized') ?? false,
    layout: normalizeLayoutV1(value['layout']),
    hotkeyNormalized: typeof value['hotkeyNormalized'] === 'string' ? value['hotkeyNormalized'] : null,
    deactivateIds: normalizeStringList(value['deactivateIds']),
    activateIds: normalizeStringList(value['activateIds']),
  };

  if (type === 'event') {
    const eventProps = isRecord(value['eventProps']) ? value['eventProps'] : {};
    const kind = eventProps['kind'] === 'indefinite' ? 'indefinite' : 'limited';
    return {
      ...base,
      type: 'event',
      eventProps: {
        eventName: typeof eventProps['eventName'] === 'string' ? eventProps['eventName'] : name,
        colorHex: readNullableString(eventProps['colorHex']),
        kind,
        preMs: readFiniteNumber(eventProps['preMs']) ?? 0,
        postMs: readFiniteNumber(eventProps['postMs']) ?? 0,
      },
    };
  }

  if (type === 'label') {
    const labelProps = isRecord(value['labelProps']) ? value['labelProps'] : {};
    const mode = labelProps['mode'] === 'indefinite' ? 'indefinite' : 'once';
    return {
      ...base,
      type: 'label',
      labelProps: {
        label: typeof labelProps['label'] === 'string' ? labelProps['label'] : name,
        colorHex: readNullableString(labelProps['colorHex']),
        mode,
      },
    };
  }

  if (type === 'stat') {
    const stat = isRecord(value['stat']) ? value['stat'] : {};
    const definition = isStatDefinitionCandidate(stat['definition'])
      ? stat['definition'] as unknown as SequencerStatDefinition
      : undefined;

    return {
      ...base,
      type: 'stat',
      stat: {
        statName: typeof stat['statName'] === 'string' ? stat['statName'] : name,
        value: readFiniteNumber(stat['value']) ?? 0,
        colorHex: readNullableString(stat['colorHex']),
        definition,
      },
    };
  }

  return null;
}

function normalizeMeta(value: unknown) {
  const meta = isRecord(value) ? value : {};
  const nowIso = new Date().toISOString();
  return {
    createdAtIso: readString(meta, 'createdAtIso') ?? nowIso,
    updatedAtIso: readString(meta, 'updatedAtIso') ?? nowIso,
    exportedAtIso: readString(meta, 'exportedAtIso') ?? nowIso,
    sourceUserId: readNullableString(meta['sourceUserId']),
    sourceApp: readString(meta, 'sourceApp') ?? SOURCE_APP,
    sourceAppVersion: readString(meta, 'sourceAppVersion') ?? SOURCE_APP_VERSION,
  };
}

function normalizeLayoutV1(value: unknown): SequencerPanelLayoutV1 {
  const layout = isRecord(value) ? value : {};
  return {
    x: readFiniteNumber(layout['x']) ?? 16,
    y: readFiniteNumber(layout['y']) ?? 16,
    w: readFiniteNumber(layout['w']) ?? 240,
    h: readFiniteNumber(layout['h']) ?? 120,
    z: readFiniteNumber(layout['z']) ?? 1,
  };
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean))];
}

function readBoolean(source: Record<string, unknown>, key: string): boolean | null {
  const value = source[key];
  return typeof value === 'boolean' ? value : null;
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' ? value : null;
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isStatDefinitionCandidate(value: unknown): value is SequencerStatDefinition {
  if (!isRecord(value)) {
    return false;
  }

  if (value['mode'] === 'simple') {
    return isStatQueryCandidate(value['query']);
  }

  if (value['mode'] === 'complex') {
    return isStatNodeCandidate(value['expression'])
      && (value['editor'] === undefined || isStatEditorCandidate(value['editor']));
  }

  return false;
}

function isStatQueryCandidate(value: unknown): value is SequencerStatQuery {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value['eventIds'])
    && Array.isArray(value['labelIds'])
    && value['metric'] === 'count'
    && value['labelMatch'] === 'all';
}

function isStatNodeCandidate(value: unknown): value is SequencerStatNode {
  if (!isRecord(value)) {
    return false;
  }

  if (value['kind'] === 'constant') {
    return typeof value['value'] === 'number' && Number.isFinite(value['value']);
  }

  if (value['kind'] === 'query') {
    return isStatQueryCandidate(value['query']);
  }

  if (value['kind'] === 'group') {
    return ['+', '-', '*', '/'].includes(String(value['op']))
      && isStatNodeCandidate(value['left'])
      && isStatNodeCandidate(value['right']);
  }

  return false;
}

function isStatEditorCandidate(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value['terms']) || !Array.isArray(value['tokens'])) {
    return false;
  }

  const termsOk = value['terms'].every(term => {
    if (!isRecord(term) || typeof term['id'] !== 'string' || typeof term['displayName'] !== 'string') {
      return false;
    }

    if (term['kind'] === 'query') {
      return isStatQueryCandidate(term['query']);
    }

    return term['kind'] === 'constant' && typeof term['constantValue'] === 'number';
  });

  const tokensOk = value['tokens'].every(token => {
    if (!isRecord(token)) {
      return false;
    }

    return (token['kind'] === 'term' && typeof token['termId'] === 'string')
      || (token['kind'] === 'operator' && ['+', '-', '*', '/'].includes(String(token['op'])))
      || (token['kind'] === 'paren' && (token['value'] === '(' || token['value'] === ')'));
  });

  return termsOk && tokensOk;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneStatDefinition(definition: SequencerStatDefinition): SequencerStatDefinition {
  if (definition.mode === 'simple') {
    return {
      mode: 'simple',
      query: cloneStatQuery(definition.query),
    };
  }

  return {
    mode: 'complex',
    expression: cloneStatNode(definition.expression),
    editor: definition.editor
      ? {
          terms: definition.editor.terms.map(term =>
            term.kind === 'query'
              ? {
                  id: term.id,
                  displayName: term.displayName,
                  kind: 'query',
                  query: term.query
                    ? cloneStatQuery(term.query)
                    : undefined,
                }
              : {
                  id: term.id,
                  displayName: term.displayName,
                  kind: 'constant',
                  constantValue: term.constantValue,
                },
          ),
          tokens: definition.editor.tokens.map(token => ({ ...token })),
        }
      : undefined,
  };
}

function cloneStatNode(node: SequencerStatNode): SequencerStatNode {
  if (node.kind === 'constant') {
    return { kind: 'constant', value: node.value };
  }

  if (node.kind === 'query') {
    return {
      kind: 'query',
      query: cloneStatQuery(node.query),
    };
  }

  return {
    kind: 'group',
    left: cloneStatNode(node.left),
    op: node.op,
    right: cloneStatNode(node.right),
  };
}

function cloneStatQuery(query: SequencerStatQuery): SequencerStatQuery {
  return {
    eventIds: [...query.eventIds],
    labelIds: [...query.labelIds],
    ...(query.labelColorById ? { labelColorById: { ...query.labelColorById } } : {}),
    metric: query.metric,
    labelMatch: query.labelMatch,
  };
}
