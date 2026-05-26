import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  const translocoMock = {
    getActiveLang: jasmine.createSpy('getActiveLang'),
    setActiveLang: jasmine.createSpy('setActiveLang'),
  };

  beforeEach(() => {
    translocoMock.getActiveLang.calls.reset();
    translocoMock.getActiveLang.and.returnValue('fr');
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

  it('syncs with an already active supported Transloco language on refresh', () => {
    translocoMock.getActiveLang.and.returnValue('en');
    const service = TestBed.inject(LanguageService);

    service.initLang();

    expect(service.currentLang()).toBe('en');
    expect(service.getCurrentLang()).toBe('en');
    expect(translocoMock.setActiveLang).toHaveBeenCalledWith('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('persists only supported languages', () => {
    const service = TestBed.inject(LanguageService);

    service.setLang('en');

    expect(service.getCurrentLang()).toBe('en');
    expect(document.cookie).toContain('app_lang=en');
    expect(service.isValidLang('de')).toBeFalse();
  });
});
