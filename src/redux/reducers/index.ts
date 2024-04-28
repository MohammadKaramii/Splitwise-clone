import { combineReducers } from 'redux';
import dummyDataReducer from './dummyDataSlice';
import userDataReducer from './userDataSlice'; 
import totalAmonutReducer from './totalAmonutSlice';
import paidReducer from './paidSlice';
import spentReducer from './spentsSlice';

const rootReducer = combineReducers({
  dummyData: dummyDataReducer,
  userData: userDataReducer,
  totalAmonut: totalAmonutReducer,
  paids: paidReducer,
  spents: spentReducer
});

export default rootReducer;