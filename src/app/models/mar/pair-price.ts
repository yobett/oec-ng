import { LastTransaction } from '../per/last-transaction';
import { ExPair } from './ex-pair';

export declare type CurrentPrice = { source: string, price: number };
export declare type CurrentPrices = { [key: string]: CurrentPrice };

export class PairPrice extends ExPair {

  lastTrans?: LastTransaction;

  currentPrice?: CurrentPrice;

  // priceChange?: number;

  priceChangePercent?: number

  static priceKey(pair: ExPair): string {
    return `${pair.baseCcy}-${pair.quoteCcy}`;
  }
}
