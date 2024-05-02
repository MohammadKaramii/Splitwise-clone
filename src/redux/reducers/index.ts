import { combineReducers } from "redux";
import groupReducer from "./groupSlice";
import userDataReducer from "./userDataSlice";
import totalAmonutReducer from "./totalAmonutSlice";
import paidReducer from "./paidSlice";
import spentReducer from "./spentsSlice";

const rootReducer = combineReducers({
  groups: groupReducer,
  userData: userDataReducer,
  totalAmonut: totalAmonutReducer,
  paids: paidReducer,
  spents: spentReducer,
});

export default rootReducer;
