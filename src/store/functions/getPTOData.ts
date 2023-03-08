import { getToken, getNewToken } from ".";
import { axiosStore } from "..";

export async function getPTOData() {
  try {
    await getToken();
    const { axiosPTO } = axiosStore.getState();
    const res = await axiosPTO.get("/pto");
    const PTOData = res.data;
    return PTOData;
  } catch (error: any) {
    // check if accesstoken is expired and refresh if it is
    if (error.status === 401) {
      await getNewToken();
      await getPTOData();
    }
    console.log(error);
  }
}
