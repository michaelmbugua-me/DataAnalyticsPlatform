import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {NgOptimizedImage} from '@angular/common';


@Component({
  selector: 'app-login',
  templateUrl: 'LoginComponent.html',
  styleUrl: 'LoginComponent.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ButtonIcon,
    ButtonLabel,
    ButtonDirective,
    NgOptimizedImage,
  ]
})
export class LoginComponent implements OnInit {
  public isLoading = false;

  showMenu = false;
  loginForm!: FormGroup
  emailError!: string;

  public showingPassword = false;
  inputType = 'password';

  portalVersion: any;


  constructor(private router: Router) {
    sessionStorage.clear();
  }

  toggleNavbar() {
    this.showMenu = !this.showMenu;
  }

  ngOnInit() {


    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });

    this.loginForm.get('username')?.statusChanges.subscribe(status => {
      if (status === 'INVALID' && this.loginForm.get('username')?.touched) {
        this.emailError = this.getEmailError();
      } else {
        this.emailError = '';
      }
    });
  }

  getEmailError() {
    return this.loginForm.get('username')?.hasError('required') ? 'Username is required' : this.loginForm.get('username')?.hasError('username') ? 'Please enter a valid username address' : '';
  }

  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    if (this.showingPassword) {
      this.inputType = 'text';
    } else {
      this.inputType = 'password';
    }
  }


  async signIn(): Promise<void> {

    localStorage.setItem('assignedModules', JSON.stringify([]));
    this.router.navigate(['/dashboard']);

  }

}
