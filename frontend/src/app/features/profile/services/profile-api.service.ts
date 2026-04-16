import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ProfileDetails {
  name: string;
  gender: string;
  dob: string;
  address: string;
  maritalStatus: string;
  emailAddress: string;
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  cuisines: string[];
  sports: string[];
  imageUrl: string;
  qualification: string;
  school: string;
  college: string;
  workStatus: string;
  organization: string;
  designation: string;
}

export interface ProfileResponse {
  user: {
    id: string;
    username: string;
    email: string;
    mobileNumber: string;
    role: string;
    displayName: string;
    avatarUrl: string;
  };
  profile: ProfileDetails;
}

export interface FriendProfileResponse {
  friend: {
    id: string;
    displayName: string;
    email: string;
    mobileNumber: string;
    avatarUrl: string;
  };
  profile: ProfileDetails;
}

export interface UpdateProfilePayload {
  name: string;
  gender: string;
  dob: string;
  address: string;
  maritalStatus: string;
  emailAddress: string;
  hobbies: string;
  likes: string;
  dislikes: string;
  cuisines: string;
  sports: string;
  qualification: string;
  school: string;
  college: string;
  workStatus: string;
  organization: string;
  designation: string;
  avatar: File | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:3000/api/profile';

  getProfile(userId: string) {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/${userId}`);
  }

  getFriendProfile(viewerUserId: string, friendUserId: string) {
    return this.http.get<FriendProfileResponse>(`${this.apiUrl}/friend/view`, {
      params: { viewerUserId, friendUserId },
    });
  }

  updateProfile(userId: string, payload: UpdateProfilePayload) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('gender', payload.gender);
    formData.append('dob', payload.dob);
    formData.append('address', payload.address);
    formData.append('maritalStatus', payload.maritalStatus);
    formData.append('emailAddress', payload.emailAddress);
    formData.append('hobbies', JSON.stringify(this.toArray(payload.hobbies)));
    formData.append('likes', JSON.stringify(this.toArray(payload.likes)));
    formData.append('dislikes', JSON.stringify(this.toArray(payload.dislikes)));
    formData.append('cuisines', JSON.stringify(this.toArray(payload.cuisines)));
    formData.append('sports', JSON.stringify(this.toArray(payload.sports)));
    formData.append('qualification', payload.qualification);
    formData.append('school', payload.school);
    formData.append('college', payload.college);
    formData.append('workStatus', payload.workStatus);
    formData.append('organization', payload.organization);
    formData.append('designation', payload.designation);

    if (payload.avatar) {
      formData.append('avatar', payload.avatar);
    }

    return this.http.put<{
      message: string;
      user: ProfileResponse['user'];
      profile: ProfileDetails;
    }>(`${this.apiUrl}/${userId}`, formData);
  }

  updateAvatar(userId: string, avatar: File) {
    const formData = new FormData();
    formData.append('avatar', avatar);

    return this.http.put<{ message: string; imageUrl: string }>(
      `${this.apiUrl}/${userId}/avatar`,
      formData,
    );
  }

  private toArray(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
