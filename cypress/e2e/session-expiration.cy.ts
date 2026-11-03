/// <reference types="cypress" />
import { loadSessionVideo } from '../support/session-video';

// Browser E2E with deterministic API responses. The real Angular app, session
// service, interceptor chain, workspace and reconnect modal are exercised.
describe('Analysis session expiration', () => {
  let refreshCalls: number;
  let rejectRefresh: boolean;
  let rejectSave: boolean;
  let expiresAt: number;
  const user = { id: 'session-owner', pseudo: 'Coach', email: 'coach@example.com' };
  const token = (serial: number) => `e30.${btoa(JSON.stringify({ sub: user.id, serial }))}.test-signature`;

  beforeEach(() => {
    refreshCalls = 0;
    rejectRefresh = false;
    rejectSave = false;
    expiresAt = Infinity;
    cy.viewport(1440, 1000);
    cy.intercept('POST', '**/auth/refresh', req => {
      refreshCalls++;
      req.reply(rejectRefresh ? { statusCode: 401, body: {} } : { body: { accessToken: token(refreshCalls) } });
    }).as('refresh');
    cy.intercept('POST', '**/auth/login', { accessToken: token(0) }).as('login');
    cy.intercept('GET', '**/me', user).as('me');
    cy.intercept('GET', '**/api/license/validate', { valid: true });
    cy.intercept('POST', '**/analysis/api/imports/timelines/validate', req => {
      req.reply({ valid: true, normalizedPayload: req.body });
    }).as('import');
    cy.intercept({ method: '+(POST|PATCH)', url: /\/analysis\/api\/timelines(?:\/[^?]*)?(?:\?.*)?$/ }, req => {
      if (rejectSave || (Date.now() >= expiresAt && refreshCalls === 1)) {
        rejectSave = false;
        req.reply({ statusCode: 401, body: {} });
      } else {
        expect(req.headers['authorization']).to.match(/^Bearer /);
        expect(JSON.parse(atob(String(req.headers['authorization']).split('.')[1])).sub).to.eq(user.id);
        req.reply({
          id: 'saved-analysis', ownerUserId: user.id, title: req.body.title,
          contentJson: req.body.contentJson, description: null, visibility: 'private',
          clubId: null, hasAnonymizedContent: false,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
      }
    }).as('save');
    cy.visit('/analyse');
    cy.wait('@refresh');
    cy.wait('@me');
    cy.get('app-timeline input[type=file]').selectFile('cypress/fixtures/session-timeline.json', { force: true });
    cy.wait('@import');
    cy.get('app-timeline').should('contain.text', 'Match Timeline');
  });

  function save() {
    cy.get('app-timeline button').filter(':has(mat-icon)').filter((_, el) => el.textContent?.trim() === 'save').click({ force: true });
  }

  it('saves with a valid token without refreshing', () => {
    save();
    cy.wait('@save').its('response.statusCode').should('eq', 200);
    cy.then(() => expect(refreshCalls).to.eq(1));
  });

  it('refreshes once after expiration and preserves the imported analysis', () => {
    loadSessionVideo();
    cy.get('app-video-display video').invoke('attr', 'src').as('videoSource');
    cy.then(() => { rejectSave = true; });
    save();
    cy.wait('@save').its('response.statusCode').should('eq', 401);
    cy.wait('@refresh');
    cy.wait('@save').then(({ request, response }) => {
      expect(request.headers['authorization']).to.eq(`Bearer ${token(2)}`);
      expect(request.body.contentJson.occurrences).to.have.length.greaterThan(0);
      expect(response?.statusCode).to.eq(200);
    });
    cy.location('pathname').should('eq', '/analyse');
    cy.get('app-timeline').should('contain.text', 'Match Timeline');
    cy.get('[data-testid=session-expired]').should('not.exist');
    cy.get('@videoSource').then(source => {
      cy.get('app-video-display video').should('have.attr', 'src', source);
    });
  });

  it('keeps the draft when refresh is revoked and resumes after login', () => {
    cy.then(() => { rejectSave = true; rejectRefresh = true; });
    save();
    cy.wait('@save');
    cy.wait('@refresh').its('response.statusCode').should('eq', 401);
    cy.get('[data-testid=session-expired]').should('be.visible');
    cy.get('app-timeline').should('contain.text', 'Match Timeline');
    cy.location('pathname').should('eq', '/analyse');
    cy.get('app-timeline button').filter((_, el) => el.textContent?.trim() === 'more_vert').click({ force: true });
    cy.contains('button', 'Exporter').click();
    cy.readFile('tmp/cypress-downloads/Match Timeline.json').then(payload => {
      expect(payload.occurrences).to.have.length.greaterThan(0);
    });
    cy.get('[data-testid=session-expired] button').click();
    cy.get('input[formcontrolname=email]').clear().type(user.email, { delay: 80 }).should('have.value', user.email);
    cy.get('input[formcontrolname=password]').type('test-password', { log: false });
    cy.get('app-auth-modal button[type=submit]').should('not.be.disabled').click();
    cy.wait('@login');
    cy.wait('@me');
    cy.get('[data-testid=session-expired]').should('not.exist');
    cy.location('pathname').should('eq', '/analyse');
    save();
    cy.wait('@save').then(({ request }) => expect(request.body.contentJson.occurrences).to.have.length.greaterThan(0));
  });

  it('restores authentication on a page reload', () => {
    cy.reload();
    cy.wait('@refresh');
    cy.wait('@me');
    cy.location('pathname').should('eq', '/analyse');
    cy.get('[data-testid=session-expired]').should('not.exist');
    cy.then(() => expect(refreshCalls).to.eq(2));
  });

  it('renews two independent Angular contexts without clearing either draft', () => {
    // A same-origin iframe supplies a second app instance, like a second tab.
    // API fixtures do not model server-side cookie rotation between contexts.
    cy.document().then(doc => {
      const frame = doc.createElement('iframe');
      frame.dataset['testid'] = 'second-session';
      frame.src = '/analyse';
      frame.style.cssText = 'position:fixed;inset:0;width:1440px;height:1000px;z-index:-1';
      doc.body.append(frame);
    });
    cy.wait('@refresh');
    cy.wait('@me');
    const secondBody = () => cy.get<HTMLIFrameElement>('[data-testid=second-session]')
      .its('0.contentDocument.body').should('not.be.empty').then(cy.wrap);
    secondBody().find('app-timeline input[type=file]')
      .selectFile('cypress/fixtures/session-timeline.json', { force: true });
    cy.wait('@import');
    cy.then(() => { rejectSave = true; });
    save();
    cy.wait('@save');
    cy.wait('@refresh');
    cy.wait('@save').its('response.statusCode').should('eq', 200);
    cy.then(() => { rejectSave = true; });
    secondBody().find('app-timeline button').filter((_, el) => el.textContent?.trim() === 'save').click({ force: true });
    cy.wait('@save');
    cy.wait('@refresh');
    cy.wait('@save').its('response.statusCode').should('eq', 200);
    secondBody().find('app-timeline').should('contain.text', 'Match Timeline');
    cy.get('app-timeline').should('contain.text', 'Match Timeline');
    cy.get('[data-testid=session-expired]').should('not.exist');
    cy.then(() => expect(refreshCalls).to.eq(4));
    cy.get('[data-testid=second-session]').invoke('remove');
  });

  const soakMs = Number(Cypress.env('SESSION_SOAK_MS') || 0);
  if (soakMs > 0) {
    it(`keeps a video analysis usable for ${soakMs} real milliseconds`, () => {
      loadSessionVideo();
      cy.get('app-video-display video').invoke('attr', 'src').as('videoSource');
      cy.then(() => { expiresAt = Date.now() + soakMs - 1000; });
      // Real time: do not install cy.clock(). The API fixture rejects the old
      // token at the final checkpoint, exercising refresh after the soak.
      for (let elapsed = 0; elapsed < soakMs; elapsed += 30000) {
        cy.wait(Math.min(30000, soakMs - elapsed));
        save();
        cy.wait('@save').then(({ response }) => {
          if (response?.statusCode === 401) {
            cy.wait('@refresh');
            cy.wait('@save').its('response.statusCode').should('eq', 200);
          } else expect(response?.statusCode).to.eq(200);
        });
        cy.get<HTMLVideoElement>('app-video-display video').should(video => {
          expect(video[0].paused).to.be.false;
          expect(video[0].error).to.be.null;
        });
        cy.get('app-timeline').should('contain.text', 'Match Timeline');
        cy.task('sessionCheckpoint', Math.min(elapsed + 30000, soakMs));
      }
      cy.then(() => expect(refreshCalls).to.eq(2));
      cy.get('@videoSource').then(source => cy.get('app-video-display video').should('have.attr', 'src', source));
    });
  }
});



