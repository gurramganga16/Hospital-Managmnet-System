import { UserRole } from '../types';

export type PermissionAction =
  | 'system:manage'
  | 'user:manage'
  | 'patient:register'
  | 'patient:read'
  | 'patient:update'
  | 'appointment:book'
  | 'appointment:checkin'
  | 'emr:consult'
  | 'emr:vitals'
  | 'pharmacy:dispense'
  | 'pharmacy:stock'
  | 'laboratory:order'
  | 'laboratory:results'
  | 'bed:admit'
  | 'bed:transfer'
  | 'bed:discharge'
  | 'billing:create'
  | 'billing:pay'
  | 'patient:portal';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    'system:manage',
    'user:manage',
    'patient:register',
    'patient:read',
    'patient:update',
    'appointment:book',
    'appointment:checkin',
    'emr:consult',
    'emr:vitals',
    'pharmacy:dispense',
    'pharmacy:stock',
    'laboratory:order',
    'laboratory:results',
    'bed:admit',
    'bed:transfer',
    'bed:discharge',
    'billing:create',
    'billing:pay',
    'patient:portal',
  ],
  HOSPITAL_ADMIN: [
    'user:manage',
    'patient:register',
    'patient:read',
    'patient:update',
    'appointment:book',
    'appointment:checkin',
    'emr:consult',
    'emr:vitals',
    'pharmacy:dispense',
    'pharmacy:stock',
    'laboratory:order',
    'laboratory:results',
    'bed:admit',
    'bed:transfer',
    'bed:discharge',
    'billing:create',
    'billing:pay',
    'patient:portal',
  ],
  DOCTOR: [
    'patient:read',
    'appointment:book',
    'emr:consult',
    'emr:vitals',
    'pharmacy:stock',
    'laboratory:order',
    'bed:admit',
    'bed:transfer',
    'bed:discharge',
  ],
  NURSE: [
    'patient:read',
    'emr:vitals',
    'bed:admit',
    'bed:transfer',
    'bed:discharge',
  ],
  RECEPTIONIST: [
    'patient:register',
    'patient:read',
    'patient:update',
    'appointment:book',
    'appointment:checkin',
    'billing:create',
    'billing:pay',
  ],
  PHARMACIST: [
    'patient:read',
    'pharmacy:dispense',
    'pharmacy:stock',
  ],
  LAB_TECHNICIAN: [
    'patient:read',
    'laboratory:order',
    'laboratory:results',
  ],
  ACCOUNTANT: [
    'patient:read',
    'billing:create',
    'billing:pay',
  ],
  PATIENT: [
    'patient:portal',
    'appointment:book',
  ],
};

/**
 * Validates whether a given role has permission to execute an action
 */
export function checkPermission(role: UserRole, action: PermissionAction): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return Boolean(allowed && allowed.includes(action));
}
