import { combineReducers } from 'redux';
import dummyDataReducer from './dummyDataSlice';
import userDataReducer from './userDataSlice'; 
import totalAmonutReducer from './totalAmonutSlice';

const rootReducer = combineReducers({
  dummyData: dummyDataReducer,
  userData: userDataReducer,
  totalAmonut: totalAmonutReducer,
});

export default rootReducer;