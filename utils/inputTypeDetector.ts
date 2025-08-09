/**
 * Utility function to determine if input is email or mobile in real-time
 */
export const determineInputType = (input: string): 'email' | 'mobile' => {
  // Email pattern: contains @ and basic email structure
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Mobile pattern: starts with 0 and contains only digits (11 digits total)
  const mobilePattern = /^0\d{10}$/;
  
  if (emailPattern.test(input)) {
    return 'email';
  } else if (mobilePattern.test(input)) {
    return 'mobile';
  }
  
  // Fallback - if it looks more like mobile (starts with 0 and contains only digits)
  if (input.startsWith('0') && /^\d+$/.test(input)) {
    return 'mobile';
  }
  
  // If input contains @ symbol, assume it's an email attempt
  if (input.includes('@')) {
    return 'email';
  }
  
  return 'email'; // Default to email
};

/**
 * Get appropriate keyboard type based on input content
 */
export const getKeyboardTypeForInput = (input: string): 'email-address' | 'phone-pad' | 'default' => {
  // Always return default to use full QWERTY keyboard
  return 'default';
}

/**
 * Get appropriate placeholder text based on detected input type
 */
export const getPlaceholderForInput = (input: string): string => {
  if (!input.trim()) {
    return 'Enter email or phone number';
  }
  
  const inputType = determineInputType(input);
  
  switch (inputType) {
    case 'email':
      return 'Enter your email address';
    case 'mobile':
      return 'Enter 11-digit mobile number';
    default:
      return 'Enter email or phone number';
  }
};

/**
 * Get appropriate icon based on detected input type
 */
export const getIconForInput = (input: string): 'mail-outline' | 'call-outline' | 'person-outline' => {
  if (!input.trim()) {
    return 'person-outline';
  }
  
  const inputType = determineInputType(input);
  
  switch (inputType) {
    case 'email':
      return 'mail-outline';
    case 'mobile':
      return 'call-outline';
    default:
      return 'person-outline';
  }
};

/**
 * Validate the input based on detected type
 */
export const validateInput = (input: string): boolean => {
  if (!input.trim()) {
    return false;
  }
  
  const inputType = determineInputType(input);
  
  if (inputType === 'email') {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  } else if (inputType === 'mobile') {
    // Mobile validation for Bangladesh (11 digits starting with 01) or international
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    return phoneRegex.test(input);
  }
  
  return false;
};

/**
 * Get validation error message based on input type
 */
export const getValidationErrorMessage = (input: string): string => {
  if (!input.trim()) {
    return 'Please enter an email or phone number';
  }
  
  const inputType = determineInputType(input);
  
  if (inputType === 'email') {
    return 'Please enter a valid email address';
  } else if (inputType === 'mobile') {
    if (input.length < 11) {
      return 'Phone number must be 11 digits (e.g., 01712345678)';
    } else {
      return 'Please enter a valid phone number (11 digits starting with 01)';
    }
  }
  
  return 'Please enter a valid email or phone number';
};
