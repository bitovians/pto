import { useTokenStore, axiosPTO } from "..";

export async function getNewToken() {
  try {
    const { refreshToken } = useTokenStore.getState();
    const res = await axiosPTO().post(
      `/refresh`,
      {
        refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { accessToken, refreshToken: newRefreshToken, accessTokenExpiresAt } = res.data.data;
    useTokenStore.setState({ refreshToken: newRefreshToken, accessToken, accessTokenExpiresAt });
  } catch (error) {
    console.log(error);
  }
}
