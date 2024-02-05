import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groups: [
    {
      id: "",
      groupName: "",
      friends: [],
      howSpent: [
        {
          message: "",
          cost: 0,
          id: "",
          createdAt: "",
        },
      ],
      paid: [],
      userId: "",
    },
  ],
};

const dummyDataSlice = createSlice({
  name: "dummyData",
  initialState,
  reducers: {
    setGroupData(state, action) {
      state.groups = action.payload;
    },
    updateMessage(state, action) {
      const { groupName, update } = action.payload;
      const groupIndex = state.groups.findIndex(
        (group) => group.groupName === groupName
      );
      if (groupIndex !== -1) {
        state.groups[groupIndex] = update;
      }
    },
  },
});

export const { setGroupData, updateMessage } = dummyDataSlice.actions;

export default dummyDataSlice.reducer;
