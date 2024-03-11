import { getToken } from ".";
import { axiosPTO } from "..";

export async function getPTOData() {
  try {
    const queryParams = new URLSearchParams(window.location.search);
    await getToken();
    const res = await axiosPTO().get("/pto", {
      params: {
        start: queryParams.get("start"),
        end: queryParams.get("end"),
        increments: queryParams.get("increments"),
      },
    });
    const PTOData = res.data;
    return PTOData;
  } catch (error: any) {
    console.log(error)
  }
}
