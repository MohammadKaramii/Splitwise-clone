import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ExpenseItem {
  message: string;
  cost: number;
  id: string;
  createdAt: string;
  whoPaid: string;
  sharedWith: string[];
  groupId?: string;
}

interface ExpensesState {
  items: ExpenseItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  items: [],
  isLoading: false,
  error: null,
};

export const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<ExpenseItem[]>) => {
      state.items = action.payload;
      state.error = null;
    },
    addExpense: (state, action: PayloadAction<ExpenseItem>) => {
      state.items.push(action.payload);
    },
    updateExpense: (state, action: PayloadAction<ExpenseItem>) => {
      const index = state.items.findIndex(
        (expense) => expense.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeExpense: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(
        (expense) => expense.id === action.payload
      );
      if (index !== -1) {
        state.items.splice(index, 1);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setExpenses,
  addExpense,
  updateExpense,
  removeExpense,
  setLoading,
  setError,
} = expensesSlice.actions;
