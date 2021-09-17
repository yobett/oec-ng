import { Model } from '../model';
import { ExchangePairsResult } from '../mar/ex-pair';

export class Asset extends Model {

  ex: string;
  ccy: string;
  holding: number;
  frozen: number;
  lastSync: string;

  price?: number;
  holdingValue?: number;
  frozenValue?: number;

  pairsResult?: ExchangePairsResult;
}

export class MergedAsset {
  ccy: string;
  ccyConcerned = false;
  holding: number = 0.0;
  frozen: number = 0.0;
  price: number = 0.0;
  holdingValue: number = 0.0;
  frozenValue: number = 0.0;

  exs: string[] = [];
  holdingDetail: [string, number][] = [];
  frozenDetail: [string, number][] = [];
  holdingValueDetail: [string, number][] = [];
  frozenValueDetail: [string, number][] = [];

  _holdingTooltip?: string;
  _frozenTooltip?: string;
  _holdingValueTooltip?: string;
  _frozenValueTooltip?: string;

  static holdingTooltip(ma: MergedAsset): string {
    if (!ma) {
      return null;
    }
    if (ma.exs.length === 1) {
      return null;
    }
    if (ma._holdingTooltip) {
      return ma._holdingTooltip;
    }

    let tooltip = ma.holdingDetail
      .map(([ex, holding]) => `${ex}: ${holding}`)
      .join('\n');
    ma._holdingTooltip = tooltip;

    return tooltip;
  }

  static holdingValueTooltip(ma: MergedAsset): string {
    if (!ma) {
      return null;
    }
    if (ma.exs.length === 1) {
      return null;
    }
    if (ma._holdingValueTooltip) {
      return ma._holdingValueTooltip;
    }

    let tooltip = ma.holdingValueDetail
      .map(([ex, holdingValue]) => `${ex}: ${holdingValue}`)
      .join('\n');
    ma._holdingValueTooltip = tooltip;

    return tooltip;
  }

  static frozenTooltip(ma: MergedAsset): string {
    if (!ma) {
      return null;
    }
    if (ma.exs.length === 1) {
      return null;
    }
    if (ma._frozenTooltip) {
      return ma._frozenTooltip;
    }

    let tooltip = ma.frozenDetail
      .map(([ex, frozen]) => `${ex}: ${frozen}`)
      .join('\n');
    ma._frozenTooltip = tooltip;

    return tooltip;
  }

  static frozenValueTooltip(ma: MergedAsset): string {
    if (!ma) {
      return null;
    }
    if (ma.exs.length === 1) {
      return null;
    }
    if (ma._frozenValueTooltip) {
      return ma._frozenValueTooltip;
    }

    let tooltip = ma.frozenValueDetail
      .map(([ex, frozenValue]) => `${ex}: ${frozenValue}`)
      .join('\n');
    ma._frozenValueTooltip = tooltip;

    return tooltip;
  }


  static merge(assets: Asset[]): MergedAsset[] {

    assets.sort((a1, a2) => +a2.holding - (+a1.holding));

    const ccyMap: Map<string, MergedAsset> = new Map();

    for (const ass of assets) {
      const {ex, ccy, holding, frozen, price, holdingValue, frozenValue} = ass;
      let merged: MergedAsset = ccyMap.get(ccy);
      if (!merged) {
        merged = new MergedAsset();
        merged.ccy = ccy;
        ccyMap.set(ccy, merged);
      }
      merged.price = price;
      const holdingN = +holding || 0;
      if (merged.exs.length > 0) {
        if (holdingN * 1000.0 < merged.holding) {
          continue;
        }
      }
      const frozenN = +frozen || 0;
      const holdingValueN = +holdingValue || 0;
      const frozenValueN = +frozenValue || 0;
      merged.holding = merged.holding + holdingN;
      merged.frozen = merged.frozen + frozenN;
      merged.holdingValue = merged.holdingValue + holdingValueN;
      merged.frozenValue = merged.frozenValue + frozenValueN;
      merged.exs.push(ex);
      merged.holdingDetail.push([ex, holdingN]);
      merged.frozenDetail.push([ex, frozenN]);
      merged.holdingValueDetail.push([ex, holdingValueN]);
      merged.frozenValueDetail.push([ex, frozenValueN]);
    }

    return Array.from(ccyMap.values());
  }
}
