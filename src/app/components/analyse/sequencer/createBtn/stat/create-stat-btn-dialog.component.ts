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

interface ComplexOperatorForm {
  op: SequencerStatOperator;
  precedence: 1 | 2;
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
    colorHex: new FormControl(this.data.btn?.colorHex ?? '#1f4b73', { nonNullable: true }),
  });

  readonly simpleEventIds = signal<string[]>(
    this.data.btn?.stat.mode === 'simple' ? this.data.btn.stat.query.eventIds : [],
  );
  readonly simpleLabelIds = signal<string[]>(
    this.data.btn?.stat.mode === 'simple' ? this.data.btn.stat.query.labelIds : [],
  );

  readonly complexTerms = signal<StatTermForm[]>(
    this.data.btn?.stat.mode === 'complex'
      ? this.flattenComplexExpression(this.data.btn.stat.expression).terms
      : [this.buildEmptyQueryTerm(), this.buildEmptyConstantTerm()],
  );

  readonly complexOperators = signal<ComplexOperatorForm[]>(
    this.data.btn?.stat.mode === 'complex'
      ? this.flattenComplexExpression(this.data.btn.stat.expression).operators
      : [{ op: '+', precedence: 1 }],
  );

  readonly availableEvents = computed(() => this.panelService.btnList().filter(btn => btn.type === 'event'));
  readonly availableLabels = computed(() => this.panelService.btnList().filter(btn => btn.type === 'label'));

  readonly canSave = computed(() => {
    if (this.form.invalid) {
      return false;
    }

    const id = (this.form.controls.id.value ?? '').trim();
    if (!this.isEdit && !this.panelService.isIdAvailable(id)) {
      return false;
    }

    if (this.modeControl.value === 'complex') {
      const terms = this.complexTerms();
      const operators = this.complexOperators();
      return terms.length >= 2 && operators.length === terms.length - 1;
    }

    return true;
  });

  addComplexTerm() {
    this.complexTerms.set([...this.complexTerms(), this.buildEmptyQueryTerm()]);
    this.complexOperators.set([...this.complexOperators(), { op: '+', precedence: 1 }]);
  }

  removeComplexTerm(index: number) {
    const terms = this.complexTerms();
    if (terms.length <= 2) {
      return;
    }

    const nextTerms = terms.filter((_, idx) => idx !== index);
    const nextOps = [...this.complexOperators()];
    const opToRemove = index === 0 ? 0 : index - 1;
    nextOps.splice(opToRemove, 1);
    this.complexTerms.set(nextTerms);
    this.complexOperators.set(nextOps);
  }

  updateTerm(index: number, patch: Partial<StatTermForm>) {
    const next = this.complexTerms().map((term, idx) => (idx === index ? { ...term, ...patch } : term));
    this.complexTerms.set(next);
  }

  updateOperator(index: number, patch: Partial<ComplexOperatorForm>) {
    const next = this.complexOperators().map((operator, idx) => (idx === index ? { ...operator, ...patch } : operator));
    this.complexOperators.set(next);
  }

  save() {
    if (!this.canSave()) {
      return;
    }

    const id = (this.form.controls.id.value ?? '').trim();
    const name = (this.form.controls.name.value ?? '').trim();
    const colorHex = this.form.controls.colorHex.value;

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
    const outputStack: SequencerStatNode[] = [];
    const operatorStack: ComplexOperatorForm[] = [];
    const terms = this.complexTerms();
    const operators = this.complexOperators();

    for (let i = 0; i < terms.length; i += 1) {
      const termNode = this.termToNode(terms[i]);
      if (!termNode) {
        return null;
      }
      outputStack.push(termNode);

      if (i < operators.length) {
        const operator = operators[i];
        while (operatorStack.length && operatorStack[operatorStack.length - 1].precedence >= operator.precedence) {
          if (!reduceLastOperator(outputStack, operatorStack.pop() as ComplexOperatorForm)) {
            return null;
          }
        }
        operatorStack.push(operator);
      }
    }

    while (operatorStack.length) {
      if (!reduceLastOperator(outputStack, operatorStack.pop() as ComplexOperatorForm)) {
        return null;
      }
    }

    const expression = outputStack[0];
    if (!expression) {
      return null;
    }

    return {
      mode: 'complex',
      expression,
    };
  }

  private termToNode(term: StatTermForm): SequencerStatNode | null {
    if (term.kind === 'constant') {
      if (!Number.isFinite(term.constantValue)) {
        return null;
      }
      return { kind: 'constant', value: term.constantValue };
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

  private flattenComplexExpression(root: SequencerStatNode): { terms: StatTermForm[]; operators: ComplexOperatorForm[] } {
    const terms: StatTermForm[] = [];
    const operators: ComplexOperatorForm[] = [];

    const visit = (node: SequencerStatNode) => {
      if (node.kind === 'group') {
        visit(node.left);
        operators.push({ op: node.op, precedence: getOperatorPrecedence(node.op) });
        visit(node.right);
        return;
      }

      if (node.kind === 'constant') {
        terms.push({ kind: 'constant', constantValue: node.value, eventIds: [], labelIds: [] });
        return;
      }

      terms.push({
        kind: 'query',
        constantValue: 0,
        eventIds: [...node.query.eventIds],
        labelIds: [...node.query.labelIds],
      });
    };

    visit(root);

    return { terms, operators };
  }

  private buildEmptyQueryTerm(): StatTermForm {
    return { kind: 'query', constantValue: 0, eventIds: [], labelIds: [] };
  }

  private buildEmptyConstantTerm(): StatTermForm {
    return { kind: 'constant', constantValue: 1, eventIds: [], labelIds: [] };
  }
}

function reduceLastOperator(outputStack: SequencerStatNode[], operator: ComplexOperatorForm): boolean {
  const right = outputStack.pop();
  const left = outputStack.pop();
  if (!left || !right) {
    return false;
  }

  outputStack.push({
    kind: 'group',
    left,
    op: operator.op,
    right,
  });

  return true;
}

function getOperatorPrecedence(op: SequencerStatOperator): 1 | 2 {
  return op === '+' || op === '-' ? 1 : 2;
}
