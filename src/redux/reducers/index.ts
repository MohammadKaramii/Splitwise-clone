import { combineReducers } from 'redux';
import dummyDataReducer from './dummyDataSlice';
import userDataReducer from './userDataSlice'; 

const rootReducer = combineReducers({
  dummyData: dummyDataReducer,
  userData: userDataReducer,
});

export default rootReducer;