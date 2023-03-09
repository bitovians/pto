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

interface TokenStore {
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string;
}
