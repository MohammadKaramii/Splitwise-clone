import { createSlice } from '@reduxjs/toolkit';


export const spentsSlice = createSlice({
  name: 'spents',
  initialState: [
    {
      message: "",
      cost: 0,
      id: "",
      createdAt: "",
      whoPaid: "",
      sharedWith: [],
    },
  ],
  reducers: {
    setSpents: (state, action) => {
      return action.payload;
    },
  },
});

export const { setSpents } = spentsSlice.actions;

export default spentsSlice.reducer;