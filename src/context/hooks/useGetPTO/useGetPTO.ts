import axios from "axios";
import { useState } from "react";

import { useGetToken } from "../useGetToken";

export interface PTO {
  totalAccrued: {
    days: string;
    hours: string;
  };
  totalAvailable: {
    days: string;
    hours: string;
  };
}

export function useGetPTO(): {
  getPTO: () => Promise<PTO | undefined>;
  loading: boolean;
} {
  const [loading, setLoading] = useState<boolean>(false);
  const { getToken } = useGetToken();

  const getPTO = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.get("http://localhost:4000" + "/pto", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log({ res });

      const { totalAccrued, totalAvailable } = res.data;

      return { totalAccrued, totalAvailable };
    } catch (error) {
      console.log({ error });

      // localStorage.removeItem(STORAGE_PROP);
    } finally {
      setLoading(false);
    }
  };

  return {
    getPTO,
    loading,
  };
}
