export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
}

export enum WorkStatus {
  EMPLOYED = 'employed',
  NOT_EMPLOYED = 'not_employed',
  STUDENT = 'student',
}

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum MessageRecipientType {
  FRIEND = 'friend',
  CONTACT = 'contact',
  EXTERNAL = 'external',
}

export enum MessageDeliveryStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum SubscriptionServiceType {
  JOKE = 'joke',
  CURRENT_AFFAIRS = 'current_affairs',
  SPORTS = 'sports',
  NEWS = 'news',
}

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentProvider {
  VNPAY = 'vnpay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum OrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user',
}
