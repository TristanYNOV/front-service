import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let documentRef: Document;

  beforeEach(() => {
    clearThemeCookie();
    document.documentElement.removeAttribute('data-theme');

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DOCUMENT, useValue: document },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(ThemeService);
    documentRef = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    clearThemeCookie();
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies classic by default', () => {
    service.initTheme();

    expect(service.getTheme()).toBe('classic');
    expect(documentRef.documentElement.getAttribute('data-theme')).toBe('classic');
  });

  it('restores a valid theme from the cookie', () => {
    document.cookie = 'ab_theme=dynamic; Path=/; SameSite=Lax';

    service.initTheme();

    expect(service.getTheme()).toBe('dynamic');
    expect(documentRef.documentElement.getAttribute('data-theme')).toBe('dynamic');
  });

  it('falls back to classic when the cookie is invalid', () => {
    document.cookie = 'ab_theme=unknown; Path=/; SameSite=Lax';

    service.initTheme();

    expect(service.getTheme()).toBe('classic');
    expect(documentRef.documentElement.getAttribute('data-theme')).toBe('classic');
  });

  it('updates html data-theme and stores the browser cookie', () => {
    service.setTheme('verdant');

    expect(service.getTheme()).toBe('verdant');
    expect(documentRef.documentElement.getAttribute('data-theme')).toBe('verdant');
    expect(document.cookie).toContain('ab_theme=verdant');
  });

  it('validates known themes only', () => {
    expect(service.isValidTheme('oriental')).toBeTrue();
    expect(service.isValidTheme('unknown')).toBeFalse();
    expect(service.isValidTheme(null)).toBeFalse();
  });
});

function clearThemeCookie(): void {
  document.cookie = 'ab_theme=; Max-Age=0; Path=/; SameSite=Lax';
}
