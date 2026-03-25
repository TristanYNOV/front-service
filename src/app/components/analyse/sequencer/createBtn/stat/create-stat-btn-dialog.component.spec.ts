import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SequencerPanelService } from '../../../../../core/service/sequencer-panel.service';
import { CreateStatBtnDialogComponent } from './create-stat-btn-dialog.component';

class MockSequencerPanelService {
  readonly btnList = signal([
    { id: 'evt-shot', name: 'Shot', type: 'event', eventProps: { kind: 'limited', preMs: 0, postMs: 0 } },
    { id: 'evt-possession', name: 'Possession', type: 'event', eventProps: { kind: 'limited', preMs: 0, postMs: 0 } },
    { id: 'lbl-success', name: 'Success', type: 'label', labelProps: { mode: 'once' } },
  ] as const);

  isIdAvailable = jasmine.createSpy('isIdAvailable').and.returnValue(true);
  addStatBtn = jasmine.createSpy('addStatBtn');
  updateBtn = jasmine.createSpy('updateBtn');
}

describe('CreateStatBtnDialogComponent', () => {
  let fixture: ComponentFixture<CreateStatBtnDialogComponent>;
  let component: CreateStatBtnDialogComponent;
  let panelService: MockSequencerPanelService;

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
    panelService = TestBed.inject(SequencerPanelService) as unknown as MockSequencerPanelService;
    fixture.detectChanges();
  });

  it('recognizes valid id and name correctly', () => {
    component.form.controls.id.setValue('stat-1');
    component.form.controls.name.setValue('Stat 1');

    expect(component.idNameError()).toBeNull();
  });

  it('hides id/name error when fields are filled', () => {
    component.form.controls.id.markAsTouched();
    component.form.controls.name.markAsTouched();
    component.form.controls.id.setValue('stat-1');
    component.form.controls.name.setValue('Stat 1');

    expect(component.idNameError()).toBeNull();
  });


  it('updates canSave reactively when id changes', () => {
    component.form.controls.name.setValue('Simple');
    component.simpleEventIds.set(['evt-shot']);
    expect(component.canSave()).toBeFalse();

    component.form.controls.id.setValue('stat-id');
    expect(component.canSave()).toBeTrue();
  });

  it('updates canSave reactively when name changes', () => {
    component.form.controls.id.setValue('stat-name');
    component.simpleEventIds.set(['evt-shot']);
    expect(component.canSave()).toBeFalse();

    component.form.controls.name.setValue('Nom');
    expect(component.canSave()).toBeTrue();
  });

  it('updates canSave reactively when color changes', () => {
    component.form.controls.id.setValue('stat-color');
    component.form.controls.name.setValue('Color');
    component.simpleEventIds.set(['evt-shot']);

    component.form.controls.colorHex.setValue('invalid');
    expect(component.canSave()).toBeFalse();

    component.form.controls.colorHex.setValue('#123456');
    expect(component.canSave()).toBeTrue();
  });

  it('updates canSave when simple event selection changes', () => {
    component.form.controls.id.setValue('stat-simple');
    component.form.controls.name.setValue('Simple');
    expect(component.canSave()).toBeFalse();

    component.simpleEventIds.set(['evt-shot']);
    expect(component.canSave()).toBeTrue();
  });
  it('enables create in simple mode when everything is valid', () => {
    component.form.controls.id.setValue('stat-simple');
    component.form.controls.name.setValue('Simple');
    component.simpleEventIds.set(['evt-shot']);

    expect(component.canSave()).toBeTrue();
  });

  it('enables create in complex mode when expression and terms are valid', () => {
    component.modeControl.setValue('complex');
    component.form.controls.id.setValue('stat-complex');
    component.form.controls.name.setValue('Complex');

    const terms = component.complexTerms();
    component.updateTermDisplayName(terms[0].id, 'Tirs marqués');
    component.updateTermEventIds(terms[0].id, ['evt-shot']);
    component.updateTermDisplayName(terms[1].id, 'Possessions');
    component.updateTermKind(terms[1].id, 'query');
    component.updateTermEventIds(terms[1].id, ['evt-possession']);

    component.clearExpression();
    component.addToken({ kind: 'term', termId: terms[0].id });
    component.addToken({ kind: 'operator', op: '/' });
    component.addToken({ kind: 'term', termId: terms[1].id });

    expect(component.expressionValidation().ok).toBeTrue();
    expect(component.canSave()).toBeTrue();
  });


  it('updates canSave when complex terms/tokens change', () => {
    component.modeControl.setValue('complex');
    component.form.controls.id.setValue('stat-complex-tick');
    component.form.controls.name.setValue('Complex tick');

    const terms = component.complexTerms();
    component.updateTermDisplayName(terms[0].id, 'Tirs');
    component.updateTermEventIds(terms[0].id, ['evt-shot']);

    component.updateTermDisplayName(terms[1].id, 'Possessions');
    component.updateTermKind(terms[1].id, 'query');
    component.updateTermEventIds(terms[1].id, ['evt-possession']);

    expect(component.canSave()).toBeFalse();

    component.addToken({ kind: 'term', termId: terms[0].id });
    component.addToken({ kind: 'operator', op: '/' });
    component.addToken({ kind: 'term', termId: terms[1].id });

    expect(component.canSave()).toBeTrue();
  });
  it('persists displayName for complex terms in JSON payload', () => {
    component.modeControl.setValue('complex');
    component.form.controls.id.setValue('stat-complex');
    component.form.controls.name.setValue('Complex');

    const terms = component.complexTerms();
    component.updateTermDisplayName(terms[0].id, 'Tirs marqués');
    component.updateTermEventIds(terms[0].id, ['evt-shot']);

    component.updateTermDisplayName(terms[1].id, 'Constante deux');
    component.updateTermKind(terms[1].id, 'constant');
    component.updateTermConstantValue(terms[1].id, 2);

    component.clearExpression();
    component.addToken({ kind: 'term', termId: terms[0].id });
    component.addToken({ kind: 'operator', op: '/' });
    component.addToken({ kind: 'term', termId: terms[1].id });

    component.save();

    const saved = panelService.addStatBtn.calls.mostRecent().args[0];
    expect(saved.stat.mode).toBe('complex');
    if (saved.stat.mode === 'complex') {
      expect(saved.stat.editor?.terms[0].displayName).toBe('Tirs marqués');
    }
  });


  it('keeps non-regression on save for simple mode', () => {
    component.form.controls.id.setValue('stat-save-simple');
    component.form.controls.name.setValue('Simple save');
    component.simpleEventIds.set(['evt-shot']);
    component.simpleLabelIds.set(['lbl-success']);

    component.save();

    expect(panelService.addStatBtn).toHaveBeenCalled();
    const payload = panelService.addStatBtn.calls.mostRecent().args[0];
    expect(payload.stat.mode).toBe('simple');
  });
  it('loads renamed terms when reopening in edit mode', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CreateStatBtnDialogComponent],
      providers: [
        { provide: SequencerPanelService, useClass: MockSequencerPanelService },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            mode: 'edit',
            btn: {
              id: 'stat-edit',
              name: 'Edit',
              type: 'stat',
              stat: {
                mode: 'complex',
                expression: { kind: 'constant', value: 1 },
                editor: {
                  terms: [
                    { id: 'term_1', displayName: 'Possessions', kind: 'query', query: { eventIds: ['evt-possession'], labelIds: [], metric: 'count', labelMatch: 'all' } },
                  ],
                  tokens: [{ kind: 'term', termId: 'term_1' }],
                },
              },
            },
          },
        },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    }).compileComponents();

    const editFixture = TestBed.createComponent(CreateStatBtnDialogComponent);
    const editComponent = editFixture.componentInstance;
    expect(editComponent.complexTerms()[0].displayName).toBe('Possessions');
  });

  it('renders expression section before terms section in complex mode', () => {
    component.modeControl.setValue('complex');
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content.indexOf('Expression mathématique')).toBeLessThan(content.indexOf('Termes disponibles'));
  });
});
