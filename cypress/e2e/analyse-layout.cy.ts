import { dragBy, resizeBy, resizeSide } from '../support/drag';

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

  it('exposes drag handle and z-index controls', () => {
    cy.get('[data-testid="pane-video"]').within(() => {
      cy.get('.rzr-handle-top-left').should('exist');
      cy.get('.rzr-handle-bottom-right').should('exist');
      cy.get('.rzr-handle-top').should('exist');
      cy.get('.rzr-handle-right').should('exist');
      cy.get('.rzr-zup').should('exist');
      cy.get('.rzr-zdown').should('exist');
    });
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

  it('z-index buttons clamp to limits', () => {
    cy.get('[data-testid="pane-video"]').within(() => {
      cy.get('.rzr-zup').click().click().click();
      cy.get('.rzr-zdown').click();
    });
    cy.get('[data-testid="pane-video"]').then($pane => {
      const z = Number.parseInt(getComputedStyle($pane[0]).zIndex || '0', 10);
      expect(z).to.be.within(1, 10);
    });
  });

  it('aspect ratio lock keeps video near 16/9 when resizing', () => {
    resizeBy('pane-video', 200, 200);
    cy.get('[data-testid="pane-video"]').then($pane => {
      const rect = $pane[0].getBoundingClientRect();
      const ratio = rect.width / rect.height;
      expect(ratio).to.be.closeTo(16 / 9, 0.05);
    });
  });

  it('side resize adjusts with ratio preserved', () => {
    resizeSide('pane-video', '.rzr-handle-right', 120, 0);
    cy.get('[data-testid="pane-video"]').then($pane => {
      const rect = $pane[0].getBoundingClientRect();
      const ratio = rect.width / rect.height;
      expect(ratio).to.be.closeTo(16 / 9, 0.05);
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
