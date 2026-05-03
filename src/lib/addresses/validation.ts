/**
 * Address Validation Utilities
 * 
 * Field validation for customer addresses.
 */

import { CreateAddressDTO, AddressValidationError } from '@/types/address';

/**
 * Validate create address DTO
 * Returns array of validation errors (empty if valid)
 */
export function validateCreateAddress(data: any): AddressValidationError[] {
  const errors: AddressValidationError[] = [];

  // Required fields
  if (!data.full_name || typeof data.full_name !== 'string') {
    errors.push({ field: 'full_name', message: 'Full name is required' });
  } else if (data.full_name.trim().length < 3) {
    errors.push({ field: 'full_name', message: 'Full name must be at least 3 characters' });
  } else if (data.full_name.trim().length > 255) {
    errors.push({ field: 'full_name', message: 'Full name must not exceed 255 characters' });
  }

  if (!data.country || typeof data.country !== 'string') {
    errors.push({ field: 'country', message: 'Country is required' });
  } else if (data.country.trim().length < 3) {
    errors.push({ field: 'country', message: 'Country must be at least 3 characters' });
  } else if (data.country.trim().length > 100) {
    errors.push({ field: 'country', message: 'Country must not exceed 100 characters' });
  }

  if (!data.city || typeof data.city !== 'string') {
    errors.push({ field: 'city', message: 'City is required' });
  } else if (data.city.trim().length < 3) {
    errors.push({ field: 'city', message: 'City must be at least 3 characters' });
  } else if (data.city.trim().length > 100) {
    errors.push({ field: 'city', message: 'City must not exceed 100 characters' });
  }

  if (!data.address_line1 || typeof data.address_line1 !== 'string') {
    errors.push({ field: 'address_line1', message: 'Address line 1 is required' });
  } else if (data.address_line1.trim().length < 5) {
    errors.push({ field: 'address_line1', message: 'Address line 1 must be at least 5 characters' });
  } else if (data.address_line1.trim().length > 255) {
    errors.push({ field: 'address_line1', message: 'Address line 1 must not exceed 255 characters' });
  }

  // Optional fields - validate format if provided
  if (data.phone_country_code !== undefined && data.phone_country_code !== null) {
    if (typeof data.phone_country_code !== 'string') {
      errors.push({ field: 'phone_country_code', message: 'Phone country code must be a string' });
    } else if (!/^\+\d{1,4}$/.test(data.phone_country_code)) {
      errors.push({ field: 'phone_country_code', message: 'Phone country code must start with + followed by 1-4 digits (e.g., +52)' });
    }
  }

  if (data.phone_country_iso !== undefined && data.phone_country_iso !== null) {
    if (typeof data.phone_country_iso !== 'string') {
      errors.push({ field: 'phone_country_iso', message: 'Phone country ISO must be a string' });
    } else if (!/^[A-Z]{2}$/.test(data.phone_country_iso)) {
      errors.push({ field: 'phone_country_iso', message: 'Phone country ISO must be 2 uppercase letters (e.g., MX)' });
    }
  }

  if (data.phone !== undefined && data.phone !== null) {
    if (typeof data.phone !== 'string') {
      errors.push({ field: 'phone', message: 'Phone must be a string' });
    } else if (data.phone.trim().length > 0) {
      if (data.phone.trim().length < 7) {
        errors.push({ field: 'phone', message: 'Phone must be at least 7 characters' });
      } else if (data.phone.trim().length > 20) {
        errors.push({ field: 'phone', message: 'Phone must not exceed 20 characters' });
      }
    }
  }

  if (data.state !== undefined && data.state !== null && typeof data.state === 'string') {
    if (data.state.trim().length > 100) {
      errors.push({ field: 'state', message: 'State must not exceed 100 characters' });
    }
  }

  if (data.postal_code !== undefined && data.postal_code !== null && typeof data.postal_code === 'string') {
    if (data.postal_code.trim().length > 20) {
      errors.push({ field: 'postal_code', message: 'Postal code must not exceed 20 characters' });
    }
  }

  if (data.address_line2 !== undefined && data.address_line2 !== null && typeof data.address_line2 === 'string') {
    if (data.address_line2.trim().length > 255) {
      errors.push({ field: 'address_line2', message: 'Address line 2 must not exceed 255 characters' });
    }
  }

  if (data.delivery_references !== undefined && data.delivery_references !== null && typeof data.delivery_references === 'string') {
    if (data.delivery_references.trim().length > 500) {
      errors.push({ field: 'delivery_references', message: 'Delivery references must not exceed 500 characters' });
    }
  }

  if (data.is_default !== undefined && typeof data.is_default !== 'boolean') {
    errors.push({ field: 'is_default', message: 'is_default must be a boolean' });
  }

  return errors;
}

/**
 * Sanitize address data (trim strings, normalize)
 */
export function sanitizeAddressData(data: any): CreateAddressDTO {
  return {
    full_name: data.full_name?.trim() || '',
    phone_country_code: data.phone_country_code?.trim() || null,
    phone_country_iso: data.phone_country_iso?.trim().toUpperCase() || null,
    phone: data.phone?.trim() || null,
    country: data.country?.trim() || '',
    state: data.state?.trim() || null,
    city: data.city?.trim() || '',
    postal_code: data.postal_code?.trim() || null,
    address_line1: data.address_line1?.trim() || '',
    address_line2: data.address_line2?.trim() || null,
    delivery_references: data.delivery_references?.trim() || null,
    is_default: data.is_default === true,
  };
}

/**
 * Validate update address DTO (PATCH - all fields optional)
 * Returns array of validation errors (empty if valid)
 */
export function validateUpdateAddress(data: any): AddressValidationError[] {
  const errors: AddressValidationError[] = [];

  // All fields are optional for PATCH, only validate if provided
  if (data.full_name !== undefined && data.full_name !== null) {
    if (typeof data.full_name !== 'string') {
      errors.push({ field: 'full_name', message: 'Full name must be a string' });
    } else if (data.full_name.trim().length < 3) {
      errors.push({ field: 'full_name', message: 'Full name must be at least 3 characters' });
    } else if (data.full_name.trim().length > 255) {
      errors.push({ field: 'full_name', message: 'Full name must not exceed 255 characters' });
    }
  }

  if (data.country !== undefined && data.country !== null) {
    if (typeof data.country !== 'string') {
      errors.push({ field: 'country', message: 'Country must be a string' });
    } else if (data.country.trim().length < 3) {
      errors.push({ field: 'country', message: 'Country must be at least 3 characters' });
    } else if (data.country.trim().length > 100) {
      errors.push({ field: 'country', message: 'Country must not exceed 100 characters' });
    }
  }

  if (data.city !== undefined && data.city !== null) {
    if (typeof data.city !== 'string') {
      errors.push({ field: 'city', message: 'City must be a string' });
    } else if (data.city.trim().length < 3) {
      errors.push({ field: 'city', message: 'City must be at least 3 characters' });
    } else if (data.city.trim().length > 100) {
      errors.push({ field: 'city', message: 'City must not exceed 100 characters' });
    }
  }

  if (data.address_line1 !== undefined && data.address_line1 !== null) {
    if (typeof data.address_line1 !== 'string') {
      errors.push({ field: 'address_line1', message: 'Address line 1 must be a string' });
    } else if (data.address_line1.trim().length < 5) {
      errors.push({ field: 'address_line1', message: 'Address line 1 must be at least 5 characters' });
    } else if (data.address_line1.trim().length > 255) {
      errors.push({ field: 'address_line1', message: 'Address line 1 must not exceed 255 characters' });
    }
  }

  // Phone validations (same as POST)
  if (data.phone_country_code !== undefined && data.phone_country_code !== null) {
    if (typeof data.phone_country_code !== 'string') {
      errors.push({ field: 'phone_country_code', message: 'Phone country code must be a string' });
    } else if (!/^\+\d{1,4}$/.test(data.phone_country_code)) {
      errors.push({ field: 'phone_country_code', message: 'Phone country code must start with + followed by 1-4 digits (e.g., +52)' });
    }
  }

  if (data.phone_country_iso !== undefined && data.phone_country_iso !== null) {
    if (typeof data.phone_country_iso !== 'string') {
      errors.push({ field: 'phone_country_iso', message: 'Phone country ISO must be a string' });
    } else if (!/^[A-Z]{2}$/.test(data.phone_country_iso)) {
      errors.push({ field: 'phone_country_iso', message: 'Phone country ISO must be 2 uppercase letters (e.g., MX)' });
    }
  }

  if (data.phone !== undefined && data.phone !== null) {
    if (typeof data.phone !== 'string') {
      errors.push({ field: 'phone', message: 'Phone must be a string' });
    } else if (data.phone.trim().length > 0) {
      if (data.phone.trim().length < 7) {
        errors.push({ field: 'phone', message: 'Phone must be at least 7 characters' });
      } else if (data.phone.trim().length > 20) {
        errors.push({ field: 'phone', message: 'Phone must not exceed 20 characters' });
      }
    }
  }

  // Optional fields length validation
  if (data.state !== undefined && data.state !== null && typeof data.state === 'string') {
    if (data.state.trim().length > 100) {
      errors.push({ field: 'state', message: 'State must not exceed 100 characters' });
    }
  }

  if (data.postal_code !== undefined && data.postal_code !== null && typeof data.postal_code === 'string') {
    if (data.postal_code.trim().length > 20) {
      errors.push({ field: 'postal_code', message: 'Postal code must not exceed 20 characters' });
    }
  }

  if (data.address_line2 !== undefined && data.address_line2 !== null && typeof data.address_line2 === 'string') {
    if (data.address_line2.trim().length > 255) {
      errors.push({ field: 'address_line2', message: 'Address line 2 must not exceed 255 characters' });
    }
  }

  if (data.delivery_references !== undefined && data.delivery_references !== null && typeof data.delivery_references === 'string') {
    if (data.delivery_references.trim().length > 500) {
      errors.push({ field: 'delivery_references', message: 'Delivery references must not exceed 500 characters' });
    }
  }

  if (data.is_default !== undefined && typeof data.is_default !== 'boolean') {
    errors.push({ field: 'is_default', message: 'is_default must be a boolean' });
  }

  return errors;
}

/**
 * Sanitize update data (only sanitize fields that are present)
 */
export function sanitizeUpdateData(data: any): any {
  const sanitized: any = {};

  if (data.full_name !== undefined) sanitized.full_name = data.full_name?.trim() || null;
  if (data.phone_country_code !== undefined) sanitized.phone_country_code = data.phone_country_code?.trim() || null;
  if (data.phone_country_iso !== undefined) sanitized.phone_country_iso = data.phone_country_iso?.trim().toUpperCase() || null;
  if (data.phone !== undefined) sanitized.phone = data.phone?.trim() || null;
  if (data.country !== undefined) sanitized.country = data.country?.trim() || null;
  if (data.state !== undefined) sanitized.state = data.state?.trim() || null;
  if (data.city !== undefined) sanitized.city = data.city?.trim() || null;
  if (data.postal_code !== undefined) sanitized.postal_code = data.postal_code?.trim() || null;
  if (data.address_line1 !== undefined) sanitized.address_line1 = data.address_line1?.trim() || null;
  if (data.address_line2 !== undefined) sanitized.address_line2 = data.address_line2?.trim() || null;
  if (data.delivery_references !== undefined) sanitized.delivery_references = data.delivery_references?.trim() || null;
  if (data.is_default !== undefined) sanitized.is_default = data.is_default === true;

  return sanitized;
}
