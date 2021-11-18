import { LastTransaction } from '../per/last-transaction';
import { ExPair, PairBQ } from './ex-pair';

export declare type CurrentPrice = { source: string, price: number };
export declare type CurrentPrices = { [key: string]: CurrentPrice };

export interface PriceRequest extends PairBQ {
  ex: string;
}

export interface PriceResponse extends PriceRequest {
  symbol: string;
  price: number;
}

export class PairPrice extends ExPair {

  lastTrans?: LastTransaction;

  currentPrice?: CurrentPrice;

  // priceChange?: number;

  priceChangePercent?: number;

  strategyCount?: {
    running: number;
    all: number;
  };

  static priceKey(pair: ExPair): string {
    return `${pair.baseCcy}-${pair.quoteCcy}`;
  }
}
