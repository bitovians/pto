import { useTokenStore } from "..";

export function logout(): void {
  try {
    useTokenStore.setState({
      refreshToken: "",
      accessToken: "",
      accessTokenExpiresAt: "",
    });
  } catch (error) {
    console.log(error);
  }
}
