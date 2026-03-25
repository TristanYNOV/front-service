import { SequencerBtnLayout } from './sequencer-btn-layout.interface';

export type SequencerStatOperator = '+' | '-' | '*' | '/';

export interface SequencerStatQuery {
  eventIds: string[];
  labelIds: string[];
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

export type SequencerStatDefinition =
  | {
      mode: 'simple';
      query: SequencerStatQuery;
    }
  | {
      mode: 'complex';
      expression: SequencerStatNode;
    };

export type SequencerBtn = EventBtn | LabelBtn | StatBtn;

export interface SequencerBtnBase {
  id: string;
  name: string;
  type: 'event' | 'label' | 'stat';
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
