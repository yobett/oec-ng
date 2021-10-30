import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Ccy } from '../../models/mar/ccy';
import { Strategy } from '../../models/str/strategy';
import { StrategyService } from '../../services/str/strategy.service';
import { PairService } from '../../services/mar/pair.service';
import { EffectDigitsPipe } from '../../10-common/pipe/effect-digits-pipe';
import { ExPair } from '../../models/mar/ex-pair';
import { CurrentPrice } from '../../models/mar/pair-price';
import { Asset } from '../../models/per/asset';
import { AssetService } from '../../services/per/asset.service';


export interface StrategyExPair {
  selected: boolean;
  newStrategy: boolean;
  pair: ExPair;
  strategy?: Strategy;
  baseAsset?: Asset;
  currentPrice?: CurrentPrice;
}


@Component({
  selector: 'app-strategy-edit-many',
  templateUrl: './strategy-edit-many.component.html',
  styleUrls: ['./strategy-edit-many.component.css']
})
export class StrategyEditManyComponent implements OnInit {

  statusOptions = Strategy.StatusOptions;
  CoinLogoPath = Ccy.LogoPath;

  ex: string;
  strategyType: string;
  strategyExPairs: StrategyExPair[] = [];

  getTypeLabel = Strategy.getTypeLabel;

  strategy: Strategy;
  clearPeak = false;
  resetBasePoint = false;

  saving = false;
  drawbackField = false;

  constructor(private strategyService: StrategyService,
              private pairService: PairService,
              private assetService: AssetService,
              private effectDigits: EffectDigitsPipe,
              private snackBar: MatSnackBar,
              private activatedRoute: ActivatedRoute) {

    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      this.ex = params.get('ex');
      const type = params.get('type');
      this.strategyType = type.toUpperCase();
      this.strategy = new Strategy(this.strategyType);
      this.strategy.ex = this.ex;
      this.strategy.status = 'started';
      this.strategy.applyOrder = 60;
      this.drawbackField = this.strategy.type === Strategy.TypeLB || this.strategy.type === Strategy.TypeHS;
    });
  }


  ngOnInit() {

  }


  expectingPercentChanged() {
    const strategy = this.strategy;
    const ep = +strategy.expectingPercent;
    if (!ep) {
      return;
    }
    const basePoint = +strategy.basePoint;
    strategy.expectingPoint = basePoint * (100 + ep * (strategy.watchDirection === 'up' ? 1 : -1)) / 100.0;
  }

  private checkTemplate(): boolean {
    const strategy = this.strategy;
    if (!strategy.expectingPercent) {
      this.strategyService.showErrorMessage('未设置期望');
      return false;
    }
    if (this.drawbackField && !strategy.drawbackPercent) {
      this.strategyService.showErrorMessage('未设置最大允许回落');
      return false;
    }
    return true;
  }

  save() {
    const toSaveSeps = this.strategyExPairs.filter(sep => sep.selected);
    if (toSaveSeps.length === 0) {
      return;
    }
    if (!this.checkTemplate()) {
      return;
    }
    if (this.strategy.tradeVolByValue) {
      this.strategy.tradeVolPercent = null;
    } else {
      this.strategy.tradeVol = null;
    }

    const strategies: Strategy[] = [];
    let newCount = 0;
    let editCount = 0;

    const strategyExPairMap = new Map<string, StrategyExPair>();

    for (const sep of toSaveSeps) {
      let {pair, strategy, currentPrice, baseAsset} = sep;
      if (!currentPrice) {
        continue;
      }
      if (sep.newStrategy && !strategy) {
        strategy = new Strategy(this.strategyType);
        strategy.baseCcy = pair.baseCcy;
        strategy.quoteCcy = pair.quoteCcy;
        strategy.symbol = pair[this.ex + 'Symbol'];
      }
      Object.assign(strategy, this.strategy);
      if (sep.newStrategy) {
        newCount++;
        strategy.basePoint = currentPrice.price;
      } else {
        editCount++;
        if (this.resetBasePoint) {
          strategy.basePoint = currentPrice.price;
        }
        if (this.clearPeak) {
          strategy.peak = null;
          strategy.peakTime = null;
          strategy.valley = null;
          strategy.valleyTime = null;
          strategy.beyondExpect = false;
        }
      }
      const sign = strategy.watchDirection === 'up' ? 1 : -1;
      strategy.expectingPoint = (+strategy.basePoint) * (100 + strategy.expectingPercent * sign) / 100.0;
      strategies.push(strategy);

      const key = `${pair.baseCcy}-${pair.quoteCcy}`;
      strategyExPairMap.set(key, sep);
    }

    this.saving = true;
    this.strategyService.saveMany(strategies)
      .subscribe(sts => {
          this.saving = false;
          for (const st of sts) {
            const key = `${st.baseCcy}-${st.quoteCcy}`;
            const sep = strategyExPairMap.get(key);
            if (sep) {
              sep.strategy = st;
              sep.newStrategy = false;
            }
          }
          this.snackBar.open(`保存成功。新建：${newCount}，修改：${editCount}`);
        },
        error => this.saving = false,
        () => this.saving = false);

  }

  goback() {
    window.history.back();
  }
}
