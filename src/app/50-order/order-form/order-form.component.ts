import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

import { OrderForm, PlaceOrderResult } from '../../models/per/order-form';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { Asset } from '../../models/per/asset';
import { ExchangePair } from '../../models/mar/ex-pair';
import { Ccy } from '../../models/mar/ccy';
import { PairService } from '../../services/mar/pair.service';
import { EffectDigitsPipe } from '../../10-common/pipe/effect-digits-pipe';
import { AssetService } from '../../services/per/asset.service';
import { PlaceOrderRefreshDelay } from '../../config';
import { ValueResult } from '../../models/result';
import { MessageDialogComponent } from '../../10-common/message-dialog/message-dialog.component';
import { RoundDownPipe } from '../../10-common/pipe/round-down-pipe';
import { LastTransaction } from '../../models/per/last-transaction';
import { LastTransService } from '../../services/per/last-trans.service';

export interface PlacedOrder {
  orderPlacedAt: number;
  orderForm: OrderForm;
  orderId: string;
}

export interface OrderFormParams {
  exchangePair: ExchangePair;
  orderForm?: OrderForm;
  baseAsset?: Asset;
  quoteAsset?: Asset;
  lastTrans?: LastTransaction;
  lastTransLoaded?: boolean;
}


@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css']
})
export class OrderFormComponent implements OnInit, AfterViewInit {
  @ViewChild('baseSlider') baseSlider: MatSlider;
  @ViewChild('quoteSlider') quoteSlider: MatSlider;

  CoinLogoPath = Ccy.LogoPath;
  baseAsset: Asset;
  quoteAsset?: Asset;
  orderForm: OrderForm;
  exchangePair: ExchangePair;
  lastTrans?: LastTransaction;
  lastTransLoaded: boolean;

  availableBaseAsset: number;
  availableQuoteAsset: number;
  priceLimit = false;

  refreshingPrice = false;
  placingOrder = false;

  tickerPrice: number;
  tickerPriceAdjusted: number;
  sliderSteps = 8;
  sliderTickInterval = 1;

  placedOrder?: PlacedOrder;

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
              private lastTransService: LastTransService,
              private effectDigits: EffectDigitsPipe,
              private roundDown: RoundDownPipe,
              private snackBar: MatSnackBar,
              public dialogRef: MatDialogRef<OrderFormComponent, PlacedOrder>,
              @Inject(MAT_DIALOG_DATA) public data: OrderFormParams,
              private dialog: MatDialog) {

    this.exchangePair = data.exchangePair;
    this.orderForm = data.orderForm;
    if (!this.orderForm) {
      this.orderForm = new OrderForm();
    }
    this.priceLimit = this.orderForm.type === 'limit';
    this.baseAsset = data.baseAsset;
    this.quoteAsset = data.quoteAsset;
    this.lastTrans = data.lastTrans;
    this.lastTransLoaded = data.lastTransLoaded;
    this.setAvailableAsset();
  }

  private setAvailableAsset() {
    if (!this.baseAsset && !this.quoteAsset) {
      return;
    }
    if (this.baseAsset) {
      this.availableBaseAsset = this.baseAsset.holding - this.baseAsset.frozen;
    } else {
      this.availableBaseAsset = 0;
    }
    if (this.quoteAsset) {
      this.availableQuoteAsset = this.quoteAsset.holding - this.quoteAsset.frozen;
    } else {
      this.availableQuoteAsset = 0;
    }
  }

  ngOnInit() {
    this.refreshPrice();
    const {ex, baseCcy, quoteCcy} = this.exchangePair;
    if (!this.baseAsset || !this.quoteAsset) {
      this.assetService.findByCcys(ex, baseCcy, quoteCcy)
        .subscribe(assets => {
          this.baseAsset = assets.find(a => a.ccy === baseCcy);
          this.quoteAsset = assets.find(a => a.ccy === quoteCcy);
          this.setAvailableAsset();
          this.tryInitSlider();
        });
    }
    if (!this.lastTrans) {
      this.lastTransService.findLastTransaction(baseCcy, quoteCcy)
        .subscribe(lt => {
          this.lastTrans = lt;
          this.lastTransLoaded = true;
        });
    }
  }

  ngAfterViewInit() {
    this.tryInitSlider();
  }

  tryInitSlider() {
    if (this.orderForm.side === 'sell') {
      this.tryInitSellSlider();
    } else {
      this.tryInitBuySlider();
    }
  }

  tryInitSellSlider() {
    const orderForm = this.orderForm;
    if (!this.baseSlider || !this.availableBaseAsset) {
      return;
    }
    let quantity = orderForm.quantity;
    if (quantity && quantity > 0) {
      this.baseQuantityInputChanged(this.baseSlider);
      return;
    }
    const sliderValue = this.baseSlider.value;
    if (sliderValue === null || sliderValue === 0) {
      return;
    }
    if (sliderValue === this.sliderSteps) {
      quantity = this.availableBaseAsset;
    } else {
      quantity = this.availableBaseAsset * sliderValue / this.sliderSteps;
    }
    orderForm.quantity = quantity;
  }

  tryInitBuySlider() {
    const orderForm = this.orderForm;
    if (!this.quoteSlider || !this.availableQuoteAsset) {
      return;
    }
    let quoteQuantity = orderForm.quoteQuantity;
    if (quoteQuantity && quoteQuantity > 0) {
      this.quoteQuantityInputChanged(this.quoteSlider);
      return;
    }
    const sliderValue = this.quoteSlider.value;
    if (sliderValue === null || sliderValue === 0) {
      return;
    }
    if (sliderValue === this.sliderSteps) {
      quoteQuantity = this.availableQuoteAsset;
    } else {
      quoteQuantity = this.availableQuoteAsset * sliderValue / this.sliderSteps;
    }
    orderForm.quoteQuantity = quoteQuantity;
  }

  refreshPrice() {
    this.refreshingPrice = true;
    const pair = this.exchangePair;
    this.pairService.inquirePrice(pair.ex, pair.symbol)
      .subscribe(price => {
          this.refreshingPrice = false;
          this.tickerPrice = +price;
          this.tickerPriceAdjusted = +this.effectDigits.transform(this.tickerPrice, 5);
          const formPrice = this.orderForm.price;
          if (formPrice === undefined) {
            this.orderForm.price = this.tickerPriceAdjusted;
          } else {
            if (this.orderForm.side === 'buy') {
              if (formPrice > this.tickerPriceAdjusted) {
                this.orderForm.price = this.tickerPriceAdjusted;
              }
            } else {
              if (formPrice < this.tickerPriceAdjusted) {
                this.orderForm.price = this.tickerPriceAdjusted;
              }
            }
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

  baseQuantityInputChanged(slider: MatSlider) {
    if (!this.availableBaseAsset) {
      return;
    }
    const quantity = this.orderForm.quantity;
    if (quantity >= this.availableBaseAsset) {
      slider.value = this.sliderSteps;
    } else {
      slider.value = quantity * this.sliderSteps / this.availableBaseAsset;
    }
  }

  quoteQuantityInputChanged(slider: MatSlider) {
    if (!this.availableQuoteAsset) {
      return;
    }
    const quoteQuantity = this.orderForm.quoteQuantity;
    if (quoteQuantity >= this.availableQuoteAsset) {
      slider.value = this.sliderSteps;
    } else {
      slider.value = quoteQuantity * this.sliderSteps / this.availableQuoteAsset;
    }
  }

  priceLimitChanged(change: MatCheckboxChange) {
  }

  placeOrder() {
    const exchangePair = this.exchangePair;
    const orderForm = this.orderForm;
    const form: OrderForm = {
      ...exchangePair,
      side: orderForm.side,
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
          if (form.price > this.tickerPriceAdjusted) {
            this.orderService.showMessage('（买入）限价高于当前价格');
            return;
          }
        } else {
          if (form.price < this.tickerPriceAdjusted) {
            this.orderService.showMessage('（卖出）限价低于当前价格');
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
    this.orderService.placeOrder(form)
      .subscribe((res: PlaceOrderResult) => {
          this.placingOrder = false;
          if (form.type === 'market') {
            this.snackBar.open('已下单');
          } else {
            this.snackBar.open('已下单（限价单），可在 “当前挂单” 页查看');
          }

          const orderPlacedAt = Date.now();
          this.placedOrder = {
            orderForm: form,
            orderId: res.orderId,
            orderPlacedAt: orderPlacedAt
          };
        },
        error => this.placingOrder = false,
        () => this.placingOrder = false)
  }

  closeDialog() {
    this.dialogRef.close(this.placedOrder);
  }

  static openOrderForm(dialog: MatDialog, data: OrderFormParams): MatDialogRef<OrderFormComponent, PlacedOrder> {
    return dialog.open(
      OrderFormComponent, {
        disableClose: true,
        width: '420px',
        maxWidth: '96vw',
        data
      });
  }

  static afterOrderPlacedDelay(ref: MatDialogRef<OrderFormComponent, PlacedOrder>,
                               action: (placedOrder?: PlacedOrder) => void) {
    ref.afterClosed().subscribe((placedOrder: PlacedOrder) => {
      if (!placedOrder) {
        return;
      }
      const orderPlacedAt = placedOrder.orderPlacedAt;
      const elapse = Date.now() - orderPlacedAt;
      const remain = PlaceOrderRefreshDelay - elapse;
      if (remain <= 0) {
        action(placedOrder);
      } else {
        setTimeout(() => {
          action(placedOrder);
        }, remain);
      }
    });
  }

}
