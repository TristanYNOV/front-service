import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { HotkeysService } from '../../../core/services/hotkeys.service';
import { SequencerPanelService } from '../../../core/service/sequencer-panel.service';
import { SequencerRuntimeService } from '../../../core/service/sequencer-runtime.service';
import { LabelBtn } from '../../../interfaces/sequencer-btn.interface';
import { HotkeyChord } from '../../../interfaces/hotkey-chord.interface';
import { HotkeyPickerComponent } from './hotkey-picker.component';
import { parseNormalizedHotkey } from '../../../utils/sequencer/sequencer-hotkey-options.util';

export interface LabelBtnDialogData {
  mode: 'create' | 'edit';
  btn?: LabelBtn;
}

@Component({
  selector: 'app-create-label-btn-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    HotkeyPickerComponent,
  ],
  templateUrl: './create-label-btn-dialog.component.html',
  styleUrl: './create-label-btn-dialog.component.scss',
})
export class CreateLabelBtnDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateLabelBtnDialogComponent>);
  readonly data = inject<LabelBtnDialogData>(MAT_DIALOG_DATA);
  private readonly panelService = inject(SequencerPanelService);
  private readonly hotkeysService = inject(HotkeysService);
  private readonly runtimeService = inject(SequencerRuntimeService);

  readonly isEdit = this.data.mode === 'edit';
  readonly currentActionId = this.data.btn?.id ?? null;

  readonly selectedChord = signal<HotkeyChord | null>(parseNormalizedHotkey(this.data.btn?.hotkeyNormalized));
  readonly hotkeyError = signal<string | null>(null);

  readonly form = new FormGroup({
    id: new FormControl(
      { value: this.data.btn?.id ?? '', disabled: this.isEdit },
      [Validators.required],
    ),
    name: new FormControl(this.data.btn?.name ?? '', [Validators.required]),
    mode: new FormControl<'once' | 'indefinite'>(this.data.btn?.labelProps.mode ?? 'once', {
      nonNullable: true,
    }),
  });

  readonly canSave = computed(() => {
    if (this.form.invalid) {
      return false;
    }
    if (!this.isEdit) {
      const idValue = this.form.controls.id.value ?? '';
      if (!this.panelService.isIdAvailable(idValue)) {
        return false;
      }
    }
    const chord = this.selectedChord();
    if (!chord) {
      return true;
    }
    const status = this.getHotkeyStatus(chord);
    return !!status && status.isValid && !status.usedBy;
  });

  onChordChange(chord: HotkeyChord | null) {
    this.selectedChord.set(chord);
    this.hotkeyError.set(null);
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
    const mode = this.form.controls.mode.value ?? 'once';

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

    if (this.isEdit) {
      this.panelService.updateBtn(id, {
        name,
        hotkeyNormalized,
        labelProps: { mode },
      });
    } else {
      const created = this.panelService.addLabelBtn({
        id,
        name,
        hotkeyNormalized,
        labelProps: { mode },
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

  private getHotkeyStatus(chord: HotkeyChord) {
    const status = this.hotkeysService.isHotkeyUsed(chord);
    if (status.usedBy?.kind === 'sequencer' && status.usedBy.actionId === this.currentActionId) {
      return { ...status, usedBy: undefined };
    }
    return status;
  }
}
