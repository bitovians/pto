import { getToken } from ".";
import { axiosPTO } from "..";

export async function getPTOData() {
  try {
    await getToken();
    const res = await axiosPTO().get("/pto");
    const PTOData = res.data;
    return PTOData;
  } catch (error: any) {
    console.log(error)
  }
}
