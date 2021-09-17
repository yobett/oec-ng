import { Model } from '../model';

export interface ExchangePair {
  ex: string;
  baseCcy: string;
  quoteCcy: string;
  symbol: string;
}

export interface ExchangePairsResult {
  ccy: string;
  asBase: ExchangePair[];
  asQuote: ExchangePair[];
}

export class ExPair extends Model {
  baseCcy: string;
  quoteCcy: string;
  concerned: boolean;

  baSymbol: string;
  oeSymbol: string;
  hbSymbol: string;
}

export class ExPairFilter {
  ex: string;
  baseCcy: string;
  quoteCcy: string;
  concerned: boolean;
}
