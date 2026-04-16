import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RegisterOtpPayload {
  username: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otpCode: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AvailabilityResponse {
  available: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:3000/api/auth';

  requestRegisterOtp(payload: RegisterOtpPayload) {
    return this.http.post<{ message: string; expiresInMinutes: number }>(
      `${this.apiUrl}/register/request-otp`,
      payload,
    );
  }

  checkUsername(username: string) {
    return this.http.get<AvailabilityResponse>(
      `${this.apiUrl}/check-username`,
      { params: { username } },
    );
  }

  checkMobile(mobileNumber: string) {
    return this.http.get<AvailabilityResponse>(
      `${this.apiUrl}/check-mobile`,
      { params: { mobileNumber } },
    );
  }

  verifyRegisterOtp(payload: VerifyOtpPayload) {
    return this.http.post<{
      message: string;
      user: {
        id: string;
        username: string;
        email: string;
        mobileNumber: string;
        role: string;
        displayName: string;
        avatarUrl: string;
      };
    }>(`${this.apiUrl}/register/verify-otp`, payload);
  }

  login(payload: LoginPayload) {
    return this.http.post<{
      message: string;
      user: {
        id: string;
        username: string;
        email: string;
        mobileNumber: string;
        role: string;
        displayName: string;
        avatarUrl: string;
      };
    }>(`${this.apiUrl}/login`, payload);
  }
}
