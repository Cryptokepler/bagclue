/**
 * Address Types
 * 
 * TypeScript definitions for customer shipping addresses.
 */

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone_country_code: string | null;
  phone_country_iso: string | null;
  phone: string | null;
  country: string;
  state: string | null;
  city: string;
  postal_code: string | null;
  address_line1: string;
  address_line2: string | null;
  delivery_references: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressDTO {
  full_name: string;
  phone_country_code?: string | null;
  phone_country_iso?: string | null;
  phone?: string | null;
  country: string;
  state?: string | null;
  city: string;
  postal_code?: string | null;
  address_line1: string;
  address_line2?: string | null;
  delivery_references?: string | null;
  is_default?: boolean;
}

export interface AddressValidationError {
  field: string;
  message: string;
}

export interface UpdateAddressDTO {
  full_name?: string;
  phone_country_code?: string | null;
  phone_country_iso?: string | null;
  phone?: string | null;
  country?: string;
  state?: string | null;
  city?: string;
  postal_code?: string | null;
  address_line1?: string;
  address_line2?: string | null;
  delivery_references?: string | null;
  is_default?: boolean;
}
