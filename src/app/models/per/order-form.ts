export class OrderForm {
  symbol: string;
  side: 'buy' | 'sell' = 'buy';
  type: 'market' | 'limit' = 'market';
  quantity?: number;
  quoteQuantity?: number;
  price?: number; // type=limit

  baseCcy?: string;
  quoteCcy?: string;
}

export class CancelOrderForm {
  orderId: string;
  symbol?: string;
}
