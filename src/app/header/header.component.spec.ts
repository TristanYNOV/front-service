import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { AuthSessionService } from '../core/auth/auth-session.service';
import { LayoutEditModeService } from '../core/services/layout-edit-mode.service';

describe('HeaderComponent', () => {
  @Component({
    standalone: true,
    template: '',
  })
  class DummyRouteComponent {}

  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;

  const authSessionMock = {
    isAuthenticated: jasmine.createSpy('isAuthenticated'),
    logout: jasmine.createSpy('logout').and.returnValue({ subscribe: () => undefined }),
    deleteAccount: jasmine.createSpy('deleteAccount'),
  };

  const layoutEditModeMock = {
    isEditMode: jasmine.createSpy('isEditMode').and.returnValue(false),
    toggle: jasmine.createSpy('toggle'),
  };

  beforeEach(async () => {
    authSessionMock.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        MatDialogModule,
        DummyRouteComponent,
        RouterTestingModule.withRoutes([
          { path: '', component: DummyRouteComponent },
          { path: 'tarifs', component: DummyRouteComponent },
        ]),
      ],
      providers: [
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: LayoutEditModeService, useValue: layoutEditModeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps public navigation visible for crawlers', () => {
    const root = fixture.nativeElement as HTMLElement;
    const anchors = Array.from(root.querySelectorAll('a')).map(anchor =>
      anchor.getAttribute('href')
    );

    expect(anchors).toContain('/');
    expect(anchors).toContain('/fonctionnalites');
    expect(anchors).toContain('/tarifs');
    expect(anchors).toContain('/faq');
    expect(anchors).toContain('/contact');
  });

  it('marks the current public route as active', fakeAsync(() => {
    router.navigateByUrl('/tarifs');
    tick();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const pricingLink = root.querySelector<HTMLAnchorElement>('a[href="/tarifs"]');

    expect(pricingLink?.classList).toContain('public-nav-link--active');
  }));
});
