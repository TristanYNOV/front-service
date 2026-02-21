import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { HotkeysService } from '../../../../../core/services/hotkeys.service';
import { SequencerPanelService } from '../../../../../core/service/sequencer-panel.service';
import { SequencerRuntimeService } from '../../../../../core/service/sequencer-runtime.service';
import { EventBtn } from '../../../../../interfaces/sequencer-btn.interface';
import { HotkeyChord } from '../../../../../interfaces/hotkey-chord.interface';
import { HotkeyPickerComponent } from '../../hotkeyPicker/hotkey-picker.component';
import { parseNormalizedHotkey } from '../../../../../utils/sequencer/sequencer-hotkey-options.util';
import { createSequencerDialogState } from '../../../../../utils/sequencer/sequencer-dialog-state.util';

export interface EventBtnDialogData {
  mode: 'create' | 'edit';
  btn?: EventBtn;
}

@Component({
  selector: 'app-create-event-btn-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    MatIconModule,
    HotkeyPickerComponent,
  ],
  templateUrl: './create-event-btn-dialog.component.html',
  styleUrl: './create-event-btn-dialog.component.scss',
})
export class CreateEventBtnDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateEventBtnDialogComponent>);
  readonly data = inject<EventBtnDialogData>(MAT_DIALOG_DATA);
  private readonly panelService = inject(SequencerPanelService);
  private readonly hotkeysService = inject(HotkeysService);
  private readonly runtimeService = inject(SequencerRuntimeService);

  readonly isEdit = this.data.mode === 'edit';
  readonly currentActionId = this.data.btn?.id ?? null;

  readonly selectedChord = signal<HotkeyChord | null>(parseNormalizedHotkey(this.data.btn?.hotkeyNormalized));
  readonly hotkeyError = signal<string | null>(null);
  readonly deactivateIds = signal<string[]>([...(this.data.btn?.deactivateIds ?? [])]);
  readonly activateIds = signal<string[]>([...(this.data.btn?.activateIds ?? [])]);
  readonly selectedDeactivateId = signal<string | null>(null);
  readonly selectedActivateId = signal<string | null>(null);

  readonly availableBtnIds = computed(() => {
    const currentId = this.currentActionId;
    return this.panelService
      .getAllBtnIds()
      .filter(id => !currentId || id !== currentId);
  });

  readonly form = new FormGroup({
    id: new FormControl(
      { value: this.data.btn?.id ?? '', disabled: this.isEdit },
      [Validators.required],
    ),
    name: new FormControl(this.data.btn?.name ?? '', [Validators.required]),
    kind: new FormControl<'limited' | 'indefinite'>(this.data.btn?.eventProps.kind ?? 'limited', {
      nonNullable: true,
    }),
    preSec: new FormControl<number>(this.data.btn ? this.data.btn.eventProps.preMs / 1000 : 0, {
      nonNullable: true,
    }),
    postSec: new FormControl<number>(this.data.btn ? this.data.btn.eventProps.postMs / 1000 : 0, {
      nonNullable: true,
    }),
  });

  private readonly dialogState = createSequencerDialogState({
    form: this.form,
    isEdit: this.isEdit,
    panelService: this.panelService,
    selectedChord: this.selectedChord,
    currentActionId: this.currentActionId,
    hotkeysService: this.hotkeysService,
  });

  readonly canSave = this.dialogState.canSave;

  onChordChange(chord: HotkeyChord | null) {
    this.selectedChord.set(chord);
    this.hotkeyError.set(null);
  }

  addDeactivateLink() {
    const id = this.selectedDeactivateId();
    if (!id || this.deactivateIds().includes(id)) {
      return;
    }
    this.deactivateIds.set([...this.deactivateIds(), id]);
    this.selectedDeactivateId.set(null);
  }

  removeDeactivateLink(id: string) {
    this.deactivateIds.set(this.deactivateIds().filter(item => item !== id));
  }

  addActivateLink() {
    const id = this.selectedActivateId();
    if (!id || this.activateIds().includes(id)) {
      return;
    }
    this.activateIds.set([...this.activateIds(), id]);
    this.selectedActivateId.set(null);
  }

  removeActivateLink(id: string) {
    this.activateIds.set(this.activateIds().filter(item => item !== id));
  }

  getBtnName(id: string) {
    return this.panelService.getBtnById(id)?.name;
  }

  save() {
    if (!this.canSave()) {
      if (!this.isEdit && !this.panelService.isIdAvailable(this.form.controls.id.value ?? '')) {
        this.hotkeyError.set('ID déjà utilisé.');
      }
      return;
    }

    const id = (this.form.controls.id.value ?? '').trim();
    const name = (this.form.controls.name.value ?? '').trim();
    const kind = this.form.controls.kind.value ?? 'limited';
    const preMs = Math.max(0, Math.round((this.form.controls.preSec.value ?? 0) * 1000));
    const postMs = Math.max(0, Math.round((this.form.controls.postSec.value ?? 0) * 1000));

    const chord = this.selectedChord();
    let hotkeyNormalized: string | null = null;

    if (chord) {
      const result = this.hotkeysService.registerSequencerHotkey(
        chord,
        id,
        () => this.runtimeService.trigger(id, 'hotkey'),
        { label: name },
      );
      if (!result.ok) {
        this.hotkeyError.set('Hotkey invalide ou déjà utilisée.');
        return;
      }
      hotkeyNormalized = result.normalized;
    } else {
      this.hotkeysService.unassignSequencerHotkeyByAction(id);
    }

    const deactivateIds = [...this.deactivateIds()];
    const activateIds = [...this.activateIds()];

    if (this.isEdit) {
      this.panelService.updateBtn(id, {
        name,
        hotkeyNormalized,
        deactivateIds,
        activateIds,
        eventProps: { kind, preMs, postMs },
      });
    } else {
      const created = this.panelService.addEventBtn({
        id,
        name,
        hotkeyNormalized,
        deactivateIds,
        activateIds,
        eventProps: { kind, preMs, postMs },
      });
      if (!created) {
        if (hotkeyNormalized) {
          this.hotkeysService.unassignSequencerHotkeyByAction(id);
        }
        this.hotkeyError.set('ID déjà utilisé.');
        return;
      }
    }

    this.dialogRef.close(true);
  }

  close() {
    this.dialogRef.close(false);
  }
}
