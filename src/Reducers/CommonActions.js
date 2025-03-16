import {
  SaveAccess_token,
  SaveLoginUser,
  SetDestination,
  SetLoader,
  SetSource,
  SetMode,
} from './Types';

const saveLoginUser = data => {
  return {
    type: SaveLoginUser,
    payload: data,
  };
};

const saveAccess_token = data => {
  return {
    type: SaveAccess_token,
    payload: data,
  };
};

const setLoader = data => {
  return {
    type: SetLoader,
    payload: data,
  };
};

const setSource = data => {
  return {
    type: SetSource,
    payload: data,
  };
};

const setDestination = data => {
  return {
    type: SetDestination,
    payload: data,
  };
};

const setMode = data => {
  return {
    type: SetMode,
    payload: data,
  };
};

export {
  saveLoginUser,
  saveAccess_token,
  setLoader,
  setSource,
  setDestination,
  setMode,
};
