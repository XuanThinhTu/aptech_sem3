import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../services/auth-api.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: '../styles/auth-pages.css',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly currentStep = signal<'register' | 'otp'>('register');
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly usernameMessage = signal('');
  protected readonly mobileMessage = signal('');

  protected readonly registerForm = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly otpForm = this.fb.nonNullable.group({
    otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected checkUsername() {
    const username = this.registerForm.controls.username.getRawValue().trim();
    if (!username) {
      this.usernameMessage.set('');
      return;
    }

    this.authApi.checkUsername(username).subscribe({
      next: (response) => this.usernameMessage.set(response.message),
      error: (error: HttpErrorResponse) =>
        this.usernameMessage.set(
          error.error?.message ?? 'Unable to validate username right now.',
        ),
    });
  }

  protected checkMobileNumber() {
    const mobileNumber = this.registerForm.controls.mobileNumber.getRawValue().trim();
    if (!mobileNumber) {
      this.mobileMessage.set('');
      return;
    }

    this.authApi.checkMobile(mobileNumber).subscribe({
      next: (response) => this.mobileMessage.set(response.message),
      error: (error: HttpErrorResponse) =>
        this.mobileMessage.set(
          error.error?.message ?? 'Unable to validate mobile number right now.',
        ),
    });
  }

  protected requestOtp() {
    console.log('1')
    if (this.registerForm.invalid) {
          console.log(this.registerForm)

      this.registerForm.markAllAsTouched();
      return;
    }

    if (
      this.registerForm.controls.password.getRawValue() !==
      this.registerForm.controls.confirmPassword.getRawValue()

    ) {
      console.log('3')
      this.errorMessage.set('Password and confirm password do not match.');
      return;
    }

    console.log('4')
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    const { username, email, mobileNumber, password } = this.registerForm.getRawValue();

    this.authApi
      .requestRegisterOtp({ username, email, mobileNumber, password })
      .subscribe({
        next: (response) => {
          this.currentStep.set('otp');
          this.statusMessage.set(
            `${response.message} Please check your inbox and enter the 6-digit code to continue.`,
          );
          this.isSubmitting.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Unable to send the verification code. Please try again.',
          );
          this.isSubmitting.set(false);
        },
      });
  }

  protected verifyOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    this.authApi
      .verifyRegisterOtp({
        email: this.registerForm.controls.email.getRawValue(),
        otpCode: this.otpForm.controls.otpCode.getRawValue(),
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.router.navigate(['/login'], {
            queryParams: { registered: '1', email: response.user.email },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'OTP verification failed. Please try again.',
          );
          this.isSubmitting.set(false);
        },
      });
  }

  protected goBack() {
    this.currentStep.set('register');
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.otpForm.reset();
  }
}
