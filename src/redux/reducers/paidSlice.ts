import { createSlice } from "@reduxjs/toolkit";

const paidSlice = createSlice({
  name: "paid",
  initialState: [
    {
      whoPaid: "",
      howMuchPaid: 0,
      toWho: "",
      groupName: "",
    },
  ],

  reducers: {
    setAddPayment(_state, action) {
      return action.payload;
    },
  },
});

export const { setAddPayment } = paidSlice.actions;

export default paidSlice.reducer;
