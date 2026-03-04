export interface SignupInput {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  role: string;
}

export interface SignupResult {
  token: string;
  user: { id: unknown; name: string; email: string; role: string };
}

export interface SigninInput {
  email: string;
  password: string;
}

export interface SigninResult {
  token: string;
  user: { id: unknown; role: string };
}

export interface LogoutInput {
  token: string;
}

export interface LogoutResult {
  message: string;
}

export interface GetCurrentUserInput {
  userId: string;
}
