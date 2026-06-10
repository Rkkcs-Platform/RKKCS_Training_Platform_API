import { UserRole } from '../../common/enums';

export type JwtTokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: JwtTokenType;
}
