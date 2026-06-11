// import {createStore, applyMiddleware, compose} from "redux"
import {configureStore} from '@reduxjs/toolkit';
// import thunk from "redux-thunk";
// import {sessionService} from "redux-react-session";
// import categoryReducer from "./reducers/categoryReducer";
import commonReducer from './src/Reducers/CommonReducer';
import {reduxLoggerMiddleware} from './src/Services/Logger';

const store = configureStore({
  reducer: {
    commonState: commonReducer,
    //   filters: filtersReducer
  },
  // Event-based action logging — every dispatch flows through the Logger
  // pipeline (console output is dev-only via the Logger's env gate).
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(reduxLoggerMiddleware),
});

export default store;
