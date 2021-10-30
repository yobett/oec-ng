import * as moment from 'moment';
import { Model } from '../model';
import { mergeTsData } from '../../10-common/utils';

export class AssetSnapshot extends Model {

  static CcyAll = '-all-';

  ts: number;
  hour: number; // 0-23

  ccy: string; // BTC,ETH,...,all
  holding: number;

  price: number;
  holdingValue: number;

  dts: string; // date time string
}

export class AssetSnapshotQueryForm {
  ccy: string;
  limit: number;
  olderThan?: number;
  newerThan?: number;
  hour?: number;
  hourMod?: number;

  noMoreData = false;
}

export class AssetSnapshotDataHolder {

  private dataCache: Map<string, AssetSnapshot[]> = new Map<string, AssetSnapshot[]>();
  private noMoreDataSet: Set<string> = new Set<string>();

  clear(): void {
    this.dataCache.clear();
    this.noMoreDataSet.clear();
  }

  getData(form: AssetSnapshotQueryForm): AssetSnapshot[] {
    return this.dataCache.get(form.ccy);
  }

  isNoMoreData(form: AssetSnapshotQueryForm): boolean {
    return this.noMoreDataSet.has(form.ccy);
  }

  merge(form: AssetSnapshotQueryForm, newData: AssetSnapshot[]): AssetSnapshot[] {
    AssetSnapshotDataHolder.makeSureOldToNew(newData);
    AssetSnapshotDataHolder.genDts(newData);
    const key = form.ccy;
    let data = this.dataCache.get(key);
    if (data) {
      data = mergeTsData(data, newData) as AssetSnapshot[];
    } else {
      data = newData;
    }
    this.dataCache.set(key, data);
    if (newData.length < form.limit) {
      this.noMoreDataSet.add(key);
    }
    return data;
  }

  static makeSureOldToNew(data: AssetSnapshot[]): void {
    if (data.length < 2) {
      return;
    }
    const first = data[0];
    const last = data[data.length - 1];
    if (first.ts > last.ts) {
      data.reverse();
    }
  }

  static genDts(data: AssetSnapshot[]): void {
    data.forEach(snapshot => {
      const mom = moment(+snapshot.ts);
      //mom.utcOffset(8);
      snapshot.dts = mom.format('MM-DD HH:mm');
    });
  }
}
