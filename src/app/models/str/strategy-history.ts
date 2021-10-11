import { Strategy } from './strategy';
import { SpotOrder } from '../per/spot-order';

export class StrategyHistory extends Strategy {
  sid: number;

  order?: SpotOrder;
}

export interface StrategyHistoryFilter {
  type?: string;
  ex?: string;
  side?: string;
  baseCcy?: string;
  orderPlacedDateTo?: string; // 2021-10-11
}
