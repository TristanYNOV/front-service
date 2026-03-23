import { routes } from './app.routes';

describe('App routes auth policy', () => {
  it('keeps only explicit public allowlist', () => {
    const publicRoutes = routes.filter(route => !route.canActivate || route.canActivate.length === 0).map(route => route.path);

    expect(publicRoutes).toEqual(['', 'discover', '**']);
  });

  it('protects all business routes with authGuard by default', () => {
    const privatePaths = ['welcome', 'club', 'teams', 'players', 'tournaments', 'matchs', 'analyse'];

    privatePaths.forEach(path => {
      const route = routes.find(candidate => candidate.path === path);
      expect(route).toBeDefined();
      expect(route?.canActivate?.length).toBeGreaterThan(0);
    });
  });
});
