import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SequencerPanelService } from '../../../../../core/service/sequencer-panel.service';
import { CreateStatBtnDialogComponent } from './create-stat-btn-dialog.component';

class MockSequencerPanelService {
  readonly btnList = signal([
    { id: 'evt-shot', name: 'Shot', type: 'event', eventProps: { kind: 'limited', preMs: 0, postMs: 0 } },
    { id: 'lbl-success', name: 'Success', type: 'label', labelProps: { mode: 'once' } },
  ] as const);

  isIdAvailable = jasmine.createSpy('isIdAvailable').and.returnValue(true);
  addStatBtn = jasmine.createSpy('addStatBtn');
  updateBtn = jasmine.createSpy('updateBtn');
}

describe('CreateStatBtnDialogComponent', () => {
  let fixture: ComponentFixture<CreateStatBtnDialogComponent>;
  let component: CreateStatBtnDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStatBtnDialogComponent],
      providers: [
        { provide: SequencerPanelService, useClass: MockSequencerPanelService },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateStatBtnDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('uses a valid default color', () => {
    expect(component.form.controls.colorHex.value).toBe('#1f4b73');
    expect(component.colorPreview()).toBe('#1f4b73');
  });

  it('reflects color changes in preview', () => {
    component.form.controls.colorHex.setValue('#123456');
    expect(component.colorPreview()).toBe('#123456');
  });

  it('enables create in simple mode when required fields are valid', () => {
    component.form.controls.id.setValue('stat-1');
    component.form.controls.name.setValue('Stat 1');
    component.simpleEventIds.set(['evt-shot']);

    expect(component.canSave()).toBeTrue();
  });

  it('enables create in complex mode when expression is valid', () => {
    component.modeControl.setValue('complex');
    component.form.controls.id.setValue('stat-2');
    component.form.controls.name.setValue('Stat 2');

    component.complexTerms.set([
      { kind: 'query', constantValue: 0, eventIds: ['evt-shot'], labelIds: [] },
      { kind: 'constant', constantValue: 2, eventIds: [], labelIds: [] },
    ]);
    component.clearExpression();
    component.addToken({ kind: 'paren', value: '(' });
    component.addToken({ kind: 'term', alias: 'A' });
    component.addToken({ kind: 'operator', op: '+' });
    component.addToken({ kind: 'term', alias: 'B' });
    component.addToken({ kind: 'paren', value: ')' });
    component.addToken({ kind: 'operator', op: '/' });
    component.addToken({ kind: 'term', alias: 'B' });

    expect(component.expressionValidation().ok).toBeTrue();
    expect(component.canSave()).toBeTrue();
  });

  it('disables create when expression is incomplete or invalid', () => {
    component.modeControl.setValue('complex');
    component.form.controls.id.setValue('stat-3');
    component.form.controls.name.setValue('Stat 3');
    component.clearExpression();
    component.addToken({ kind: 'term', alias: 'A' });
    component.addToken({ kind: 'operator', op: '+' });

    expect(component.expressionValidation().ok).toBeFalse();
    expect(component.canSave()).toBeFalse();
  });

  it('validates parenthesis balance', () => {
    component.modeControl.setValue('complex');
    component.form.controls.id.setValue('stat-4');
    component.form.controls.name.setValue('Stat 4');

    component.clearExpression();
    component.addToken({ kind: 'paren', value: '(' });
    component.addToken({ kind: 'term', alias: 'A' });

    expect(component.expressionValidation().ok).toBeFalse();
    expect(component.expressionValidation().error).toContain('incomplète');
  });
});
