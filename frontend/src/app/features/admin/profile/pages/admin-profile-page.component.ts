import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import {
  ProfileApiService,
  ProfileDetails,
} from '../../../profile/services/profile-api.service';

@Component({
  selector: 'app-admin-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-profile-page.component.html',
  styleUrl: './admin-profile-page.component.css',
})
export class AdminProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authState = inject(AuthStateService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly router = inject(Router);

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
}
