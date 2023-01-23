/** @format */

import React, { FC, useReducer } from "react";
import axios from "axios";
import Context from "./context";
import reducer from "./reducer";
import {
  PTO_LOADED,
  STORAGE_PROP,
  USER_LOGIN_FAIL,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
  ERROR,
  SERVER_URL,
} from "./const";

const apiBaseURL = window.location.origin.includes("localhost")
  ? "http://localhost:4000"
  : SERVER_URL;

const StateManagement: FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState = {
    token: window.localStorage.getItem(STORAGE_PROP),
    loading: true,
    totalAccruedHours: 0,
    totalAccruedDays: 0,
    totalAvailableHours: 0,
    totalAvailableDays: 0,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    token,
    loading,
    totalAccruedHours,
    totalAccruedDays,
    totalAvailableHours,
    totalAvailableDays,
  } = state;

  const authenticate = async () => {
    try {
      const url = new URLSearchParams(window.location.search);
      const code = url.get("code");

      if (code) {
        const res = await axios.post(
          apiBaseURL + "/token",
          {
            code,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        dispatch({ type: USER_LOGIN_SUCCESS, payload: res.data });
      } else if (!token) {
        window.location.replace(apiBaseURL + "/url");
      }
    } catch (error) {
      dispatch({ type: USER_LOGIN_FAIL });
    }
  };

  const getPTO = async () => {
    try {
      const res = await axios.get(apiBaseURL + "/pto", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      dispatch({ type: PTO_LOADED, payload: res.data });
    } catch (error) {
      dispatch({ type: ERROR });
    }
  };

  // Logout User
  const logoutUser = () => dispatch({ type: USER_LOGOUT });

  const value = {
    token,
    loading,
    totalAccruedHours,
    totalAccruedDays,
    totalAvailableHours,
    totalAvailableDays,
    authenticate,
    getPTO,
    logoutUser,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export default StateManagement;
