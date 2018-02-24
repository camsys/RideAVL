import { User } from '../models/user';

export class Session {
  username: string;
  authentication_token: string;
  user?: User;
}
