const STEP_DELAY = 16;
const STEPS = 6;

function triggerSequence(
  $el: JQuery<HTMLElement>,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  cy.wrap($el).trigger('mousedown', { button: 0, clientX: startX, clientY: startY, force: true });
  for (let i = 1; i <= STEPS; i++) {
    const progress = i / STEPS;
    cy.wrap($el).trigger('mousemove', {
      clientX: startX + (endX - startX) * progress,
      clientY: startY + (endY - startY) * progress,
      buttons: 1,
      force: true,
    });
    cy.wait(STEP_DELAY);
  }
  cy.wrap($el).trigger('mouseup', { button: 0, force: true });
}

export function dragBy(testId: string, dx: number, dy: number) {
  cy.get(`[data-testid="${testId}"]`).then($el => {
    const rect = $el[0].getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    triggerSequence($el, startX, startY, startX + dx, startY + dy);
  });
}

export function resizeBy(testId: string, dx: number, dy: number) {
  cy.get(`[data-testid="${testId}"]`).then($el => {
    const rect = $el[0].getBoundingClientRect();
    const startX = rect.right - 8;
    const startY = rect.bottom - 8;
    triggerSequence($el, startX, startY, startX + dx, startY + dy);
  });
}
