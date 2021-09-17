import {Model} from '../model';

export class User extends Model {
  username: string;
  role?: string;
  email?: string;
}
