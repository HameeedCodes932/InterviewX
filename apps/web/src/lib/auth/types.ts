export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};
