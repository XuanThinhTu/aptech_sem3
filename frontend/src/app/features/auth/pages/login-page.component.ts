import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { AuthApiService } from '../services/auth-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: '../styles/auth-pages.css',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);

  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly loginResult = signal('');
  protected readonly isSubmitting = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('registered') === '1') {
        const email = params.get('email') ?? '';
        this.successMessage.set(
          `Registration successful. ${email ? `You can now sign in with ${email}.` : 'You can sign in now.'}`,
        );
        if (email) {
          this.loginForm.patchValue({ identifier: email });
        }
      }
    });
  }

  protected login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.loginResult.set('');

    this.authApi.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.authState.setUser(response.user);
        this.loginResult.set(
          `Welcome back, ${response.user.username}. You are signed in as ${response.user.role}.`,
        );
        this.isSubmitting.set(false);
        const destination =
          response.user.role === 'admin' || response.user.role === 'superadmin'
            ? '/dashboard'
            : '/';
        this.router.navigate([destination]);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'Sign in failed. Please check your details and try again.',
        );
        this.isSubmitting.set(false);
      },
    });
  }
}
