/** @format */

import {
  PTO_LOADED,
  STORAGE_PROP,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAIL,
  USER_LOGOUT,
  ERROR,
} from './types'

const reducer = (state, action) => {
  switch (action.type) {
    case USER_LOGIN_SUCCESS:
      const token = action.payload.data.access_token
      localStorage.setItem(STORAGE_PROP, 'Bearer ' + token)
      window.location.replace(window.location.origin)

      return {
        ...state,
        token,
      }

    case USER_LOGOUT:
    case USER_LOGIN_FAIL:
    case ERROR:
      localStorage.removeItem(STORAGE_PROP)

      return {
        ...state,
        token: undefined,
        loading: true,
        totalAccruedHours: 0,
        totalAccruedDays: 0,
        totalAvailableHours: 0,
        totalAvailableDays: 0,
      }

    case PTO_LOADED:
      const { totalAccrued, totalAvailable } = action.payload

      return {
        ...state,
        loading: false,
        totalAccruedHours: totalAccrued.hours,
        totalAccruedDays: totalAccrued.days,
        totalAvailableHours: totalAvailable.hours,
        totalAvailableDays: totalAvailable.days,
      }

    default:
      return state
  }
}

export default reducer