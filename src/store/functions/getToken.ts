import axios from "axios";
import { getURLCode } from ".";
import { useRefreshStore } from "..";

export async function getToken() {
  try {
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
      const { accessToken, refreshToken } = res.data.data;
      useRefreshStore.setState({ refreshToken });
      return accessToken;
    }
  } catch (error) {
    console.log(error);
  }
}
