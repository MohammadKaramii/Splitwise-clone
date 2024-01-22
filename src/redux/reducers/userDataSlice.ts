import { createSlice } from '@reduxjs/toolkit';

const initialState = {
user: {
name: '',
email: '',
isSignIn: false,
activeGroup: null,
activeFriend: null,
},
};

const userDataSlice = createSlice({
name: 'userData',
initialState,
reducers: {
setSignInUserData: (state, action) => {
state.user = { ...state.user, ...action.payload };
},
},
});

export const { setSignInUserData } = userDataSlice.actions;
export default userDataSlice.reducer;