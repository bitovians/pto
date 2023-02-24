import axios from "axios";
import jwtDecode from "jwt-decode";
import { DecodedToken, usePTOStore } from "../";
import { getURLCode } from ".";

export async function getToken() {
  const state = usePTOStore.getState();
  const { token } = state;
  try {
    if (token) {
      const decoded = jwtDecode<DecodedToken>(token);
      const now = new Date().getTime() / 1000;
      if (decoded.exp > now) {
        return state.token;
      }
    }
    const code = getURLCode();
    if (code) {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/token`,
        {
          code,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const access_token = res.data.data.access_token;
      usePTOStore.setState({ token: access_token });
      return access_token;
    }
  } catch (error) {
    console.log(error);
  }
}
