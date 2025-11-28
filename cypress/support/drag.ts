const STEP_DELAY = 16;
const STEPS = 8;

function triggerSequence(target: HTMLElement, startX: number, startY: number, endX: number, endY: number) {
  cy.wrap(target).trigger('pointerdown', { button: 0, clientX: startX, clientY: startY, force: true });
  for (let i = 1; i <= STEPS; i++) {
    const progress = i / STEPS;
    cy.wrap(target).trigger('pointermove', {
      clientX: startX + (endX - startX) * progress,
      clientY: startY + (endY - startY) * progress,
      buttons: 1,
      force: true,
    });
    cy.wait(STEP_DELAY);
  }
  cy.wrap(target).trigger('pointerup', { button: 0, force: true });
}

function pickHandle($pane: JQuery<HTMLElement>, selector: string) {
  const handle = $pane[0].querySelector(selector);
  expect(handle, `Handle ${selector} not found`).to.exist;
  return handle as HTMLElement;
}

export function dragBy(testId: string, dx: number, dy: number) {
  cy.get(`[data-testid="${testId}"]`).then($el => {
    const handle = pickHandle($el, '.rzr-handle-top-left');
    const rect = handle.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    triggerSequence(handle, startX, startY, startX + dx, startY + dy);
  });
}

export function resizeBy(testId: string, dx: number, dy: number) {
  cy.get(`[data-testid="${testId}"]`).then($el => {
    const handle = pickHandle($el, '.rzr-handle-bottom-right');
    const rect = handle.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    triggerSequence(handle, startX, startY, startX + dx, startY + dy);
  });
}

export function resizeSide(testId: string, selector: string, dx: number, dy: number) {
  cy.get(`[data-testid="${testId}"]`).then($el => {
    const handle = pickHandle($el, selector);
    const rect = handle.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    triggerSequence(handle, startX, startY, startX + dx, startY + dy);
  });
}
