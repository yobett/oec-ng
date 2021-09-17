import { Model } from '../model';
import { ExPair } from '../mar/ex-pair';
import { SpotOrder } from './spot-order';

export class LastTransaction extends Model {
  oid: number;
  baseCcy: string;
  quoteCcy: string;
  side: string;
  avgPrice: number;
  execQty: number;
  quoteAmount: number;
  ex: string;
  updateTs: number;

  pair?: ExPair;
  order?: SpotOrder;
}
