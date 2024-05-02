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
          whoPaid: "",
          sharedWith: [""],
        },
      ],
      paid: [{
        whoPaid: "",
        howMuchPaid: 0,
        toWho: "",
      }],
      userId: "",
      lastUpdate: "",
    },
  ],
};

const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    setGroupData(state, action) {
      state.groups = action.payload;
    },
    updateGroup(state, action) {
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

export const { setGroupData, updateGroup } = groupSlice.actions;

export default groupSlice.reducer;
