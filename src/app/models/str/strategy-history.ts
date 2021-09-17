import { Strategy } from './strategy';
import { SpotOrder } from '../per/spot-order';

export class StrategyHistory extends Strategy {
  sid: number;

  order?: SpotOrder;
}
