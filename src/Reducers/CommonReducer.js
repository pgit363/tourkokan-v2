import {
  SaveAccess_token,
  SaveLoginUser,
  SetDestination,
  SetLoader,
  SetMode,
  SetSource,
} from './Types';

const initialState = {
  loginUser: [],
  access_token: '',
  isLoading: false,
  source: {},
  destination: {},
  mode: true,
};

const commonReducer = (state = initialState, action) => {
  switch (action.type) {
    case SaveLoginUser:
      return {
        ...state,
        loginUser: action.payload,
      };
    case SaveAccess_token:
      return {
        ...state,
        access_token: action.payload,
      };
    case SetLoader:
      return {
        ...state,
        isLoading: action.payload,
      };
    case SetSource:
      return {
        ...state,
        source: action.payload,
      };
    case SetDestination:
      return {
        ...state,
        destination: action.payload,
      };
    case SetMode: {
      return {
        ...state,
        mode: action.payload,
      };
    }
    default:
      return state;
  }
};

export default commonReducer;
