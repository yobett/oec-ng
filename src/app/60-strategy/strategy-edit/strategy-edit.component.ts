import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import { Result } from '../../models/result';
import { Ccy } from '../../models/mar/ccy';
import { Strategy } from '../../models/str/strategy';
import { StrategyService } from '../../services/str/strategy.service';
import { PairService } from '../../services/mar/pair.service';
import { EffectDigitsPipe } from '../../10-common/pipe/effect-digits-pipe';
import { LastTransService } from '../../services/per/last-trans.service';
import { LastTransaction } from '../../models/per/last-transaction';
import { PriceService } from '../../services/mar/price.service';


@Component({
  selector: 'app-strategy-edit',
  templateUrl: './strategy-edit.component.html',
  styleUrls: ['./strategy-edit.component.css']
})
export class StrategyEditComponent implements OnInit {
  statusOptions = Strategy.StatusOptions;
  executorOptions = Strategy.ExecutorOptions;
  CoinLogoPath = Ccy.LogoPath;
  getTypeLabel = Strategy.getTypeLabel;

  strategy: Strategy;
  oriStrategy: Strategy;
  lastTransaction: LastTransaction;
  // lastPricePercent: number;

  tickerPrice: number;
  tickerPriceAdjusted: number;

  refreshingPrice = false;
  saving = false;
  drawbackField = false;
  clearPeak = false;

  constructor(private strategyService: StrategyService,
              private pairService: PairService,
              private priceService: PriceService,
              private lastTransService: LastTransService,
              private effectDigits: EffectDigitsPipe,
              private snackBar: MatSnackBar,
              private activatedRoute: ActivatedRoute) {

  }

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => this.strategyService.getById2(+params.get('id')))
    ).subscribe((strategy1: Strategy) => {
      this.oriStrategy = strategy1;
      this.strategy = {...strategy1};
      if (strategy1.status === 'initial' && !strategy1.basePoint) {
        // ????????????
        this.strategy.status = 'started';
      }
      this.drawbackField = strategy1.type === Strategy.TypeLB || strategy1.type === Strategy.TypeHS;
      this.refreshPrice();
      this.lastTransService.findLastTransaction(strategy1.baseCcy, strategy1.quoteCcy)
        .subscribe(lt => {
          if (!lt) {
            return;
          }
          this.lastTransaction = lt;
          /*if (lt.side === strategy1.side) {
            this.lastPricePercent = 100;
          } else if (lt.side === 'buy' && strategy1.side === 'sell') {
            this.lastPricePercent = 110;
          } else if (lt.side === 'sell' && strategy1.side === 'buy') {
            this.lastPricePercent = 90;
          }*/
        });
    });

  }


  refreshPrice() {
    this.refreshingPrice = true;
    this.priceService.inquirePrice(this.strategy.ex, this.strategy.symbol)
      .subscribe(price => {
          this.refreshingPrice = false;
          this.tickerPrice = +price;
          this.tickerPriceAdjusted = +this.effectDigits.transform(this.tickerPrice, 5);
          if (!this.strategy.basePoint) {
            this.strategy.basePoint = this.tickerPriceAdjusted;
          }
        },
        error => this.refreshingPrice = false,
        () => this.refreshingPrice = false);
  }

  /*setExpectingByLastTrans() {
    const lastPrice = this.lastTransaction.avgPrice;
    const lastPricePercent = +this.lastPricePercent;
    if (!lastPrice || !lastPricePercent) {
      return;
    }
    let expectingPercent = +this.strategy.expectingPercent;
    if (!expectingPercent) {
      expectingPercent = Math.abs(lastPricePercent - 100);
      this.strategy.expectingPercent = expectingPercent;
    }
    const watchUp = this.strategy.watchDirection === 'up';
    const basePoint = lastPrice * lastPricePercent / (100 + (watchUp ? expectingPercent : -expectingPercent))
    this.strategy.basePoint = +this.effectDigits.transform(basePoint, 5);
    this.expectingChanged();
  }*/

  setBasePointFromCurrentPrice() {
    this.strategy.basePoint = this.tickerPriceAdjusted;
    this.expectingChanged();
  }

  setBasePointFromLastTrans() {
    const lastPrice = this.lastTransaction.avgPrice;
    if (!lastPrice) {
      return;
    }
    this.strategy.basePoint = +this.effectDigits.transform(lastPrice, 5);
    this.expectingChanged();
  }

  undoEdit() {
    Object.assign(this.strategy, this.oriStrategy);
  }

  expectingChanged() {
    const strategy = this.strategy;
    const ep = +strategy.expectingPercent;
    if (!ep) {
      return;
    }
    const basePoint = +strategy.basePoint;
    strategy.expectingPoint = basePoint * (100 + ep * (strategy.watchDirection === 'up' ? 1 : -1)) / 100.0;
  }

  save() {
    const strategy = this.strategy;
    if (!strategy.basePoint) {
      this.strategyService.showErrorMessage('???????????????');
      return;
    }
    if (!strategy.expectingPercent) {
      this.strategyService.showErrorMessage('????????????????????????');
      return;
    }
    if (this.drawbackField && !strategy.drawbackPercent) {
      this.strategyService.showErrorMessage('????????????????????????');
      return;
    }
    if (strategy.tradeVolByValue) {
      strategy.tradeVolPercent = null;
    } else {
      strategy.tradeVol = null;
    }

    strategy.expectingPoint = (+strategy.basePoint) *
      (100 + strategy.expectingPercent * (strategy.watchDirection === 'up' ? 1 : -1)) / 100.0;

    const {
      id, status, basePoint, expectingPercent, expectingPoint, drawbackPercent,
      tradeVolByValue, tradeVolPercent, tradeVol, applyOrder,
      autoStartNext, updateBasePoint, executor
    } = strategy;

    const toSave = {
      id, status, basePoint, expectingPercent, expectingPoint, drawbackPercent,
      tradeVolByValue, tradeVolPercent, tradeVol, applyOrder,
      autoStartNext, updateBasePoint, executor
    } as Strategy;
    if (this.clearPeak) {
      toSave.peak = null;
      toSave.peakTime = null;
      toSave.valley = null;
      toSave.valleyTime = null;
      toSave.beyondExpect = false;
    }

    this.saving = true;
    this.strategyService.update(toSave)
      .subscribe((opr: Result) => {
          this.saving = false;
          if (opr.code !== Result.CODE_SUCCESS) {
            this.strategyService.showError(opr);
            return;
          }
          Object.assign(this.strategy, toSave);
          Object.assign(this.oriStrategy, toSave);
          this.snackBar.open('?????????');
        },
        error => this.saving = false,
        () => this.saving = false);
  }

  goback() {
    window.history.back();
  }
}
