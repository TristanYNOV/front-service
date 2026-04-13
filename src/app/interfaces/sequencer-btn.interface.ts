import { SequencerBtnLayout } from './sequencer-btn-layout.interface';

export type SequencerStatOperator = '+' | '-' | '*' | '/';

export interface SequencerStatQuery {
  eventIds: string[];
  labelIds: string[];
  labelColorById?: Record<string, string>;
  metric: 'count';
  labelMatch: 'all';
}

export type SequencerStatNode =
  | { kind: 'constant'; value: number }
  | { kind: 'query'; query: SequencerStatQuery }
  | {
      kind: 'group';
      left: SequencerStatNode;
      op: SequencerStatOperator;
      right: SequencerStatNode;
    };

export interface SequencerStatEditorTerm {
  id: string;
  displayName: string;
  kind: 'query' | 'constant';
  query?: SequencerStatQuery;
  constantValue?: number;
}

export type SequencerStatExpressionToken =
  | { kind: 'term'; termId: string }
  | { kind: 'operator'; op: SequencerStatOperator }
  | { kind: 'paren'; value: '(' | ')' };

export type SequencerStatDefinition =
  | {
      mode: 'simple';
      query: SequencerStatQuery;
    }
  | {
      mode: 'complex';
      expression: SequencerStatNode;
      editor?: {
        terms: SequencerStatEditorTerm[];
        tokens: SequencerStatExpressionToken[];
      };
    };

export type SequencerBtn = EventBtn | LabelBtn | StatBtn;

export interface SequencerBtnBase {
  id: string;
  name: string;
  type: 'event' | 'label' | 'stat';
  isAnonymized?: boolean;
  hotkeyNormalized?: string | null;
  deactivateIds?: string[];
  activateIds?: string[];
  layout?: SequencerBtnLayout;
}

export interface EventBtn extends SequencerBtnBase {
  type: 'event';
  colorHex?: string;
  eventProps: {
    kind: 'limited' | 'indefinite';
    preMs: number;
    postMs: number;
  };
}

export interface LabelBtn extends SequencerBtnBase {
  type: 'label';
  labelProps: {
    mode: 'once' | 'indefinite';
  };
}

export interface StatBtn extends SequencerBtnBase {
  type: 'stat';
  colorHex?: string;
  stat: SequencerStatDefinition;
}
