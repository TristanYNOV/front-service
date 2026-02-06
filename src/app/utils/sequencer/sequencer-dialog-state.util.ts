import { Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { startWith } from 'rxjs';
import { SequencerPanelService } from '../../core/service/sequencer-panel.service';
import { HotkeysService } from '../../core/services/hotkeys.service';
import { HotkeyChord } from '../../interfaces/hotkey-chord.interface';

interface SequencerDialogStateOptions {
  form: FormGroup;
  isEdit: boolean;
  panelService: SequencerPanelService;
  selectedChord: Signal<HotkeyChord | null>;
  currentActionId?: string | null;
  hotkeysService: HotkeysService;
}

export const createSequencerDialogState = ({
  form,
  isEdit,
  panelService,
  selectedChord,
  currentActionId,
  hotkeysService,
}: SequencerDialogStateOptions) => {
  const formStatus = toSignal(form.statusChanges.pipe(startWith(form.status)), {
    initialValue: form.status,
  });

  const getHotkeyStatus = (chord: HotkeyChord) => {
    const status = hotkeysService.isHotkeyUsed(chord);
    if (status.usedBy?.kind === 'sequencer' && status.usedBy.actionId === currentActionId) {
      return { ...status, usedBy: undefined };
    }
    return status;
  };

  const canSave = computed(() => {
    if (formStatus() === 'INVALID') {
      return false;
    }
    if (!isEdit) {
      const idValue = form.get('id')?.value ?? '';
      if (!panelService.isIdAvailable(String(idValue))) {
        return false;
      }
    }
    const chord = selectedChord();
    if (!chord) {
      return true;
    }
    const status = getHotkeyStatus(chord);
    return status.isValid && !status.usedBy;
  });

  return { canSave, getHotkeyStatus };
};
