export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly isSignedIn: boolean;
  readonly activeGroup?: string;
  readonly activeFriend?: string;
}

export interface Expense {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly paidBy: string;
  readonly sharedWith: string[];
  readonly groupId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly members: string[];
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Payment {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly groupId: string;
  readonly createdAt: Date;
}

export interface Balance {
  readonly userId: string;
  readonly amount: number;
}

export interface PairwiseBalance {
  readonly userA: string;
  readonly userB: string;
  readonly amount: number;
}

export interface AppState {
  readonly user: User | null;
  readonly groups: Group[];
  readonly expenses: Expense[];
  readonly payments: Payment[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

export interface GroupSummary {
  readonly group: Group;
  readonly totalExpenses: number;
  readonly memberBalances: Balance[];
  readonly settlementSuggestions: PairwiseBalance[];
}

export interface CreateGroupData {
  readonly name: string;
  readonly members: {
    readonly name: string;
    readonly email?: string;
  }[];
}

export interface CreateExpenseData {
  readonly description: string;
  readonly amount: number;
  readonly paidBy: string;
  readonly sharedWith: string[];
  readonly groupId: string;
}

export interface CreatePaymentData {
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly groupId: string;
}

export interface AuthData {
  readonly email: string;
  readonly password: string;
  readonly name?: string;
}

export interface FormState<T> {
  readonly data: T;
  readonly errors: Partial<Record<keyof T, string>>;
  readonly isSubmitting: boolean;
}

export type LoadingState = "idle" | "pending" | "succeeded" | "failed";

export interface ApiResponse<T> {
  readonly data?: T;
  readonly error?: string;
  readonly success: boolean;
}
