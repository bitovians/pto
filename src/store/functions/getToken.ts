import { getURLCode } from ".";
import { useRefreshStore, axiosStore } from "..";

export async function getToken() {
  try {
    const code = getURLCode();
    if (code) {
      // check for existing token
      const { axiosPTO } = axiosStore.getState();
      const currentToken = axiosPTO.defaults.headers.common["Authorization"];
      if (currentToken) {
        return;
      }
      const res = await axiosStore.getState().axiosPTO.post(
        `/token`,
        {
          code,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const { accessToken, refreshToken } = res.data.data;
      useRefreshStore.setState({ refreshToken });
      axiosStore.getState().setAccessToken(accessToken);
    }
  } catch (error) {
    console.log(error);
  }
}
