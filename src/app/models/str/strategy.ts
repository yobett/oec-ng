import { Model } from '../model';

export class Strategy extends Model {
  static TypeLB = 'LB';
  static TypeHS = 'HS';
  static TypeLS = 'LS';
  static TypeHB = 'HB';
  static Types = [Strategy.TypeLB, Strategy.TypeHS, Strategy.TypeLS, Strategy.TypeHB];

  static TypeLabels = {
    [Strategy.TypeLB]: '低买',
    [Strategy.TypeHS]: '高卖',
    [Strategy.TypeLS]: '止损',
    [Strategy.TypeHB]: '跟涨',
  };

  static TypeOptions = Strategy.Types.map(type => ({value: type, label: Strategy.TypeLabels[type]}));

  static getTypeLabel(type: string): string {
    return Strategy.TypeLabels[type] || type;
  }

  static StatusOptions = [
    {value: 'initial', label: '初始'},
    {value: 'started', label: '开始'},
    {value: 'paused', label: '暂停'},
  ];
  // static WatchLevelOptions = ['loose', 'medium', 'intense'].map(s => ({
  //   value: s,
  //   label: s.substring(0, 1).toUpperCase() + s.substr(1)
  // }));

  constructor(type: string) {
    super();
    this.type = type;
    if (this.type === Strategy.TypeHS) {
      this.watchDirection = 'up';
      this.side = 'sell';
    } else if (this.type === Strategy.TypeHB) {
      this.watchDirection = 'up';
      this.side = 'buy';
      this.updateBasePoint = true;
    } else if (this.type === Strategy.TypeLS) {
      this.watchDirection = 'down';
      this.side = 'sell';
      this.updateBasePoint = true;
    } else if (this.type === Strategy.TypeLB) {
      this.watchDirection = 'down';
      this.side = 'buy';
    }
  }

  ex: string;
  symbol: string;
  baseCcy: string;
  quoteCcy: string;
  type: string;
  side: 'buy' | 'sell';
  watchDirection: 'up' | 'down';

  applyOrder?: number = 50;

  basePoint?: number;

  expectingPercent?: number;
  expectingPoint?: number;

  drawbackPercent?: number;
  tradingPoint?: number;

  intenseWatchPercent?: number;
  mediumWatchPercent?: number;

  peak?: number;
  peakTime?: Date;

  valley?: number;
  valleyTime?: Date;

  beyondExpect?: boolean;

  tradeVol?: number; // base for sell, quote for buy
  tradeVolPercent?: number = 100; // base for sell, quote for buy
  tradeVolByValue = false

  firstCheckAt?: Date;
  lastCheckAt?: Date;
  lastCheckPrice?: number;

  orderPlacedAt?: Date;
  clientOrderId?: string;

  completedAt?: Date;

  autoStartNext: boolean;
  updateBasePoint: boolean;

  watchLevel: 'loose' | 'medium' | 'intense' = 'loose';
  status: 'initial' | 'started' | 'paused' | 'placed' = 'initial';
}


export interface StrategyFilter {
  type?: string;
  ex?: string;
  side?: string;
  status?: string;
}
