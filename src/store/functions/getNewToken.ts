import axios from "axios";
import { useRefreshStore, axiosStore } from "..";

export async function getNewToken() {
  try {
    const {refreshToken} = useRefreshStore.getState();
    const { axiosPTO } = axiosStore.getState();
    const res = await axiosPTO.post(
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
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
    useRefreshStore.setState({ refreshToken: newRefreshToken });
    axiosStore.getState().setAccessToken(accessToken);
  } catch (error) {
    console.log(error);
  }
}
