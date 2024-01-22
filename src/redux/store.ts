import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducers/index";

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== "production",
});

export default store;

export type RootState = ReturnType<typeof store.getState>