import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule, // <--- THÊM FormsModule VÀO ĐÂY
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { SiteLayoutComponent } from '../../../layout/site-layout.component';
import {
  ProfileApiService,
  ProfileDetails,
} from '../services/profile-api.service';
import { AuthApiService } from '../../auth/services/auth-api.service'; // <--- ĐẢM BẢO IMPORT AuthApi

@Component({
  selector: 'app-profile-page',
  standalone: true,
  // THÊM FormsModule VÀO imports
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, SiteLayoutComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authState = inject(AuthStateService);
  private readonly profileApi = inject(ProfileApiService);
  // private readonly authApi = inject(AuthApiService); 
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly currentUser = this.authState.currentUser;
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isUploadingAvatar = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly showSaveConfirmDialog = signal(false);
  protected readonly avatarPreviewUrl = signal('');
  protected readonly selectedAvatarName = signal('');
  protected readonly selectedAvatarFile = signal<File | null>(null);
  protected readonly isChangingPassword = signal(false);
  protected oldPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';

  protected handleChangePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('New passwords do not match.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage.set('New password must be at least 6 characters.');
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isChangingPassword.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.profileApi.changePassword(user.id, {
        oldPassword: this.oldPassword,
        newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.isChangingPassword.set(false);
        this.successMessage.set('Password updated successfully!');
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (error: HttpErrorResponse) => {
        this.isChangingPassword.set(false);
        this.errorMessage.set(error.error?.message ?? 'Failed to update password.');
      }
    });
  }
  protected readonly genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];
  protected readonly maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
  ];
  protected readonly workStatusOptions = [
    { value: 'employed', label: 'Employed' },
    { value: 'not_employed', label: 'Not Employed' },
    { value: 'student', label: 'Student' },
  ];

  protected readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    gender: ['male', [Validators.required]],
    dob: ['', [Validators.required]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    maritalStatus: ['single', [Validators.required]],
    hobbies: [''],
    likes: [''],
    dislikes: [''],
    cuisines: [''],
    sports: [''],
    qualification: [''],
    school: [''],
    college: [''],
    workStatus: ['student', [Validators.required]],
    organization: [''],
    designation: [''],
  });

  protected readonly avatarFallback = computed(() => {
    const name = this.profileForm.controls.name.value || this.currentUser()?.username || 'U';
    return name.trim().charAt(0).toUpperCase();
  });

  ngOnInit() {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.applyPaymentFeedback();

    this.loadProfile(user.id);
  }

  protected onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedAvatarFile.set(file);
    this.selectedAvatarName.set(file?.name ?? '');

    if (!file) {
      return;
    }

    const user = this.currentUser();
    if (!user) {
      this.errorMessage.set('Please sign in again before updating your avatar.');
      return;
    }

    const previousAvatarUrl = this.avatarPreviewUrl();
    const previewUrl = URL.createObjectURL(file);
    this.avatarPreviewUrl.set(previewUrl);
    this.isUploadingAvatar.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.profileApi.updateAvatar(user.id, file).subscribe({
      next: (response) => {
        this.avatarPreviewUrl.set(response.imageUrl);
        this.authState.updateUser({ avatarUrl: response.imageUrl });
        this.successMessage.set(response.message);
        this.isUploadingAvatar.set(false);
        this.selectedAvatarFile.set(null);
        this.selectedAvatarName.set('');
        input.value = '';
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'Unable to update your avatar right now.',
        );
        this.avatarPreviewUrl.set(previousAvatarUrl);
        this.isUploadingAvatar.set(false);
      },
    });
  }

  protected openSaveConfirmDialog() {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.showSaveConfirmDialog.set(true);
  }

  protected closeSaveConfirmDialog() {
    this.showSaveConfirmDialog.set(false);
  }

  protected confirmSaveProfile() {
    this.showSaveConfirmDialog.set(false);
    this.saveProfile();
  }

  private saveProfile() {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.profileApi
      .updateProfile(user.id, {
        ...this.profileForm.getRawValue(),
        emailAddress: user.email,
        avatar: this.selectedAvatarFile(),
      })
      .subscribe({
        next: (response) => {
          this.applyProfile(response.profile);
          this.authState.updateUser(response.user);
          this.successMessage.set(response.message);
          this.isSubmitting.set(false);
          this.selectedAvatarFile.set(null);
          this.selectedAvatarName.set('');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.message ?? 'Unable to update profile right now.',
          );
          this.isSubmitting.set(false);
        },
      });
  }

  private loadProfile(userId: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.profileApi.getProfile(userId).subscribe({
      next: (response) => {
        this.applyProfile(response.profile);
        this.authState.updateUser(response.user);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.error?.message ?? 'Unable to load your profile right now.',
        );
        this.isLoading.set(false);
      },
    });
  }

  private applyProfile(profile: ProfileDetails) {
    this.profileForm.patchValue({
      name: profile.name,
      gender: profile.gender,
      dob: profile.dob,
      address: profile.address,
      maritalStatus: profile.maritalStatus,
      hobbies: profile.hobbies.join(', '),
      likes: profile.likes.join(', '),
      dislikes: profile.dislikes.join(', '),
      cuisines: profile.cuisines.join(', '),
      sports: profile.sports.join(', '),
      qualification: profile.qualification,
      school: profile.school,
      college: profile.college,
      workStatus: profile.workStatus,
      organization: profile.organization,
      designation: profile.designation,
    });
    this.avatarPreviewUrl.set(profile.imageUrl);
  }

  private applyPaymentFeedback() {
    const paymentStatus = this.route.snapshot.queryParamMap.get('payment');
    const txnRef = this.route.snapshot.queryParamMap.get('txnRef');

    if (paymentStatus === 'success') {
      this.successMessage.set(
        `VNPay payment successful. Your order ${txnRef ?? ''} is now waiting for approval.`.trim(),
      );
      return;
    }

    if (paymentStatus === 'cancelled') {
      this.errorMessage.set('VNPay payment was cancelled. No subscription was activated.');
      return;
    }

    if (paymentStatus === 'failed') {
      this.errorMessage.set('VNPay payment failed. Please try the payment again.');
      return;
    }

    if (paymentStatus === 'invalid-signature' || paymentStatus === 'error') {
      this.errorMessage.set('The payment callback could not be verified. Please try again.');
    }
  }
}