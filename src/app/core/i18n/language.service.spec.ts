import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  const translocoMock = {
    setActiveLang: jasmine.createSpy('setActiveLang'),
  };

  beforeEach(() => {
    translocoMock.setActiveLang.calls.reset();
    document.cookie = 'app_lang=; Max-Age=0; Path=/';

    TestBed.configureTestingModule({
      providers: [{ provide: TranslocoService, useValue: translocoMock }],
    });
  });

  it('uses French by default', () => {
    const service = TestBed.inject(LanguageService);

    service.initLang();

    expect(service.getCurrentLang()).toBe('fr');
    expect(translocoMock.setActiveLang).toHaveBeenCalledWith('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('persists only supported languages', () => {
    const service = TestBed.inject(LanguageService);

    service.setLang('en');

    expect(service.getCurrentLang()).toBe('en');
    expect(document.cookie).toContain('app_lang=en');
    expect(service.isValidLang('de')).toBeFalse();
  });
});
