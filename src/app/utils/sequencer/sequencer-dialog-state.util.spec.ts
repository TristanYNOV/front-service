import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HotkeysService } from '../../core/services/hotkeys.service';
import { SequencerPanelService } from '../../core/service/sequencer-panel.service';
import { createSequencerDialogState } from './sequencer-dialog-state.util';

describe('createSequencerDialogState', () => {
  function createState(existingIds: string[] = []) {
    const form = new FormGroup({
      id: new FormControl('', Validators.required),
      name: new FormControl('', Validators.required),
    });
    const panelService = {
      isIdAvailable: (id: string) => {
        const normalized = id.trim().toLowerCase();
        return normalized.length > 0 && !existingIds.some(existing => existing.toLowerCase() === normalized);
      },
    } as SequencerPanelService;
    const hotkeysService = {
      isHotkeyUsed: () => ({ isValid: true }),
    } as unknown as HotkeysService;
    const selectedChord = signal(null);

    const dialogState = TestBed.runInInjectionContext(() =>
      createSequencerDialogState({
        form,
        isEdit: false,
        panelService,
        selectedChord,
        currentActionId: null,
        hotkeysService,
      }),
    );

    return { form, dialogState };
  }

  it('requires both id and label/name before save', () => {
    const { form, dialogState } = createState();

    expect(dialogState.canSave()).toBeFalse();

    form.controls.id.setValue('event-1');
    expect(dialogState.canSave()).toBeFalse();

    form.controls.name.setValue('Goal');
    expect(dialogState.canSave()).toBeTrue();
  });

  it('recomputes id uniqueness after moving through valid and invalid ids', () => {
    const { form, dialogState } = createState(['event-1']);

    form.controls.name.setValue('Goal');
    form.controls.id.setValue('event-1');
    expect(dialogState.canSave()).toBeFalse();

    form.controls.id.setValue('event-2');
    expect(dialogState.canSave()).toBeTrue();

    form.controls.id.setValue('EVENT-1');
    expect(dialogState.canSave()).toBeFalse();
  });

  it('allows duplicate labels when the id is unique', () => {
    const { form, dialogState } = createState(['event-1']);

    form.controls.id.setValue('event-2');
    form.controls.name.setValue('Goal');

    expect(dialogState.canSave()).toBeTrue();
  });
});
