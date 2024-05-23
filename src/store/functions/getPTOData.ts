import { getToken } from ".";
import { axiosPTO, getConfigParams } from "..";

export async function getPTOData() {
  try {
    await getToken();
    const res = await axiosPTO().get("/pto", {
      params: getConfigParams(),
    });
    const PTOData = res.data;
    return PTOData;
  } catch (error: any) {
    console.log(error)
  }
}
