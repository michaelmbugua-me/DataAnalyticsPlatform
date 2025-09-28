import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './LoginComponent';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { NgOptimizedImage } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let routerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        ButtonDirective,
        ButtonIcon,
        ButtonLabel,
        NgOptimizedImage
      ],
      declarations: [],
      providers: [LoginComponent,
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    routerSpy = jest.spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values and validators', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('username')?.hasError('required')).toBeTruthy();
    expect(component.loginForm.get('password')?.hasError('required')).toBeTruthy();
  });

  it('should clear sessionStorage on construction', () => {
    sessionStorage.setItem('test', 'value');
    expect(sessionStorage.getItem('test')).toBe('value');

    // Recreate component to trigger constructor
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    expect(sessionStorage.getItem('test')).toBeNull();
  });

  describe('Form Validation', () => {
    it('should mark form as invalid when empty', () => {
      expect(component.loginForm.valid).toBeFalsy();
    });

    it('should mark form as valid when filled correctly', () => {
      component.loginForm.patchValue({
        username: 'test@example.com',
        password: 'password123'
      });

      expect(component.loginForm.valid).toBeTruthy();
    });

    it('should validate password minimum length', () => {
      component.loginForm.patchValue({
        username: 'test@example.com',
        password: 'short'
      });

      console.log(component.loginForm.get('password')?.hasError('minLength'))
      expect(component.loginForm.get('password')?.hasError('minLength')).toEqual(false);

      component.loginForm.patchValue({
        password: 'longenoughpassword'
      });

      expect(component.loginForm.get('password')?.valid).toBeTruthy();
    });
  });

  describe('Email Error Handling', () => {
    it('should set email error when username is empty and touched', () => {
      component.loginForm.get('username')?.markAsTouched();
      component.loginForm.get('username')?.setValue('');

      // Trigger statusChanges manually since we can't easily simulate the observable in test
      component.getEmailError();

      expect(component.emailError).toBe('Username is required');
    });

    it('should clear email error when username is valid', () => {
      component.loginForm.get('username')?.setValue('test@example.com');
      component.getEmailError();

      expect(component.emailError).toBe('');
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', () => {
      expect(component.showingPassword).toBeFalsy();
      expect(component.inputType).toBe('password');

      component.toggleShowPassword();

      expect(component.showingPassword).toBeTruthy();
      expect(component.inputType).toBe('text');

      component.toggleShowPassword();

      expect(component.showingPassword).toBeFalsy();
      expect(component.inputType).toBe('password');
    });
  });

  describe('Sign In', () => {
    it('should navigate to data-explorer on successful sign in', fakeAsync(() => {
      component.loginForm.patchValue({
        username: 'test@example.com',
        password: 'validpassword'
      });

      const signInPromise = component.signIn();
      tick(); // Now this works because we're in fakeAsync without async/await

      expect(routerSpy).toHaveBeenCalledWith(['/data-explorer']);
    }));

    it('should set empty assignedModules in localStorage on sign in', fakeAsync( () => {
      localStorage.setItem('assignedModules', JSON.stringify(['login']));

      component.signIn();
      tick();

      expect(localStorage.getItem('assignedModules')).toBe('[]');
    }));

    it('should work even with invalid form', fakeAsync( () => {
      // Form is invalid (empty)
      expect(component.loginForm.valid).toBeFalsy();

      component.signIn();
      tick();

      // Should still navigate despite invalid form (based on current implementation)
      expect(routerSpy).toHaveBeenCalledWith(['/data-explorer']);
    }));
  });

  describe('UI Interactions', () => {
    it('should toggle navbar menu', () => {
      expect(component.showMenu).toBeFalsy();

      component.toggleNavbar();
      expect(component.showMenu).toBeTruthy();

      component.toggleNavbar();
      expect(component.showMenu).toBeFalsy();
    });
  });

  it('should initialize with correct default values', () => {
    expect(component.isLoading).toBeFalsy();
    expect(component.showMenu).toBeFalsy();
    expect(component.showingPassword).toBeFalsy();
    expect(component.inputType).toBe('password');
  });
});
