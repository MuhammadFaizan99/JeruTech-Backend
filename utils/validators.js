const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s().-]{7,20}$/;

const VALID_ROLES = ["customer"];

export const isValidEmail = (value) => {
  if (typeof value !== "string") return false;
  return EMAIL_REGEX.test(value.trim());
};

export const isValidPhoneNumber = (value) => {
  if (typeof value !== "string") return false;

  const normalized = value.trim();
  if (!normalized) return false;

  if (!PHONE_REGEX.test(normalized)) return false;

  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

export const validateRegisterInput = (data) => {
  const errors = [];
  const { customerName, phoneNumber, address, email, password, role } = data;

  if (!customerName?.trim()) {
    errors.push("Customer name is required");
  }
  if (!phoneNumber?.trim()) {
    errors.push("Phone number is required");
  } else if (!isValidPhoneNumber(phoneNumber)) {
    errors.push("Please provide a valid phone number");
  }
  if (!address?.trim()) {
    errors.push("Address is required");
  }
  if (!email?.trim()) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Please provide a valid email address");
  }
  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  if (role !== undefined && role !== null && role !== "") {
    if (!VALID_ROLES.includes(role)) {
      errors.push("Only customers can register");
    }
  }

  return { isValid: errors.length === 0, errors };
};

export const validateLoginInput = (data) => {
  const errors = [];
  const { email, password } = data;

  if (!email?.trim()) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Please provide a valid email address");
  }
  if (!password) {
    errors.push("Password is required");
  }

  return { isValid: errors.length === 0, errors };
};

export const validateUpdateProfileInput = (data) => {
  const errors = [];
  const { customerName, phoneNumber, address, email, password } = data;

  if (customerName !== undefined && !customerName?.trim()) {
    errors.push("Customer name cannot be empty");
  }
  if (phoneNumber !== undefined && !phoneNumber?.trim()) {
    errors.push("Phone number cannot be empty");
  } else if (phoneNumber !== undefined && phoneNumber?.trim() && !isValidPhoneNumber(phoneNumber)) {
    errors.push("Please provide a valid phone number");
  }
  if (address !== undefined && !address?.trim()) {
    errors.push("Address cannot be empty");
  }
  if (email !== undefined) {
    if (!email?.trim()) {
      errors.push("Email cannot be empty");
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push("Please provide a valid email address");
    }
  }
  if (password !== undefined && password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  return { isValid: errors.length === 0, errors };
};

export const validateProductInput = (data) => {
  // TODO: Implement product input validation later
  return { isValid: true, errors: [] };
};
