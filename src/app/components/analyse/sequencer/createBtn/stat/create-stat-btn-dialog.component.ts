import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { merge } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SequencerPanelService } from '../../../../../core/service/sequencer-panel.service';
import {
  SequencerStatDefinition,
  SequencerStatEditorTerm,
  SequencerStatExpressionToken,
  SequencerStatNode,
  SequencerStatOperator,
  StatBtn,
} from '../../../../../interfaces/sequencer-btn.interface';

interface EditableStatTerm {
  id: string;
  displayName: string;
  kind: 'query' | 'constant';
  constantValue: number;
  eventIds: string[];
  labelIds: string[];
  labelColorById: Record<string, string>;
}

export interface StatBtnDialogData {
  mode: 'create' | 'edit';
  btn?: StatBtn;
}

@Component({
  selector: 'app-create-stat-btn-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './create-stat-btn-dialog.component.html',
  styleUrl: './create-stat-btn-dialog.component.scss',
})
export class CreateStatBtnDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateStatBtnDialogComponent>);
  readonly data = inject<StatBtnDialogData>(MAT_DIALOG_DATA);
  private readonly panelService = inject(SequencerPanelService);

  readonly isEdit = this.data.mode === 'edit';
  readonly submitted = signal(false);

  readonly modeControl = new FormControl<'simple' | 'complex'>(this.data.btn?.stat.mode ?? 'simple', { nonNullable: true });

  readonly form = new FormGroup({
    id: new FormControl(this.data.btn?.id ?? '', { nonNullable: true, validators: [Validators.required, trimmedRequiredValidator()] }),
    name: new FormControl(this.data.btn?.name ?? '', { nonNullable: true, validators: [Validators.required, trimmedRequiredValidator()] }),
    colorHex: new FormControl(normalizeColor(this.data.btn?.colorHex), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    }),
    isAnonymized: new FormControl(this.data.btn?.isAnonymized ?? false, {
      nonNullable: true,
    }),
  });

  readonly simpleEventIds = signal<string[]>(
    this.data.btn?.stat.mode === 'simple' ? this.data.btn.stat.query.eventIds : [],
  );
  readonly simpleLabelIds = signal<string[]>(
    this.data.btn?.stat.mode === 'simple' ? this.data.btn.stat.query.labelIds : [],
  );
  readonly simpleLabelColorById = signal<Record<string, string>>(
    this.data.btn?.stat.mode === 'simple' ? { ...(this.data.btn.stat.query.labelColorById ?? {}) } : {},
  );

  private readonly initialComplex = this.data.btn?.stat.mode === 'complex'
    ? this.getInitialComplexEditorState(this.data.btn.stat)
    : null;

  readonly complexTerms = signal<EditableStatTerm[]>(
    this.initialComplex?.terms ?? [this.createQueryTerm(), this.createConstantTerm()],
  );
  readonly expressionTokens = signal<SequencerStatExpressionToken[]>(
    this.initialComplex?.tokens ?? [],
  );


  readonly modeValue = toSignal(this.modeControl.valueChanges.pipe(startWith(this.modeControl.value)), {
    initialValue: this.modeControl.value,
  });

  private readonly formSync = toSignal(
    merge(
      this.form.valueChanges,
      this.form.statusChanges,
      this.modeControl.valueChanges,
    ).pipe(startWith(null)),
    { initialValue: null },
  );
  readonly availableEvents = computed(() => this.panelService.btnList().filter(btn => btn.type === 'event'));
  readonly availableLabels = computed(() => this.panelService.btnList().filter(btn => btn.type === 'label'));
  readonly selectedSimpleLabels = computed(() => this.simpleLabelIds().map(id => this.availableLabels().find(label => label.id === id)).filter(Boolean));

  readonly colorPreview = computed(() => normalizeColor(this.form.controls.colorHex.value));
  readonly expressionText = computed(() => this.expressionTokens().map(token => this.tokenLabel(token)).join(' '));

  readonly idNameError = computed(() => {
    this.formSync();
    const show = this.submitted() || this.form.controls.id.touched || this.form.controls.name.touched;
    if (!show) {
      return null;
    }

    if (this.form.controls.id.invalid || this.form.controls.name.invalid) {
      return 'ID et nom sont requis.';
    }

    return null;
  });

  readonly colorError = computed(() => {
    this.formSync();
    const control = this.form.controls.colorHex;
    if (!(this.submitted() || control.touched) || !control.invalid) {
      return null;
    }
    return 'Couleur invalide (format #RRGGBB).';
  });

  readonly simpleError = computed(() => {
    this.formSync();
    if (this.modeValue() !== 'simple') {
      return null;
    }

    return this.simpleEventIds().length > 0 ? null : 'Sélectionne au moins un event.';
  });

  readonly complexTermError = computed(() => {
    this.formSync();
    if (this.modeValue() !== 'complex') {
      return null;
    }

    const invalidTerm = this.complexTerms().some(term => {
      if (!term.displayName.trim()) {
        return true;
      }

      if (term.kind === 'query') {
        return term.eventIds.length === 0;
      }

      return !Number.isFinite(term.constantValue);
    });

    return invalidTerm ? 'Chaque terme doit avoir un nom et une définition valide.' : null;
  });

  readonly expressionValidation = computed(() => {
    this.formSync();
    if (this.modeValue() !== 'complex') {
      return { ok: true, error: null as string | null, node: null as SequencerStatNode | null };
    }

    return buildExpressionTree(this.expressionTokens(), this.complexTerms());
  });

  readonly formError = computed(() => {
    this.formSync();
    return this.idNameError()
    ?? this.colorError()
    ?? this.simpleError()
    ?? this.complexTermError()
    ?? this.expressionValidation().error;
  });

  readonly canSave = computed(() => {
    this.formSync();
    if (this.form.invalid || this.idNameError() || this.colorError()) {
      return false;
    }

    const mode = this.modeValue();
    if (mode === 'simple') {
      return this.simpleEventIds().length > 0;
    }

    return !this.complexTermError() && this.expressionValidation().ok;
  });

  constructor() {
    if (this.isEdit) {
      this.form.controls.id.disable({ emitEvent: false });
    }
  }

  addComplexTerm() {
    this.complexTerms.set([...this.complexTerms(), this.createQueryTerm()]);
  }

  removeComplexTerm(termId: string) {
    this.complexTerms.set(this.complexTerms().filter(term => term.id !== termId));
    this.expressionTokens.set(this.expressionTokens().filter(token => token.kind !== 'term' || token.termId !== termId));
  }

  addToken(token: SequencerStatExpressionToken) {
    this.expressionTokens.set([...this.expressionTokens(), token]);
  }

  removeLastToken() {
    this.expressionTokens.set(this.expressionTokens().slice(0, -1));
  }

  clearExpression() {
    this.expressionTokens.set([]);
  }


  updateTermDisplayName(termId: string, displayName: string) {
    this.patchTerm(termId, { displayName });
  }

  updateTermKind(termId: string, kind: 'query' | 'constant') {
    this.patchTerm(termId, { kind });
  }

  updateTermConstantValue(termId: string, constantValue: number) {
    this.patchTerm(termId, { constantValue });
  }

  updateTermEventIds(termId: string, eventIds: string[]) {
    this.patchTerm(termId, { eventIds });
  }

  updateTermLabelIds(termId: string, labelIds: string[]) {
    this.patchTerm(termId, { labelIds });
  }
  updateSimpleLabelColor(labelId: string, color: string) {
    const normalized = normalizeColor(color);
    this.simpleLabelColorById.set({
      ...this.simpleLabelColorById(),
      [labelId]: normalized,
    });
  }

  updateTermLabelColor(termId: string, labelId: string, color: string) {
    const normalized = normalizeColor(color);
    this.complexTerms.set(this.complexTerms().map(term =>
      term.id === termId
        ? { ...term, labelColorById: { ...term.labelColorById, [labelId]: normalized } }
        : term,
    ));
  }

  save() {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (!this.canSave()) {
      return;
    }

    const id = this.form.controls.id.value.trim();
    const name = this.form.controls.name.value.trim();
    const colorHex = normalizeColor(this.form.controls.colorHex.value);
    const isAnonymized = this.form.controls.isAnonymized.value;

    const statDefinition = this.modeValue() === 'simple'
      ? this.buildSimpleDefinition()
      : this.buildComplexDefinition();

    if (!statDefinition) {
      return;
    }

    if (this.isEdit) {
      this.panelService.updateBtn(id, { name, colorHex, isAnonymized, stat: statDefinition });
    } else {
      this.panelService.addStatBtn({ id, name, colorHex, isAnonymized, stat: statDefinition });
    }

    this.dialogRef.close(true);
  }

  close() {
    this.dialogRef.close(false);
  }


  private patchTerm(termId: string, patch: Partial<EditableStatTerm>) {
    this.complexTerms.set(this.complexTerms().map(term => term.id === termId ? { ...term, ...patch } : term));
  }
  private buildSimpleDefinition(): SequencerStatDefinition {
    const selectedLabels = new Set(this.simpleLabelIds());
    const colorById = Object.fromEntries(
      Object.entries(this.simpleLabelColorById()).filter(([labelId]) => selectedLabels.has(labelId)),
    );

    return {
      mode: 'simple',
      query: {
        eventIds: [...this.simpleEventIds()],
        labelIds: [...this.simpleLabelIds()],
        labelColorById: colorById,
        metric: 'count',
        labelMatch: 'all',
      },
    };
  }

  private buildComplexDefinition(): SequencerStatDefinition | null {
    const compiled = this.expressionValidation();
    if (!compiled.ok || !compiled.node) {
      return null;
    }

    const terms: SequencerStatEditorTerm[] = this.complexTerms().map(term =>
      term.kind === 'query'
        ? {
            id: term.id,
            displayName: term.displayName.trim(),
            kind: 'query',
            query: {
              eventIds: [...term.eventIds],
              labelIds: [...term.labelIds],
              labelColorById: { ...term.labelColorById },
              metric: 'count',
              labelMatch: 'all',
            },
          }
        : {
            id: term.id,
            displayName: term.displayName.trim(),
            kind: 'constant',
            constantValue: term.constantValue,
          },
    );

    return {
      mode: 'complex',
      expression: compiled.node,
      editor: {
        terms,
        tokens: [...this.expressionTokens()],
      },
    };
  }

  private getInitialComplexEditorState(statDefinition: Extract<SequencerStatDefinition, { mode: 'complex' }>) {
    if (statDefinition.editor) {
      return {
        terms: statDefinition.editor.terms.map(term =>
          term.kind === 'query'
            ? {
                id: term.id,
                displayName: term.displayName,
                kind: 'query' as const,
                constantValue: 0,
                eventIds: [...(term.query?.eventIds ?? [])],
                labelIds: [...(term.query?.labelIds ?? [])],
                labelColorById: { ...(term.query?.labelColorById ?? {}) },
              }
            : {
                id: term.id,
                displayName: term.displayName,
                kind: 'constant' as const,
                constantValue: term.constantValue ?? 0,
                eventIds: [],
                labelIds: [],
                labelColorById: {},
              },
        ),
        tokens: [...statDefinition.editor.tokens],
      };
    }

    return flattenAstForEditing(statDefinition.expression);
  }

  private createQueryTerm(): EditableStatTerm {
    return {
      id: `term_${cryptoRandom()}`,
      displayName: 'Nouvelle requête',
      kind: 'query',
      constantValue: 0,
      eventIds: [],
      labelIds: [],
      labelColorById: {},
    };
  }

  private createConstantTerm(): EditableStatTerm {
    return {
      id: `term_${cryptoRandom()}`,
      displayName: 'Constante',
      kind: 'constant',
      constantValue: 1,
      eventIds: [],
      labelIds: [],
      labelColorById: {},
    };
  }

  tokenLabel(token: SequencerStatExpressionToken): string {
    if (token.kind === 'operator') {
      return token.op;
    }
    if (token.kind === 'paren') {
      return token.value;
    }

    const term = this.complexTerms().find(item => item.id === token.termId);
    return term?.displayName || token.termId;
  }

  getTermSelectedLabels(term: EditableStatTerm) {
    return term.labelIds.map(id => this.availableLabels().find(label => label.id === id)).filter(Boolean);
  }
}

function buildExpressionTree(tokens: SequencerStatExpressionToken[], terms: EditableStatTerm[]) {
  if (!tokens.length) {
    return { ok: false, error: 'L’expression est vide.', node: null as SequencerStatNode | null };
  }

  const termById = new Map(terms.map(term => [term.id, term]));
  const operators: (SequencerStatOperator | '(')[] = [];
  const nodes: SequencerStatNode[] = [];

  const reduce = () => {
    const op = operators.pop();
    const right = nodes.pop();
    const left = nodes.pop();
    if (!op || op === '(' || !left || !right) {
      return false;
    }
    if (op === '/' && right.kind === 'constant' && right.value === 0) {
      return false;
    }
    nodes.push({ kind: 'group', left, op, right });
    return true;
  };

  let expectOperand = true;
  let openParens = 0;

  for (const token of tokens) {
    if (token.kind === 'term') {
      if (!expectOperand) {
        return { ok: false, error: 'Opérateur manquant entre deux termes.', node: null };
      }
      const term = termById.get(token.termId);
      if (!term) {
        return { ok: false, error: 'Un terme référencé est introuvable.', node: null };
      }
      const node = toNode(term);
      if (!node) {
        return { ok: false, error: `Le terme "${term.displayName}" est invalide.`, node: null };
      }
      nodes.push(node);
      expectOperand = false;
      continue;
    }

    if (token.kind === 'paren') {
      if (token.value === '(') {
        if (!expectOperand) {
          return { ok: false, error: 'Parenthèse ouvrante mal placée.', node: null };
        }
        operators.push('(');
        openParens += 1;
        continue;
      }

      if (expectOperand || openParens <= 0) {
        return { ok: false, error: 'Parenthèses non équilibrées.', node: null };
      }

      while (operators.length && operators[operators.length - 1] !== '(') {
        if (!reduce()) {
          return { ok: false, error: 'Division statique par zéro détectée.', node: null };
        }
      }

      operators.pop();
      openParens -= 1;
      expectOperand = false;
      continue;
    }

    if (expectOperand) {
      return { ok: false, error: 'Opérateur sans opérande.', node: null };
    }

    while (operators.length) {
      const top = operators[operators.length - 1];
      if (top === '(' || precedence(top) < precedence(token.op)) {
        break;
      }
      if (!reduce()) {
        return { ok: false, error: 'Division statique par zéro détectée.', node: null };
      }
    }

    operators.push(token.op);
    expectOperand = true;
  }

  if (expectOperand) {
    return { ok: false, error: 'L’expression est incomplète.', node: null };
  }

  if (openParens !== 0) {
    return { ok: false, error: 'Parenthèses non équilibrées.', node: null };
  }

  while (operators.length) {
    if (!reduce()) {
      return { ok: false, error: 'Division statique par zéro détectée.', node: null };
    }
  }

  return nodes.length === 1
    ? { ok: true, error: null, node: nodes[0] }
    : { ok: false, error: 'L’expression est invalide.', node: null };
}

function toNode(term: EditableStatTerm): SequencerStatNode | null {
  if (!term.displayName.trim()) {
    return null;
  }

  if (term.kind === 'constant') {
    if (!Number.isFinite(term.constantValue)) {
      return null;
    }
    return { kind: 'constant', value: term.constantValue };
  }

  if (!term.eventIds.length) {
    return null;
  }

  return {
    kind: 'query',
    query: {
      eventIds: [...term.eventIds],
      labelIds: [...term.labelIds],
      labelColorById: { ...term.labelColorById },
      metric: 'count',
      labelMatch: 'all',
    },
  };
}

function flattenAstForEditing(root: SequencerStatNode): { terms: EditableStatTerm[]; tokens: SequencerStatExpressionToken[] } {
  const terms: EditableStatTerm[] = [];
  const tokens: SequencerStatExpressionToken[] = [];

  const visit = (node: SequencerStatNode) => {
    if (node.kind === 'group') {
      tokens.push({ kind: 'paren', value: '(' });
      visit(node.left);
      tokens.push({ kind: 'operator', op: node.op });
      visit(node.right);
      tokens.push({ kind: 'paren', value: ')' });
      return;
    }

    const termId = `term_${cryptoRandom()}`;

    if (node.kind === 'constant') {
      terms.push({
        id: termId,
        displayName: `Constante ${terms.length + 1}`,
        kind: 'constant',
        constantValue: node.value,
        eventIds: [],
        labelIds: [],
        labelColorById: {},
      });
    } else {
      terms.push({
        id: termId,
        displayName: `Requête ${terms.length + 1}`,
        kind: 'query',
        constantValue: 0,
        eventIds: [...node.query.eventIds],
        labelIds: [...node.query.labelIds],
        labelColorById: { ...(node.query.labelColorById ?? {}) },
      });
    }

    tokens.push({ kind: 'term', termId });
  };

  visit(root);
  return { terms, tokens };
}

function precedence(op: SequencerStatOperator): number {
  return op === '+' || op === '-' ? 1 : 2;
}

function trimmedRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    `${control.value ?? ''}`.trim().length ? null : { trimmedRequired: true };
}

function normalizeColor(value: string | null | undefined): string {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }
  return '#1f4b73';
}

function cryptoRandom(): string {
  return Math.random().toString(36).slice(2, 9);
}
