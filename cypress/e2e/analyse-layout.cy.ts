import { dragBy, resizeBy } from '../support/drag';

describe('Analyse layout', () => {
  const ensureDirectivePresent = () => {
    cy.get('[data-testid="pane-video"]').then($el => {
      const hasDirective = $el[0].hasAttribute('appanalysispane');
      if (!hasDirective) {
        Cypress.log({ name: 'directive-check', message: 'No drag/resize directive detected' });
        expect(false, 'No drag/resize directive detected').to.be.true;
      }
    });
  };

  beforeEach(() => {
    cy.visit('/analyse');
    ensureDirectivePresent();
  });

  it('drag within bounds', () => {
    cy.get('[data-testid="analysis-container"]').then($container => {
      const containerRect = $container[0].getBoundingClientRect();
      dragBy('pane-video', 300, 120);
      cy.get('[data-testid="pane-video"]').then($pane => {
        const rect = $pane[0].getBoundingClientRect();
        expect(rect.left).to.be.gte(containerRect.left - 1);
        expect(rect.top).to.be.gte(containerRect.top - 1);
        expect(rect.right).to.be.lte(containerRect.right + 1);
        expect(rect.bottom).to.be.lte(containerRect.bottom + 1);
      });
    });
  });

  it('resize within bounds', () => {
    cy.get('[data-testid="analysis-container"]').then($container => {
      const containerRect = $container[0].getBoundingClientRect();
      resizeBy('pane-sequencer', 200, 150);
      cy.get('[data-testid="pane-sequencer"]').then($pane => {
        const rect = $pane[0].getBoundingClientRect();
        expect(rect.right).to.be.lte(containerRect.right + 1);
        expect(rect.bottom).to.be.lte(containerRect.bottom + 1);
        expect(rect.width).to.be.gte(160);
        expect(rect.height).to.be.gte(120);
      });
    });
  });

  it('edge clamp prevents escape', () => {
    cy.get('[data-testid="analysis-container"]').then($container => {
      const containerRect = $container[0].getBoundingClientRect();
      dragBy('pane-timeline', -2000, -2000);
      dragBy('pane-timeline', 2000, 2000);
      cy.get('[data-testid="pane-timeline"]').then($pane => {
        const rect = $pane[0].getBoundingClientRect();
        expect(rect.left).to.be.gte(containerRect.left - 1);
        expect(rect.top).to.be.gte(containerRect.top - 1);
        expect(rect.right).to.be.lte(containerRect.right + 1);
        expect(rect.bottom).to.be.lte(containerRect.bottom + 1);
      });
    });
  });

  it('avoids near-complete overlap', () => {
    cy.get('[data-testid="analysis-container"]').then($container => {
      const containerRect = $container[0].getBoundingClientRect();
      dragBy('pane-timeline', -(containerRect.width / 2), -(containerRect.height / 2));
      cy.get('[data-testid="pane-video"]').then($video => {
        const videoRect = $video[0].getBoundingClientRect();
        cy.get('[data-testid="pane-timeline"]').then($timeline => {
          const timelineRect = $timeline[0].getBoundingClientRect();
          const intersection = computeIntersection(videoRect, timelineRect);
          const minArea = Math.min(area(videoRect), area(timelineRect));
          expect(intersection / minArea).to.be.lessThan(0.9);
        });
      });
    });
  });
});

function computeIntersection(a: DOMRect, b: DOMRect) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  return width * height;
}

function area(rect: DOMRect) {
  return rect.width * rect.height;
}
