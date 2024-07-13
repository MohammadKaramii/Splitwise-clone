export interface Errors {
  description?: string;
  cost?: string;
  whoPaid?: string;
  sharedWith?: string;
}

export interface FormData {
  description?: string;
  cost?: string;
  errors: Errors;
  isErrors: boolean;
}

export interface HowSpent {
  createdAt: string;
  message?: string;
  cost?: number;
  id?: string;
  whoPaid?: string;
  sharedWith: string[];
}
