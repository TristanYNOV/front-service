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
import { SequencerPanelService } from '../../../../../core/service/sequencer-panel.service';
import {
  SequencerStatDefinition,
  SequencerStatNode,
  SequencerStatOperator,
  StatBtn,
} from '../../../../../interfaces/sequencer-btn.interface';

interface StatTermForm {
  kind: 'query' | 'constant';
  constantValue: number;
  eventIds: string[];
  labelIds: string[];
}

type ExpressionToken =
  | { kind: 'term'; alias: string }
  | { kind: 'operator'; op: SequencerStatOperator }
  | { kind: 'paren'; value: '(' | ')' };

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
  readonly modeControl = new FormControl<'simple' | 'complex'>(this.data.btn?.stat.mode ?? 'simple', { nonNullable: true });

  readonly form = new FormGroup({
    id: new FormControl({ value: this.data.btn?.id ?? '', disabled: this.isEdit }, [Validators.required]),
    name: new FormControl(this.data.btn?.name ?? '', [Validators.required]),
    colorHex: new FormControl(this.normalizeColor(this.data.btn?.colorHex), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    }),
  });

  readonly simpleEventIds = signal<string[]>(
    this.data.btn?.stat.mode === 'simple' ? this.data.btn.stat.query.eventIds : [],
  );
  readonly simpleLabelIds = signal<string[]>(
    this.data.btn?.stat.mode === 'simple' ? this.data.btn.stat.query.labelIds : [],
  );

  private readonly initialComplex = this.data.btn?.stat.mode === 'complex'
    ? this.extractTermsAndTokensFromAst(this.data.btn.stat.expression)
    : null;

  readonly complexTerms = signal<StatTermForm[]>(
    this.initialComplex?.terms ?? [this.buildEmptyQueryTerm(), this.buildEmptyConstantTerm()],
  );

  readonly expressionTokens = signal<ExpressionToken[]>(
    this.initialComplex?.tokens ?? [
      { kind: 'term', alias: 'A' },
      { kind: 'operator', op: '+' },
      { kind: 'term', alias: 'B' },
    ],
  );

  readonly availableEvents = computed(() => this.panelService.btnList().filter(btn => btn.type === 'event'));
  readonly availableLabels = computed(() => this.panelService.btnList().filter(btn => btn.type === 'label'));
  readonly aliasList = computed(() => this.complexTerms().map((_, index) => indexToAlias(index)));

  readonly expressionText = computed(() =>
    this.expressionTokens()
      .map(token => {
        if (token.kind === 'term') {
          return token.alias;
        }
        if (token.kind === 'operator') {
          return token.op;
        }
        return token.value;
      })
      .join(' '),
  );

  readonly colorPreview = computed(() => this.normalizeColor(this.form.controls.colorHex.value));
  readonly colorError = computed(() => {
    const control = this.form.controls.colorHex;
    if (!control.invalid || !control.touched) {
      return null;
    }
    return 'Couleur invalide (format #RRGGBB).';
  });

  readonly simpleError = computed(() =>
    this.modeControl.value === 'simple' && this.simpleEventIds().length === 0
      ? 'Sélectionne au moins un event.'
      : null,
  );

  readonly complexTermError = computed(() => {
    if (this.modeControl.value !== 'complex') {
      return null;
    }

    const invalid = this.complexTerms().some(term =>
      term.kind === 'query'
        ? term.eventIds.length === 0
        : !Number.isFinite(term.constantValue),
    );

    return invalid ? 'Chaque terme doit être défini (event requis pour une requête, constante numérique valide).' : null;
  });

  readonly expressionValidation = computed(() => {
    if (this.modeControl.value !== 'complex') {
      return { ok: true, error: null as string | null, node: null as SequencerStatNode | null };
    }

    const termsMap = this.buildAliasTermMap();
    return buildExpressionNode(this.expressionTokens(), termsMap);
  });

  readonly canSave = computed(() => {
    if (this.form.invalid) {
      return false;
    }

    const id = (this.form.controls.id.value ?? '').trim();
    if (!this.isEdit && !this.panelService.isIdAvailable(id)) {
      return false;
    }

    if (this.modeControl.value === 'simple') {
      return this.simpleEventIds().length > 0;
    }

    return !this.complexTermError() && this.expressionValidation().ok;
  });

  readonly formError = computed(() => {
    if (this.form.controls.id.invalid || this.form.controls.name.invalid) {
      return 'ID et nom sont requis.';
    }

    if (this.colorError()) {
      return this.colorError();
    }

    if (this.simpleError()) {
      return this.simpleError();
    }

    if (this.complexTermError()) {
      return this.complexTermError();
    }

    return this.expressionValidation().error;
  });

  addComplexTerm() {
    this.complexTerms.set([...this.complexTerms(), this.buildEmptyQueryTerm()]);
  }

  removeComplexTerm(index: number) {
    const terms = this.complexTerms();
    if (terms.length <= 1) {
      return;
    }

    const aliasToRemove = indexToAlias(index);
    const nextTerms = terms.filter((_, idx) => idx !== index);
    this.complexTerms.set(nextTerms);

    const nextTokens = this.expressionTokens()
      .map(token => {
        if (token.kind !== 'term') {
          return token;
        }

        if (token.alias === aliasToRemove) {
          return null;
        }

        const oldIndex = aliasToIndex(token.alias);
        if (oldIndex > index) {
          return { kind: 'term', alias: indexToAlias(oldIndex - 1) } as ExpressionToken;
        }
        return token;
      })
      .filter((token): token is ExpressionToken => token !== null);

    this.expressionTokens.set(nextTokens);
  }

  updateTerm(index: number, patch: Partial<StatTermForm>) {
    const next = this.complexTerms().map((term, idx) => (idx === index ? { ...term, ...patch } : term));
    this.complexTerms.set(next);
  }

  addToken(token: ExpressionToken) {
    this.expressionTokens.set([...this.expressionTokens(), token]);
  }

  removeLastToken() {
    this.expressionTokens.set(this.expressionTokens().slice(0, -1));
  }

  clearExpression() {
    this.expressionTokens.set([]);
  }

  save() {
    this.form.markAllAsTouched();
    if (!this.canSave()) {
      return;
    }

    const id = (this.form.controls.id.value ?? '').trim();
    const name = (this.form.controls.name.value ?? '').trim();
    const colorHex = this.normalizeColor(this.form.controls.colorHex.value);

    const statDefinition = this.modeControl.value === 'simple'
      ? this.buildSimpleDefinition(this.simpleEventIds(), this.simpleLabelIds())
      : this.buildComplexDefinition();

    if (!statDefinition) {
      return;
    }

    if (this.isEdit) {
      this.panelService.updateBtn(id, {
        name,
        colorHex,
        stat: statDefinition,
      });
    } else {
      this.panelService.addStatBtn({
        id,
        name,
        colorHex,
        stat: statDefinition,
      });
    }

    this.dialogRef.close(true);
  }

  close() {
    this.dialogRef.close(false);
  }

  private buildSimpleDefinition(eventIds: string[], labelIds: string[]): SequencerStatDefinition {
    return {
      mode: 'simple',
      query: {
        eventIds,
        labelIds,
        metric: 'count',
        labelMatch: 'all',
      },
    };
  }

  private buildComplexDefinition(): SequencerStatDefinition | null {
    const result = this.expressionValidation();
    if (!result.ok || !result.node) {
      return null;
    }

    return {
      mode: 'complex',
      expression: result.node,
    };
  }

  private buildAliasTermMap() {
    const map = new Map<string, StatTermForm>();
    this.complexTerms().forEach((term, index) => {
      map.set(indexToAlias(index), term);
    });
    return map;
  }

  private extractTermsAndTokensFromAst(root: SequencerStatNode): { terms: StatTermForm[]; tokens: ExpressionToken[] } {
    const terms: StatTermForm[] = [];
    const tokens: ExpressionToken[] = [];

    const visit = (node: SequencerStatNode) => {
      if (node.kind === 'group') {
        tokens.push({ kind: 'paren', value: '(' });
        visit(node.left);
        tokens.push({ kind: 'operator', op: node.op });
        visit(node.right);
        tokens.push({ kind: 'paren', value: ')' });
        return;
      }

      if (node.kind === 'constant') {
        const alias = indexToAlias(terms.length);
        terms.push({ kind: 'constant', constantValue: node.value, eventIds: [], labelIds: [] });
        tokens.push({ kind: 'term', alias });
        return;
      }

      const alias = indexToAlias(terms.length);
      terms.push({
        kind: 'query',
        constantValue: 0,
        eventIds: [...node.query.eventIds],
        labelIds: [...node.query.labelIds],
      });
      tokens.push({ kind: 'term', alias });
    };

    visit(root);

    return { terms, tokens };
  }

  private buildEmptyQueryTerm(): StatTermForm {
    return { kind: 'query', constantValue: 0, eventIds: [], labelIds: [] };
  }

  private buildEmptyConstantTerm(): StatTermForm {
    return { kind: 'constant', constantValue: 1, eventIds: [], labelIds: [] };
  }

  private normalizeColor(value: string | null | undefined) {
    if (value && /^#[0-9a-fA-F]{6}$/.test(value)) {
      return value;
    }
    return '#1f4b73';
  }
}

function indexToAlias(index: number): string {
  return String.fromCharCode(65 + index);
}

function aliasToIndex(alias: string): number {
  return alias.charCodeAt(0) - 65;
}

function termToNode(term: StatTermForm): SequencerStatNode | null {
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
      eventIds: term.eventIds,
      labelIds: term.labelIds,
      metric: 'count',
      labelMatch: 'all',
    },
  };
}

function buildExpressionNode(tokens: ExpressionToken[], aliasToTerm: Map<string, StatTermForm>) {
  if (!tokens.length) {
    return { ok: false, error: 'L’expression est vide.', node: null };
  }

  const operators: (SequencerStatOperator | "(")[] = [];
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
  let balance = 0;

  for (const token of tokens) {
    if (token.kind === 'term') {
      if (!expectOperand) {
        return { ok: false, error: 'Opérateur manquant entre deux termes.', node: null };
      }
      const term = aliasToTerm.get(token.alias);
      if (!term) {
        return { ok: false, error: `Terme ${token.alias} introuvable.`, node: null };
      }
      const node = termToNode(term);
      if (!node) {
        return { ok: false, error: `Terme ${token.alias} invalide.`, node: null };
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
        balance += 1;
        continue;
      }

      if (expectOperand || balance <= 0) {
        return { ok: false, error: 'Parenthèses non équilibrées.', node: null };
      }

      while (operators.length && operators[operators.length - 1] !== '(') {
        if (!reduce()) {
          return { ok: false, error: 'Division statique par zéro détectée.', node: null };
        }
      }

      if (operators.pop() !== '(') {
        return { ok: false, error: 'Parenthèses non équilibrées.', node: null };
      }
      balance -= 1;
      expectOperand = false;
      continue;
    }

    if (expectOperand) {
      return { ok: false, error: 'Opérateur sans opérande.', node: null };
    }

    while (operators.length) {
      const topOperator = operators[operators.length - 1];
      if (topOperator === '(' || precedence(topOperator) < precedence(token.op)) {
        break;
      }
      if (!reduce()) {
        return { ok: false, error: 'Division statique par zéro détectée.', node: null };
      }
    }

    operators.push(token.op);
    expectOperand = true;
  }

  if (expectOperand || balance !== 0) {
    return { ok: false, error: 'L’expression est incomplète.', node: null };
  }

  while (operators.length) {
    const top = operators[operators.length - 1];
    if (top === '(') {
      return { ok: false, error: 'Parenthèses non équilibrées.', node: null };
    }
    if (!reduce()) {
      return { ok: false, error: 'Division statique par zéro détectée.', node: null };
    }
  }

  if (nodes.length !== 1) {
    return { ok: false, error: 'L’expression est invalide.', node: null };
  }

  return { ok: true, error: null, node: nodes[0] };
}

function precedence(op: SequencerStatOperator): number {
  if (op === '+' || op === '-') {
    return 1;
  }
  return 2;
}
