import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SequencerPanelService } from '../service/sequencer-panel.service';
import { TimelineFacadeService } from './timeline-facade.service';
import { SequencerStatsService, formatStatValue } from './sequencer-stats.service';

class MockSequencerPanelService {
  readonly btnList = signal([
    {
      id: 'stat-simple-events',
      name: 'Simple events',
      type: 'stat' as const,
      stat: { mode: 'simple' as const, query: { eventIds: ['evt_shot'], labelIds: [], metric: 'count' as const, labelMatch: 'all' as const } },
    },
    {
      id: 'stat-simple-labels',
      name: 'Simple labels',
      type: 'stat' as const,
      stat: { mode: 'simple' as const, query: { eventIds: ['evt_shot'], labelIds: ['lbl_on_target'], metric: 'count' as const, labelMatch: 'all' as const } },
    },
    {
      id: 'stat-complex',
      name: 'Complex',
      type: 'stat' as const,
      stat: {
        mode: 'complex' as const,
        expression: {
          kind: 'group' as const,
          op: '/',
          left: {
            kind: 'group' as const,
            op: '+',
            left: { kind: 'query' as const, query: { eventIds: ['evt_shot'], labelIds: ['lbl_on_target'], metric: 'count' as const, labelMatch: 'all' as const } },
            right: { kind: 'constant' as const, value: 1 },
          },
          right: { kind: 'query' as const, query: { eventIds: ['evt_possession'], labelIds: [], metric: 'count' as const, labelMatch: 'all' as const } },
        },
      },
    },
    {
      id: 'stat-div-zero',
      name: 'Div zero',
      type: 'stat' as const,
      stat: {
        mode: 'complex' as const,
        expression: {
          kind: 'group' as const,
          op: '/',
          left: { kind: 'constant' as const, value: 8 },
          right: { kind: 'constant' as const, value: 0 },
        },
      },
    },
  ]);
}

class MockTimelineFacadeService {
  readonly occurrences = signal([
    { eventDefId: 'evt_shot', labelIds: ['lbl_on_target'] },
    { eventDefId: 'evt_shot', labelIds: [] },
    { eventDefId: 'evt_shot', labelIds: ['lbl_on_target', 'lbl_left'] },
    { eventDefId: 'evt_possession', labelIds: [] },
    { eventDefId: 'evt_possession', labelIds: [] },
  ]);
}

describe('SequencerStatsService', () => {
  let service: SequencerStatsService;
  let timeline: MockTimelineFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SequencerStatsService,
        { provide: SequencerPanelService, useClass: MockSequencerPanelService },
        { provide: TimelineFacadeService, useClass: MockTimelineFacadeService },
      ],
    });

    service = TestBed.inject(SequencerStatsService);
    timeline = TestBed.inject(TimelineFacadeService) as unknown as MockTimelineFacadeService;
  });

  it('counts simple query on event only', () => {
    expect(service.valueByStatId()['stat-simple-events']).toBe(3);
  });

  it('counts simple query on event + labels(all)', () => {
    expect(service.valueByStatId()['stat-simple-labels']).toBe(2);
  });

  it('returns zero when no results', () => {
    const result = service.evaluateDefinition(
      { mode: 'simple', query: { eventIds: ['evt_missing'], labelIds: [], metric: 'count', labelMatch: 'all' } },
      timeline.occurrences(),
    );
    expect(result).toBe(0);
  });

  it('evaluates complex expression with constants and multiple operations', () => {
    expect(service.valueByStatId()['stat-complex']).toBe(1.5);
  });

  it('supports priority through expression tree', () => {
    const result = service.evaluateDefinition(
      {
        mode: 'complex',
        expression: {
          kind: 'group',
          op: '+',
          left: { kind: 'constant', value: 1 },
          right: {
            kind: 'group',
            op: '*',
            left: { kind: 'constant', value: 2 },
            right: { kind: 'constant', value: 3 },
          },
        },
      },
      timeline.occurrences(),
    );

    expect(result).toBe(7);
  });

  it('returns null on division by zero and displays em dash', () => {
    expect(service.valueByStatId()['stat-div-zero']).toBeNull();
    expect(service.getDisplayValue('stat-div-zero')).toBe('—');
  });

  it('recalculates live when analysis occurrences change', () => {
    timeline.occurrences.set([...timeline.occurrences(), { eventDefId: 'evt_shot', labelIds: [] }]);
    expect(service.valueByStatId()['stat-simple-events']).toBe(4);
  });

  it('formats display values with max 2 decimals', () => {
    expect(formatStatValue(4)).toBe('4');
    expect(formatStatValue(1.236)).toBe('1.24');
  });
});
