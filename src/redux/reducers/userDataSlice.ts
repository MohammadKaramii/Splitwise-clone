import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

const initialState = {
  user: {
    name: "",
    email: "",
    isSignIn: false,
    activeGroup: null,
    activeFriend: null,
    id: "",
  
  },
};

const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setSignInUserData: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    signOutUser: (state) => {
      state.user = initialState.user;
    },
  },
});

export const { setSignInUserData, signOutUser } = userDataSlice.actions;

export const selectUserData = (state: RootState) => state.userData.user;

export default userDataSlice.reducer;
