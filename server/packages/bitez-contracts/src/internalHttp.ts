/** Shared shapes for service-to-service HTTP (internal routes). */

export interface InternalUserResponse {
  _id: string;
  name: string;
  phoneNumber?: string;
}

export interface TokenRevokedRequest {
  token: string;
}

export interface TokenRevokedResponse {
  revoked: boolean;
}

export interface DeliveredToResponse {
  delivered: boolean;
}
