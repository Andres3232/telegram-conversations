export const JWT_SERVICE = 'JwtServicePort';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtServicePort {
  sign(payload: JwtPayload): Promise<string>;
  verify(token: string): Promise<JwtPayload>;
}
