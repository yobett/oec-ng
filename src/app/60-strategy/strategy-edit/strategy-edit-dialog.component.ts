import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { Result } from '../../models/result';
import { Ccy } from '../../models/mar/ccy';
import { Strategy } from '../../models/str/strategy';
import { StrategyService } from '../../services/str/strategy.service';
import { PairService } from '../../services/mar/pair.service';
import { EffectDigitsPipe } from '../../10-common/pipe/effect-digits-pipe';
import { LastTransService } from '../../services/per/last-trans.service';
import { LastTransaction } from '../../models/per/last-transaction';
import { PriceService } from '../../services/mar/price.service';

interface StrategyEditData {
  strategy: Strategy;
  lastTransaction?: LastTransaction;
}

@Component({
  selector: 'app-strategy-edit-dialog',
  templateUrl: './strategy-edit-dialog.component.html',
  styleUrls: ['./strategy-edit-dialog.component.css']
})
export class StrategyEditDialogComponent implements OnInit {
  statusOptions = Strategy.StatusOptions;
  executorOptions = Strategy.ExecutorOptions;
  CoinLogoPath = Ccy.LogoPath;
  getTypeLabel = Strategy.getTypeLabel;

  strategy: Strategy;
  oriStrategy: Strategy;
  lastTransaction: LastTransaction;

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
              public dialogRef: MatDialogRef<StrategyEditDialogComponent, Strategy>,
              @Inject(MAT_DIALOG_DATA) public data: StrategyEditData) {

    const strategy1 = data.strategy;

    this.oriStrategy = strategy1;
    this.strategy = {...strategy1};
    if (strategy1.status === 'initial' && !strategy1.basePoint) {
      // 初次编辑
      this.strategy.status = 'started';
    }
    this.drawbackField = strategy1.type === Strategy.TypeLB || strategy1.type === Strategy.TypeHS;
    this.refreshPrice();

    this.lastTransaction = data.lastTransaction;
    if (!this.lastTransaction) {
      this.lastTransService.findLastTransaction(strategy1.baseCcy, strategy1.quoteCcy)
        .subscribe(lt => {
          this.lastTransaction = lt;
        });
    }
  }

  ngOnInit() {
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
      this.strategyService.showErrorMessage('基点未设置');
      return;
    }
    if (!strategy.expectingPercent) {
      this.strategyService.showErrorMessage('期望百分比未设置');
      return;
    }
    if (this.drawbackField && !strategy.drawbackPercent) {
      this.strategyService.showErrorMessage('回撤百分比未设置');
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
          this.snackBar.open('已保存');
        },
        error => this.saving = false,
        () => this.saving = false);
  }


  closeDialog() {
    this.dialogRef.close(this.strategy);
  }

  static openStrategyEditDialog(data: StrategyEditData, dialog: MatDialog):
    MatDialogRef<StrategyEditDialogComponent, Strategy> {
    return dialog.open(
      StrategyEditDialogComponent, {
        disableClose: true,
        width: '540px',
        maxWidth: '96vw',
        data
      });
  }
}
