
import { createSlice } from '@reduxjs/toolkit';
  
const initialState = {
    paids: [],
  };
  

const paidSlice = createSlice({
        name: 'paid',
        initialState,
        reducers: {
          setAddPayment(state, action) {
            state.paids = action.payload
          },
        },
      });
      
      export const { setAddPayment } = paidSlice.actions;
      
      export default paidSlice.reducer;