import { getURLCode } from ".";
import { useTokenStore, axiosPTO } from "..";
import { getNewToken } from ".";

export async function getToken() {
  try {
    const code = getURLCode();
    if (code) {
      // check for existing token
      const { accessToken: currentToken, accessTokenExpiresAt } =
        useTokenStore.getState();
      if (currentToken) {
        const now = new Date();
        const expiresAt = new Date(accessTokenExpiresAt);
        if (now < expiresAt) {
          console.log("token still valid, not getting new one");
          return;
        }
        console.log("token expired, getting new one");
        await getNewToken();
        return;
      }
      console.log("no token, getting new one");
      const res = await axiosPTO().post(
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
      const { accessToken, refreshToken, accessTokenExpiresAt: newExpiry } = res.data.data;
      useTokenStore.setState({ refreshToken, accessToken, accessTokenExpiresAt: newExpiry });
    }
  } catch (error) {
    console.log(error);
  }
}
