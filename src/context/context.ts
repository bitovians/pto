import { createContext } from "react";

interface Context {
  token: any;
  loading: any;
  totalAccruedHours: any;
  totalAccruedDays: any;
  totalAvailableHours: any;
  totalAvailableDays: any;
  authenticate: () => Promise<void>;
  getPTO: () => Promise<void>;
  logoutUser: () => void;
}

const Context = createContext<Context>({} as Context);

export default Context;
