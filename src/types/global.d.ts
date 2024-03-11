interface PTO {
  totalAccrued: number;
  totalUsed: number;
  totalAvailable: number;
  totalRemainingInYear: number;
  startingDate: string;
  accruals: {
    accrued: number;
    total: number;
    start: string;
    end: string;
    note: string;
  }[];
  deductions: {
    id: number;
    identity_id: number;
    is_logged: boolean;
    local_started_at: string;
    local_timezone: string;
    started_at: string;
    created_at: string;
    client_id: number;
    project_id: number;
    service_id: number;
    note: string;
    active: boolean;
    billable: boolean;
    billed: boolean;
    internal: boolean;
    duration: number;
    total: number;
  }[];
}

interface TokenStore {
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: string;
}
