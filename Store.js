// import {createStore, applyMiddleware, compose} from "redux"
import {configureStore} from '@reduxjs/toolkit';
// import thunk from "redux-thunk";
// import {sessionService} from "redux-react-session";
// import categoryReducer from "./reducers/categoryReducer";
import commonReducer from './src/Reducers/CommonReducer';

const store = configureStore({
  reducer: {
    commonState: commonReducer,
    //   filters: filtersReducer
  },
});

export default store;
