import axios from "axios";
import { getToken } from ".";

export async function getPTOData() {
  try {
    const token = await getToken();
    if (token) {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pto`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const PTOData = res.data;
      return PTOData;
    }
    return null;
  } catch (error) {
    console.log(error);
  }
}
