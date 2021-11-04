import { ExchangePair } from '../mar/ex-pair';

export class OrderForm implements ExchangePair {
  ex: string;
  symbol: string;
  side: 'buy' | 'sell' = 'buy';
  type: 'market' | 'limit' = 'market';
  quantity?: number;
  quoteQuantity?: number;
  price?: number; // type=limit

  baseCcy: string;
  quoteCcy: string;
}

export class CancelOrderForm {
  ex: string;
  orderId: string;
  symbol?: string;
  waitSyncAssets?: boolean;
}


export interface PlaceOrderResult {
  orderId: string;
}

export interface BatchPlaceOrderResult extends PlaceOrderResult {
  ex: string;
  symbol: string;
  success: boolean;
  message?: string;
}

