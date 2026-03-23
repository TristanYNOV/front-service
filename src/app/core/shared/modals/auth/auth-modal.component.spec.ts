import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AuthModalComponent } from './auth-modal.component';
import { AuthSessionService } from '../../../auth/auth-session.service';

describe('AuthModalComponent', () => {
  let fixture: ComponentFixture<AuthModalComponent>;
  let component: AuthModalComponent;

  const authSessionMock = {
    login: jasmine.createSpy('login').and.returnValue(of({ id: '1', pseudo: 'coach', email: 'coach@ab.fr' })),
    register: jasmine.createSpy('register').and.returnValue(of({ id: '2', pseudo: 'rookie', email: 'rookie@ab.fr' })),
  };

  const dialogRefMock = {
    close: jasmine.createSpy('close'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthModalComponent],
      providers: [
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: { type: 'login' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    authSessionMock.login.calls.reset();
    authSessionMock.register.calls.reset();
    dialogRefMock.close.calls.reset();
  });

  it('closes modal after successful login', fakeAsync(() => {
    component.form.setValue({ pseudo: '', email: 'coach@ab.fr', password: 'Password1!' });

    component.submit();
    tick();

    expect(authSessionMock.login).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalled();
  }));

  it('closes modal after successful register', fakeAsync(() => {
    component.toggleMode();
    component.form.setValue({ pseudo: 'rookie', email: 'rookie@ab.fr', password: 'Password1!' });

    component.submit();
    tick();

    expect(authSessionMock.register).toHaveBeenCalledWith('rookie@ab.fr', 'Password1!', 'rookie');
    expect(dialogRefMock.close).toHaveBeenCalled();
  }));
});
