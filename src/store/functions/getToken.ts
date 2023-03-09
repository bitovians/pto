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
          return;
        }
        await getNewToken();
        return;
      }
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
