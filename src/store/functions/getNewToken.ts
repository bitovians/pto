import axios from "axios";
import { useRefreshStore } from "..";

export async function getNewToken() {
  try {
    const refreshToken = useRefreshStore.getState().refreshToken;
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/refresh`,
      {
        refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
    useRefreshStore.setState({ refreshToken: newRefreshToken });
    return accessToken;
  } catch (error) {
    console.log(error);
  }
}
