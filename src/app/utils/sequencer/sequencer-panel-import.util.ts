import { SequencerPanelV1 } from '../../interfaces/analysis-store';
import { SequencerPanel } from '../../interfaces/sequencer-panel.interface';

export function hasImportDataLoss(currentPanel: SequencerPanel, nextPanel: SequencerPanelV1): boolean {
  if (!currentPanel.btnList.length) {
    return false;
  }

  const nextIds = new Set(nextPanel.btnList.map(btn => btn.id));
  return currentPanel.btnList.some(btn => !nextIds.has(btn.id));
}
