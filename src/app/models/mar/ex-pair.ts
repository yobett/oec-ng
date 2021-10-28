import { Model } from '../model';

export interface PairBQ {
  baseCcy: string;
  quoteCcy: string;
}

export interface ExchangePair extends PairBQ {
  ex: string;
  symbol: string;
}

export interface ExchangePairsResult {
  ccy: string;
  asBase: ExchangePair[];
  asQuote: ExchangePair[];
}

export class ExPair extends Model implements PairBQ {
  baseCcy: string;
  quoteCcy: string;
  concerned: boolean;

  baSymbol: string;
  oeSymbol: string;
  hbSymbol: string;
}

export class ExPairFilter implements PairBQ {
  ex: string;
  baseCcy: string;
  quoteCcy: string;
  concerned: boolean;
}
