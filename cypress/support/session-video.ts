/// <reference types="cypress" />

// Synthetic one-second VP8 fixture, looped through the real video player.
export function loadSessionVideo() {
  cy.get('app-video-display input[type=file]').selectFile('cypress/fixtures/session.webm', { force: true });
  return cy.get<HTMLVideoElement>('app-video-display video').should(video => {
    expect(video[0].error?.message, 'video decoder error').to.be.undefined;
    expect(video[0].readyState).to.be.at.least(2);
  }).then(video => {
    video[0].muted = true;
    video[0].loop = true;
    return video[0].play();
  });
}
