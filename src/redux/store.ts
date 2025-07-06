import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./slices/authSlice";
import { groupsSlice } from "./slices/groupsSlice";
import { expensesSlice } from "./slices/expensesSlice";
import { paymentsSlice } from "./slices/paymentsSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    groups: groupsSlice.reducer,
    expenses: expensesSlice.reducer,
    payments: paymentsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
