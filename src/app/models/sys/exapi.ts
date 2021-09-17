import { Model } from '../model';

export class Exapi extends Model {

  static EX_CMC = 'cmc';

  ex: string;
  phase: string;
  key: string;
  secret: string;
  memo: string;
  enabled: boolean;
  no: number;
  updatedAt: string;
}
