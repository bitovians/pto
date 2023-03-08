interface PTO {
  totalAccrued: {
    days: string;
    hours: string;
  };
  totalAvailable: {
    days: string;
    hours: string;
  };
}

interface RefreshStore {
  refreshToken: string;
  setRefreshToken: (token: string) => void;
}
