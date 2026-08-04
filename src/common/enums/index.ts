export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ChallengeStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

export enum GeneratedBy {
  SYSTEM = 'system',
  ADMIN = 'admin',
}

export enum SubmissionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum ActorRole {
  ADMIN = 'admin',
  USER = 'user',
  SYSTEM = 'system',
}

export enum ShopStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
}

export enum ProcessingJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum NewsStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}
