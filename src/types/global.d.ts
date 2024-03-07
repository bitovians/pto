interface PTO {
  allTimeAccrued: {
    days: string;
    hours: string;
  };
  totalAccrued: {
    days: string;
    hours: string;
  };
  totalAvailable: {
    days: string;
    hours: string;
  };
  startingDate;
  string;
}

interface TokenStore {
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string;
}
