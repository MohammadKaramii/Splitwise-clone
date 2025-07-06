export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const isValidAmount = (amount: string | number): boolean => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
};

export const isValidGroupName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

export const isValidExpenseDescription = (description: string): boolean => {
  return description.trim().length >= 1 && description.trim().length <= 200;
};

export const validateFormField = (
  value: string,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => boolean;
  }
): string | null => {
  const trimmedValue = value.trim();

  if (rules.required && !trimmedValue) {
    return "This field is required";
  }

  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return `Minimum length is ${rules.minLength} characters`;
  }

  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return `Maximum length is ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return "Invalid format";
  }

  if (rules.custom && !rules.custom(trimmedValue)) {
    return "Invalid value";
  }

  return null;
};

export const validateEmail = (email: string): string | null => {
  return (
    validateFormField(email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    }) || (isValidEmail(email) ? null : "Please enter a valid email address")
  );
};

export const validatePassword = (password: string): string | null => {
  return validateFormField(password, {
    required: true,
    minLength: 6,
  });
};

export const validateAmount = (amount: string): string | null => {
  const numValue = parseFloat(amount);

  if (!amount.trim()) {
    return "Amount is required";
  }

  if (isNaN(numValue)) {
    return "Please enter a valid number";
  }

  if (numValue <= 0) {
    return "Amount must be greater than zero";
  }

  if (numValue > 999999) {
    return "Amount is too large";
  }

  return null;
};

export const validateGroupName = (name: string): string | null => {
  return validateFormField(name, {
    required: true,
    minLength: 2,
    maxLength: 50,
  });
};

export const validateExpenseDescription = (
  description: string
): string | null => {
  return validateFormField(description, {
    required: true,
    minLength: 1,
    maxLength: 200,
  });
};

export const validateGroupNameUniqueness = (
  name: string,
  existingGroups: Array<{ groupName: string }>
): string | null => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "Group name is required";
  }

  const basicValidation = validateGroupName(name);
  if (basicValidation) {
    return basicValidation;
  }

  const isDuplicate = existingGroups.some(
    (group) => group.groupName.toLowerCase() === trimmedName.toLowerCase()
  );

  if (isDuplicate) {
    return "A group with this name already exists. Please choose a different name.";
  }

  return null;
};
