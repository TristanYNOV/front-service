import { Injectable, computed, inject } from '@angular/core';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { TimelineFacadeService } from './timeline-facade.service';
import { SequencerStatDefinition, SequencerStatNode, SequencerStatOperator, SequencerStatQuery } from '../../interfaces/sequencer-btn.interface';

@Injectable({ providedIn: 'root' })
export class SequencerStatsService {
  private readonly panelService = inject(SequencerPanelService);
  private readonly timelineFacade = inject(TimelineFacadeService);

  readonly valueByStatId = computed<Record<string, number | null>>(() => {
    const stats = this.panelService.btnList().filter(btn => btn.type === 'stat');
    const occurrences = this.timelineFacade.occurrences();

    return stats.reduce<Record<string, number | null>>((acc, statBtn) => {
      acc[statBtn.id] = this.evaluateDefinition(statBtn.stat, occurrences);
      return acc;
    }, {});
  });

  readonly exportRows = computed(() =>
    this.panelService
      .btnList()
      .filter(btn => btn.type === 'stat')
      .map(btn => ({
        id: btn.id,
        name: btn.name,
        value: this.valueByStatId()[btn.id] ?? null,
        definition: btn.stat,
      })),
  );

  getDisplayValue(btnId: string): string {
    const value = this.valueByStatId()[btnId] ?? null;
    return formatStatValue(value);
  }

  evaluateDefinition(definition: SequencerStatDefinition, occurrences: { eventDefId: string; labelIds: string[] }[]): number | null {
    if (definition.mode === 'simple') {
      return this.evaluateSimpleQuery(definition.query, occurrences);
    }
    return this.evaluateNode(definition.expression, occurrences);
  }

  private evaluateNode(node: SequencerStatNode, occurrences: { eventDefId: string; labelIds: string[] }[]): number | null {
    if (node.kind === 'constant') {
      return node.value;
    }

    if (node.kind === 'query') {
      return this.evaluateSimpleQuery(node.query, occurrences);
    }

    const left = this.evaluateNode(node.left, occurrences);
    const right = this.evaluateNode(node.right, occurrences);

    if (left === null || right === null || Number.isNaN(left) || Number.isNaN(right)) {
      return null;
    }

    return applyOperator(left, right, node.op);
  }

  private evaluateSimpleQuery(query: SequencerStatQuery, occurrences: { eventDefId: string; labelIds: string[] }[]): number {
    const eventIds = new Set(query.eventIds);
    if (!eventIds.size) {
      return 0;
    }

    const selectedLabelIds = new Set(query.labelIds);

    return occurrences.filter(occurrence => {
      if (!eventIds.has(occurrence.eventDefId)) {
        return false;
      }

      if (!selectedLabelIds.size) {
        return true;
      }

      const labels = new Set(occurrence.labelIds);
      return [...selectedLabelIds].every(labelId => labels.has(labelId));
    }).length;
  }
}

function applyOperator(left: number, right: number, op: SequencerStatOperator): number | null {
  if (op === '+') {
    return left + right;
  }
  if (op === '-') {
    return left - right;
  }
  if (op === '*') {
    return left * right;
  }
  if (op === '/') {
    if (right === 0) {
      return null;
    }
    return left / right;
  }

  return null;
}

export function formatStatValue(value: number | null): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return '—';
  }

  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) {
    return `${rounded}`;
  }

  return `${rounded}`;
}
