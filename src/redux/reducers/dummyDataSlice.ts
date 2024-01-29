import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groups: [
    {
      id: 1,
      groupName: "Bangalore Trip",
      friends: ["Jhon", "Smith", "Bob"],
      howSpent: [
        {
          message: "Hotel",
          cost: 9800,
          comments: [],
        },
        {
          message: "Food",
          cost: 3500,
          comments: [],
        },
        {
          message: "Drinks",
          cost: 6500,
          comments: [],
        },
        {
          message: "For Petrol",
          cost: 5200,
          comments: [],
        },
      ],
      paid: [
        {
          Smith: 6250,
        },
        {
          Bob: 6250,
        },
      ],
      userId: "de1076bf-d372f-4bc7-a507-351d84e7f714",
    },

    {
      id: 2,
      groupName: "Saturday Night",
      friends: ["Bob", "Smith"],
      howSpent: [
        {
          message: "For Drinks",
          cost: 8500,
          comments: [],
        },
        {
          message: "For Food",
          cost: 3500,
          comments: [],
        },
        {
          message: "Hotel",
          cost: 9800,
          comments: [],
        },
      ],
      paid: [],
      userId: "de1076bf-d372f-4bc7-a507-351d84e7f714",
    },

    {
      id: 3,
      groupName: "New Year Party",
      friends: ["Bob", "Jhon", "Smith", "Rahul"],
      howSpent: [
        {
          message: "Driks",
          cost: 14200,
          comments: [],
        },
        {
          message: "Food",
          cost: 5000,
          comments: [],
        },
        {
          message: "For Cake",
          cost: 800,
          comments: [],
        },
      ],
      paid: [
        {
          Rahul: 4000,
        },
        {
          Bob: 4000,
        },
        {
          Jhon: 4000,
        },
        {
          Smith: 4000,
        },
      ],
      userId: "de1076bf-d372f-4bc7-a507-351d84e7f714",
    },
    {
      id: 4,
      groupName: "Vinodh Birthday Party",
      friends: ["Jhon", "Pavan", "Smith", "Bob", "Vinodh"],
      howSpent: [
        {
          message: "Decoration",
          cost: 5200,
          comments: [],
        },
        {
          message: "For Cake",
          cost: 1500,
          comments: [],
        },
        {
          message: "Drinks",
          cost: 15000,
          comments: [],
        },
      ],
      paid: [
        {
          Pavan: 3616.67,
        },
      ],
      userId: "de1076bf-d372f-4bc7-a507-351d84e7f714",
    },
    {
      id: 5,
      groupName: "Room expenses",
      friends: ["Jhon", "Bob"],
      howSpent: [
        {
          message: "vegetables",
          cost: 300,
          comments: [],
        },
        {
          message: "Water Tin",
          cost: 20,
          comments: [],
        },
      ],
      paid: [
        {
          Jhon: 106.67,
        },
        {
          Bob: 106.67,
        },
      ],
      userId: "de1076bf-d372f-4bc7-a507-351d84e7f714",
    },

    {
      id: 6,
      groupName: "Avatar Movie at PVR",
      friends: ["Pavan", "Bob", "Jhon"],
      howSpent: [
        {
          message: "Tickets",
          cost: 5200,
          comments: [],
        },
        {
          message: "Food",
          cost: 1500,
          comments: [],
        },
      ],
      paid: [
        {
          Bob: 1675,
        },
      ],
      userId: "de1076bf-d372f-4bc7-a507-351d84e7f714",
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
