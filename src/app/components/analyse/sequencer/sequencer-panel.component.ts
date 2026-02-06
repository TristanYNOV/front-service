import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HotkeysService, HotkeyChord, RegisterHotkeyResult, SequencerHotkeyEntry } from '../../../core/services/hotkeys.service';
import { SequencerService } from '../../../core/services/sequencer.service';

interface SequencerActionConfig {
  id: string;
  label: string;
  defaultChord: HotkeyChord;
}

@Component({
  selector: 'app-sequencer-panel',
  standalone: true,
  templateUrl: './sequencer-panel.component.html',
  styleUrl: './sequencer-panel.component.scss',
})
export class SequencerPanelComponent implements OnInit {
  private readonly hotkeysService = inject(HotkeysService);
  private readonly sequencerService = inject(SequencerService);

  private readonly actions: SequencerActionConfig[] = [
    {
      id: 'sequence:add-clip',
      label: 'Ajouter un clip',
      defaultChord: { key: '1', code: 'Digit1' },
    },
    {
      id: 'sequence:split-clip',
      label: 'Scinder le clip',
      defaultChord: { key: '2', code: 'Digit2', shiftKey: true },
    },
  ];

  readonly lastRegisterResult = signal<RegisterHotkeyResult | null>(null);
  readonly hotkeys = signal<SequencerHotkeyEntry[]>([]);
  readonly actionsWithHotkeys = computed(() => {
    const hotkeys = this.hotkeys();
    return this.actions.map(action => ({
      ...action,
      assigned: hotkeys.find(entry => entry.actionId === action.id),
    }));
  });

  ngOnInit() {
    this.refreshHotkeys();
  }

  assignDefaultHotkey(actionId: string) {
    const action = this.actions.find(item => item.id === actionId);
    if (!action) {
      return;
    }
    const result = this.hotkeysService.registerSequencerHotkey(
      action.defaultChord,
      action.id,
      () => this.dispatchSequencerAction(action.id),
      { label: action.label },
    );
    this.lastRegisterResult.set(result);
    if (result.ok) {
      this.refreshHotkeys();
    }
  }

  unassignHotkey(actionId: string) {
    const removed = this.hotkeysService.unassignSequencerHotkeyByAction(actionId);
    if (removed) {
      this.lastRegisterResult.set(null);
      this.refreshHotkeys();
    }
  }

  clearAll() {
    this.hotkeysService.clearSequencerHotkeys();
    this.lastRegisterResult.set(null);
    this.refreshHotkeys();
  }

  private refreshHotkeys() {
    this.hotkeys.set(this.hotkeysService.getSequencerHotkeys());
  }

  private dispatchSequencerAction(actionId: string) {
    switch (actionId) {
      case 'sequence:add-clip':
        this.sequencerService.addClip();
        return;
      case 'sequence:split-clip':
        this.sequencerService.splitClip();
        return;
      default:
        return;
    }
  }
}
