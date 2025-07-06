import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PaymentItem {
  whoPaid: string;
  howMuchPaid: number;
  toWho: string;
  id?: string;
  createdAt?: string;
  groupId?: string;
}

interface PaymentsState {
  items: PaymentItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    setPayments: (state, action: PayloadAction<PaymentItem[]>) => {
      state.items = action.payload;
      state.error = null;
    },
    addPayment: (state, action: PayloadAction<PaymentItem>) => {
      state.items.push(action.payload);
    },
    updatePayment: (state, action: PayloadAction<PaymentItem>) => {
      if (action.payload.id) {
        const index = state.items.findIndex(
          (payment) => payment.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      }
    },
    removePayment: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(
        (payment) => payment.id === action.payload
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
  setPayments,
  addPayment,
  updatePayment,
  removePayment,
  setLoading,
  setError,
} = paymentsSlice.actions;
