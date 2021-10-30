import { Model } from '../model';
import { mergeTsData } from '../../10-common/utils';

export class SpotOrder extends Model {
  ex: string;
  pairSymbol: string;
  baseCcy: string;
  quoteCcy: string;
  orderId: string;
  clientOrderId: string;
  side: string;
  type: string;
  status: string;
  askPrice: number;
  askQty: number;
  avgPrice: number;
  execQty: number;
  quoteAmount: number;
  createTs: number;
  updateTs: number;

  ts: number; //createTs
  // dts: string; // createTs Label
}

export interface SpotOrderFilter {
  ex?: string;
  pairSymbolLike?: string;
  baseCcy?: string;
  quoteCcy?: string;
  createTsTo?: number;
}

export class OrderTimeLineQueryForm {
  ex: string = 'all';
  limit: number;
  olderThan?: number; // createTs

  noMoreData = false;
}


export class OrderChartDataHolder {

  private dataCache: Map<string, SpotOrder[]> = new Map<string, SpotOrder[]>();
  private noMoreDataSet: Set<string> = new Set<string>();

  clear(): void {
    this.dataCache.clear();
    this.noMoreDataSet.clear();
  }

  getData(form: OrderTimeLineQueryForm): SpotOrder[] {
    return this.dataCache.get(form.ex);
  }

  isNoMoreData(form: OrderTimeLineQueryForm): boolean {
    return this.noMoreDataSet.has(form.ex);
  }

  merge(form: OrderTimeLineQueryForm, newData: SpotOrder[]): SpotOrder[] {
    for (const order of newData) {
      order.ts = +order.createTs;
    }
    OrderChartDataHolder.makeSureOldToNew(newData);
    // OrderChartDataHolder.genDts(newData);
    const key = form.ex;
    let data = this.dataCache.get(key);
    if (data) {
      data = mergeTsData(data, newData) as SpotOrder[];
    } else {
      data = newData;
    }
    this.dataCache.set(key, data);
    if (newData.length < form.limit) {
      this.noMoreDataSet.add(key);
    }
    return data;
  }

  static makeSureOldToNew(data: SpotOrder[]): void {
    if (data.length < 2) {
      return;
    }
    const first = data[0];
    const last = data[data.length - 1];
    if (first.ts > last.ts) {
      data.reverse();
    }
  }

  /*
  static genDts(data: SpotOrder[]): void {
    data.forEach(order => {
      const mom = moment(+order.ts);
      //mom.utcOffset(8);
      order.dts = mom.format('MM-DD HH:mm');
    });
  }*/
}
