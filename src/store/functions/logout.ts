import axios from "axios";

export async function logout(): Promise<boolean> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/logout`
    );
    return response.status === 200;
  } catch (error) {
    console.log(error);
    return false;
  }
}
