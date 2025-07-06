import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.error = null;
    },
    setActiveGroup: (state, action: PayloadAction<string | undefined>) => {
      if (state.user) {
        state.user = { ...state.user, activeGroup: action.payload };
      }
    },
    setActiveFriend: (state, action: PayloadAction<string | undefined>) => {
      if (state.user) {
        state.user = { ...state.user, activeFriend: action.payload };
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
  setUser,
  clearUser,
  setActiveGroup,
  setActiveFriend,
  setLoading,
  setError,
} = authSlice.actions;
