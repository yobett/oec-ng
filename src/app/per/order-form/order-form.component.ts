import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSliderChange } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { OrderForm } from '../../models/per/order-form';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { Asset } from '../../models/per/asset';
import { ExchangePair } from '../../models/mar/ex-pair';
import { Ccy } from '../../models/mar/ccy';
import { PairService } from '../../services/mar/pair.service';
import { EffectDigitsPipe } from '../../common/pipe/effect-digits-pipe';
import { AssetService } from '../../services/per/asset.service';
import { PlaceOrderRefreshDelay } from '../../config';
import { Exch } from '../../models/sys/exch';
import { ValueResult } from '../../models/result';
import { MessageDialogComponent } from '../../common/message-dialog/message-dialog.component';
import { RoundDownPipe } from '../../common/pipe/round-down-pipe';

export interface OrderFormParams {
  exchangePair: ExchangePair;
  orderForm?: OrderForm;
  placedForm?: OrderForm;
  baseAsset?: Asset;
  quoteAsset?: Asset;
}


@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css']
})
export class OrderFormComponent implements OnInit {

  CoinLogoPath = Ccy.LogoPath;
  baseAsset: Asset;
  quoteAsset?: Asset;
  orderForm: OrderForm;
  exchangePair: ExchangePair;

  availableBaseAsset: number;
  availableQuoteAsset: number;
  priceLimit = false;

  refreshingPrice = false;
  placingOrder = false;

  tickerPrice: number;
  tickerPriceAdjusted: number;
  sliderSteps = 8;
  sliderTickInterval = 1;

  orderPlacedAt: number;

  loadingExchangeInfo = false;
  exchangeInfo: any = null;

  sliderLabel = (value: number): string => {
    if (value === 0) {
      return '0';
    }
    if (value === this.sliderSteps) {
      return '全部';
    }
    if (value === (this.sliderSteps >> 1)) {
      return '1/2';
    }
    if (value % 2 === 0 && this.sliderSteps % 2 === 0) {
      return (value >> 1) + '/' + (this.sliderSteps >> 1);
    }
    return value + '/' + this.sliderSteps;
  };

  constructor(private orderService: SpotOrderService,
              private pairService: PairService,
              private assetService: AssetService,
              private snackBar: MatSnackBar,
              private effectDigits: EffectDigitsPipe,
              private roundDown: RoundDownPipe,
              public dialogRef: MatDialogRef<OrderFormComponent, number>,
              @Inject(MAT_DIALOG_DATA) public data: OrderFormParams,
              private dialog: MatDialog) {

    this.exchangePair = data.exchangePair;
    this.orderForm = data.orderForm;
    if (!this.orderForm) {
      this.orderForm = new OrderForm();
      this.orderForm.symbol = this.exchangePair.symbol;
    }
    this.priceLimit = this.orderForm.type === 'limit';
    this.baseAsset = data.baseAsset;
    this.quoteAsset = data.quoteAsset
    this.setAvailableAsset();
  }

  static openOrderForm(dialog: MatDialog, data: OrderFormParams): MatDialogRef<OrderFormComponent, number> {
    return dialog.open(
      OrderFormComponent, {
        disableClose: true,
        width: '420px',
        maxWidth: '96vw',
        data
      });
  }

  static afterOrderPlacedDelay(ref: MatDialogRef<OrderFormComponent, number>, action: () => void) {
    ref.afterClosed().subscribe(orderPlacedAt => {
      if (!orderPlacedAt) {
        return;
      }
      const delay = PlaceOrderRefreshDelay;
      const elapse = Date.now() - orderPlacedAt;
      const remain = delay - elapse;
      if (remain <= 0) {
        action();
      } else {
        setTimeout(() => {
          action();
        }, remain);
      }
    });
  }

  private setAvailableAsset() {
    if (this.baseAsset) {
      this.availableBaseAsset = this.baseAsset.holding - this.baseAsset.frozen;
    }
    if (this.quoteAsset) {
      this.availableQuoteAsset = this.quoteAsset.holding - this.quoteAsset.frozen;
    }
  }

  ngOnInit() {
    this.refreshPrice();
    if (!this.baseAsset || !this.quoteAsset) {
      const pair = this.exchangePair;
      this.assetService.findByCcys(pair.ex, pair.baseCcy, pair.quoteCcy)
        .subscribe(assets => {
          this.baseAsset = assets.find(a => a.ccy === pair.baseCcy);
          this.quoteAsset = assets.find(a => a.ccy === pair.quoteCcy);
          this.setAvailableAsset();
        });
    }
  }

  refreshPrice() {
    this.refreshingPrice = true;
    const pair = this.exchangePair;
    this.pairService.inquirePrice(pair.ex, pair.symbol)
      .subscribe(price => {
          this.refreshingPrice = false;
          this.tickerPrice = +price;
          this.tickerPriceAdjusted = +this.effectDigits.transform(this.tickerPrice, 5);
          if (this.orderForm.price === undefined) {
            this.orderForm.price = this.tickerPriceAdjusted;
          }
        },
        error => this.refreshingPrice = false,
        () => this.refreshingPrice = false);
  }

  showExchangeInfo() {
    if (this.exchangeInfo) {
      return this.doShowExchangeInfo();
    }
    const exp = this.exchangePair;
    this.loadingExchangeInfo = true;
    this.pairService.getExchangeInfo(exp.ex, exp.symbol)
      .subscribe((result: ValueResult<any>) => {
          this.loadingExchangeInfo = false;
          this.exchangeInfo = result.value;
          this.doShowExchangeInfo();
        },
        error => this.loadingExchangeInfo = false,
        () => this.loadingExchangeInfo = false);
  }

  private doShowExchangeInfo() {
    const exchangeInfo = this.exchangeInfo;
    if (!exchangeInfo) {
      return;
    }
    const exp = this.exchangePair;
    const msg = JSON.stringify(exchangeInfo, null, 2);
    const title = `交易对参数（${exp.ex}: ${exp.baseCcy}-${exp.quoteCcy}）`;
    const data = {msg, type: '', title};
    MessageDialogComponent.ShowMessageDialog(data, this.dialog);
  }

  quantitySliderChanged(change: MatSliderChange) {
    if (change.value === null) {
      return;
    }
    if (!this.availableBaseAsset) {
      return;
    }
    const ratio = (change.value === this.sliderSteps) ? 1 : change.value / this.sliderSteps;
    const quant = this.availableBaseAsset * ratio;
    this.orderForm.quantity = +this.roundDown.transform(quant);
  }

  quoteQuantitySliderChanged(change: MatSliderChange) {
    if (change.value === null) {
      return;
    }
    if (!this.availableQuoteAsset) {
      return;
    }
    const ratio = (change.value === this.sliderSteps) ? 1 : change.value / this.sliderSteps;
    const quant = this.availableQuoteAsset * ratio;
    this.orderForm.quoteQuantity = +this.roundDown.transform(quant);
  }


  placeOrder() {
    const exchangePair = this.exchangePair;
    const ex = exchangePair.ex;
    const orderForm = this.orderForm;
    const form: OrderForm = {
      side: orderForm.side,
      baseCcy: exchangePair.baseCcy,
      quoteCcy: exchangePair.quoteCcy,
      symbol: exchangePair.symbol,
      type: this.priceLimit ? 'limit' : 'market'
    };
    if (this.priceLimit) {
      if (!orderForm.price) {
        this.orderService.showMessage('未设置限价');
        return;
      }
      form.price = +orderForm.price;
      if (this.tickerPriceAdjusted) {
        if (form.side === 'buy') {
          if (form.price >= this.tickerPriceAdjusted) {
            this.orderService.showMessage('（买入）限价未低于当前价格，是否为失误？');
            return;
          }
        } else {
          if (form.price <= this.tickerPriceAdjusted) {
            this.orderService.showMessage('（卖出）限价未高于当前价格，是否为失误？');
            return;
          }
        }
      }
    }
    if (form.side === 'buy') {
      if (!orderForm.quoteQuantity) {
        this.orderService.showMessage('数量未设置');
        return;
      }
      orderForm.quoteQuantity = +orderForm.quoteQuantity;
      if (form.type === 'limit') {
        let price;
        if (this.priceLimit) {
          price = +orderForm.price;
        } else {
          if (!this.tickerPrice) {
            this.orderService.showMessage('未能获取当前价格');
            return;
          }
          price = this.tickerPrice;
        }
        const quant = orderForm.quoteQuantity / price;
        form.quantity = +this.roundDown.transform(quant);
      } else {
        form.quoteQuantity = orderForm.quoteQuantity;
      }
    } else {
      if (!orderForm.quantity) {
        this.orderService.showMessage('数量未设置');
        return;
      }
      orderForm.quantity = +orderForm.quantity;
      form.quantity = orderForm.quantity;
    }

    this.placingOrder = true;
    this.orderService.placeOrder(ex, form)
      .subscribe(res => {
          this.placingOrder = false;
          if (form.side === 'buy') {
            const quoteAsset = this.quoteAsset;
            if (quoteAsset) {
              quoteAsset.frozen += orderForm.quoteQuantity;
              if (quoteAsset.frozen > quoteAsset.holding) {
                quoteAsset.frozen = quoteAsset.holding;
              }
            }
          } else {
            const baseAsset = this.baseAsset;
            baseAsset.frozen += orderForm.quantity;
            if (baseAsset.frozen > baseAsset.holding) {
              baseAsset.frozen = baseAsset.holding;
            }
          }
          this.setAvailableAsset();
          this.snackBar.open('已下单');

          this.data.placedForm = form;
          this.orderPlacedAt = Date.now();
        },
        error => this.placingOrder = false,
        () => this.placingOrder = false)
  }

  closeDialog() {
    this.dialogRef.close(this.orderPlacedAt);
  }
}
