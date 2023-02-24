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

export interface PTOStore {
  token: string | undefined;
  setToken: (token: string) => void;
}

export interface DecodedToken {
  "auth.freshbooks.com/public_api_version": string;
  "auth.freshbooks.com/sub_type": string;
  client_id: string;
  exp: number;
  iat: number;
  jti: string;
  scope: string;
  sub: string;
}
