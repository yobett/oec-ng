import * as moment from 'moment';
import { ExPair } from './ex-pair';
import { mergeTsData } from '../../10-common/utils';
import { Exch } from '../sys/exch';

export interface Kline {
  ts: number;
  open: number;
  close: number;
  high: number;
  low: number;
  vol?: number; // 交易货币的数量
  volQuote?: number; // 计价货币的数量

  dts: string; // date time string
}

export interface PairKline extends Kline {
  pair: ExPair;
  symbol: string;
  avgPrice: number;
  changePercent: number;
  lowHighPercent?: number;
}


export class KlineDataHolder {

  private dataCache: Map<string, Kline[]> = new Map<string, Kline[]>();

  genKey(form: KlineQueryForm): string {
    return `${form.ex}-${form.pair.id}-${form.intervalOption.value}`;
  }


  getData(form: KlineQueryForm): Kline[] {
    const key = this.genKey(form);
    return this.dataCache.get(key);
  }

  merge(form: KlineQueryForm, newKlines: Kline[]): Kline[] {
    KlineDataHolder.makeSureOldToNew(newKlines);
    KlineDataHolder.genDts(form, newKlines);
    const key = this.genKey(form);
    let data = this.dataCache.get(key);
    if (data) {
      data = mergeTsData(data, newKlines) as Kline[];
    } else {
      data = newKlines;
    }
    this.dataCache.set(key, data);
    return data;
  }

  static makeSureOldToNew(klines: Kline[]): void {
    if (klines.length < 2) {
      return;
    }
    const first = klines[0];
    const last = klines[klines.length - 1];
    if (first.ts > last.ts) {
      klines.reverse();
    }
  }

  static genDts(form: KlineQueryForm, klines: Kline[]): void {
    const interval = form.intervalOption.key;
    let format;
    if (interval.endsWith('m')) {
      format = 'MM-DD HH:mm';
    } else if (interval.endsWith('H')) {
      format = 'MM-DD HH:00';
    } else if (interval.endsWith('D') || interval.endsWith('W')) {
      format = 'YYYY-MM-DD';
    } else if (interval.endsWith('M')) {
      format = 'YYYY-MM';
    } else if (interval.endsWith('Y')) {
      format = 'YYYY';
    } else {
      return;
    }

    klines.forEach(kline => {
      const mom = moment(kline.ts);
      //mom.utcOffset(8);
      kline.dts = mom.format(format);
    });
  }
}


export interface IntervalOption {
  key: string;
  value: string;
  label: string;
}

export class KlineQueryForm {
  ex: string = Exch.DefaultExch;
  pair: ExPair;
  intervalOption: IntervalOption;
  limit: number = KlineQueryForm.DefaultLimit;
  olderThan?: number;
  newerThan?: number;

  noMoreData = false;

  static DefaultLimit = 100;

  static Intervals = '1m/5m/15m/1H/4H/1D/1W/1M'.split('/').map(i => ({key: i, label: i}));

  static IntervalsMap = new Map<string, string>(KlineQueryForm.Intervals.map(kl => [kl.key, kl.label]));

  static IntervalKey15m = '15m';

  // BA
  // interval: 1m/3m/5m/15m/30m/1h/2h/4h/6h/8h/12h/1d/3d/1w/1M
  // limit: default 500, max 1000
  static IntervalsBa: IntervalOption[] = '1m/3m/5m/15m/30m/1h/2h/4h/6h/8h/12h/1d/3d/1w/1M'
    .split('/')
    .map(value => {
      let key = value;
      if (!key.endsWith('m')) {
        key = key.toUpperCase();
      }
      return {key, value, label: KlineQueryForm.IntervalsMap.get(key)};
    })
    .filter(kl => kl.label);

  // OE
  // bar: 1m/3m/5m/15m/30m/1H/2H/4H/6H/12H/1D/1W/1M/3M/6M/1Y
  // limit: default 100, max 100
  // max: 1440
  static IntervalsOe: IntervalOption[] = '1m/3m/5m/15m/30m/1H/2H/4H/6H/12H/1D/1W/1M/3M/6M/1Y'
    .split('/')
    .map(value => ({key: value, value, label: KlineQueryForm.IntervalsMap.get(value)}))
    .filter(kl => kl.label);

  // HB
  // period: 1min/5min/15min/30min/60min/4hour/1day/1mon/1week/1year
  // limit: default 150, max 2000
  static IntervalsHb: IntervalOption[] = '1min/5min/15min/30min/60min/4hour/1day/1week/1mon/1year'
    .split('/')
    .map(value => {
      let key;
      if (value === '60min') {
        key = '1H';
      } else if (value === '1mon') {
        key = '1M';
      } else {
        key = value.replace(/([a-z])[a-z]+/, '$1'); // 1day -> 1d
        if (!key.endsWith('m')) {
          key = key.toUpperCase(); // 1d -> 1D
        }
      }
      return {key, value, label: KlineQueryForm.IntervalsMap.get(key)};
    })
    .filter(kl => kl.label);


  static ExIntervals: { [ex: string]: IntervalOption[] } = {
    ba: KlineQueryForm.IntervalsBa,
    oe: KlineQueryForm.IntervalsOe,
    hb: KlineQueryForm.IntervalsHb
  };

  static ExLimits = {
    ba: [50, 100, 300, 1000],
    oe: [50, 100],
    hb: [50, 100, 300, 1000, 2000]
  };

  static ExMaxDataSizes = {
    ba: 1000,
    oe: 1440,
    hb: 2000
  }

}
