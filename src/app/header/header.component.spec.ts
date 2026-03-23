import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { AuthSessionService } from '../core/auth/auth-session.service';
import { LayoutEditModeService } from '../core/services/layout-edit-mode.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  const authSessionMock = {
    isAuthenticated: jasmine.createSpy('isAuthenticated'),
    logout: jasmine.createSpy('logout').and.returnValue({ subscribe: () => undefined }),
  };

  const layoutEditModeMock = {
    isEditMode: jasmine.createSpy('isEditMode').and.returnValue(false),
    toggle: jasmine.createSpy('toggle'),
  };

  beforeEach(async () => {
    authSessionMock.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, MatDialogModule, RouterTestingModule],
      providers: [
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: LayoutEditModeService, useValue: layoutEditModeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps edition button visible even when user is anonymous', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Verrouillé');
  });
});
