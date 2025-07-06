import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GroupItem {
  id: string;
  groupName: string;
  friends: string[];
  howSpent?: Array<{
    message: string;
    cost: number;
    id: string;
    createdAt: string;
    whoPaid: string;
    sharedWith: string[];
  }>;
  userId: string;
  lastUpdate: string;
}

interface GroupsState {
  groups: GroupItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  groups: [],
  isLoading: false,
  error: null,
};

export const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    setGroups: (state, action: PayloadAction<GroupItem[]>) => {
      state.groups = action.payload;
      state.error = null;
    },
    addGroup: (state, action: PayloadAction<GroupItem>) => {
      state.groups.push(action.payload);
    },
    updateGroup: (
      state,
      action: PayloadAction<{ groupName: string; update: GroupItem }>
    ) => {
      const index = state.groups.findIndex(
        (group) => group.groupName === action.payload.groupName
      );
      if (index !== -1) {
        state.groups[index] = action.payload.update;
      }
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(
        (group) => group.id !== action.payload
      );
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
  setGroups,
  addGroup,
  updateGroup,
  removeGroup,
  setLoading,
  setError,
} = groupsSlice.actions;
