import axios from "axios";
import { useContext, useState } from "react";

import { STORAGE_PROP } from "../../const";
import { Context } from "../../StateManagement";

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
  const { token, apiBaseURL } = useContext(Context);

  const getPTO = async () => {
    try {
      setLoading(true);

      console.log({ token });

      const res = await axios.get("http://localhost:4000" + "/pto", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      const { totalAccrued, totalAvailable } = res.data.payload;

      return { totalAccrued, totalAvailable };
    } catch (error) {
      console.log({ error });

      // localStorage.removeItem(STORAGE_PROP);
    } finally {
      setLoading(false);
    }
  };

  return {
    getPTO: getPTO,
    loading,
  };
}
