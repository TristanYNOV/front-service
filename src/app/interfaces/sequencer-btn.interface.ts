export type SequencerBtn = EventBtn | LabelBtn;

export interface SequencerBtnBase {
  id: string;
  name: string;
  type: 'event' | 'label';
  hotkeyNormalized?: string | null;
}

export interface EventBtn extends SequencerBtnBase {
  type: 'event';
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
