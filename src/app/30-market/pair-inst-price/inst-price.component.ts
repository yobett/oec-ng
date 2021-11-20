import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { ExchangePair, ExPair } from '../../models/mar/ex-pair';
import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { PairService } from '../../services/mar/pair.service';
import { Ccy } from '../../models/mar/ccy';
import { TableDatasource } from '../../10-common/table-datasource';
import { CurrentPrices, PairPrice } from '../../models/mar/pair-price';
import { OrderFormComponent, OrderFormParams, PlacedOrder } from '../../50-order/order-form/order-form.component';
import { LastTransaction } from '../../models/per/last-transaction';
import { OrderForm } from '../../models/per/order-form';
import { KlineChartDialogComponent } from '../kline-chart/kline-chart-dialog.component';
import { EffectDigitsPipe } from '../../10-common/pipe/effect-digits-pipe';
import { OrdersPopupData, SpotOrdersDialogComponent } from '../../50-order/order/spot-orders-dialog.component';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { CcyInfoDialogComponent } from '../ccy/ccy-info-dialog.component';
import { CcyService } from '../../services/mar/ccy.service';
import { OrderDetailDialogComponent } from '../../50-order/order/order-detail-dialog.component';
import { SpotOrder } from '../../models/per/spot-order';
import { AssetsClearoutDialogComponent } from '../../40-asset/asset-trading/assets-clearout-dialog.component';
import { AssetService } from '../../services/per/asset.service';
import { PendingOrdersDialogComponent } from '../../50-order/order-pending/pending-orders-dialog.component';
import { AssetsDialogComponent } from '../../40-asset/asset/assets-dialog.component';
import { LocalStorageKeys, PlaceOrderRefreshDelay } from '../../config';
import { NewStrategyPrefer, StrategiesDialogComponent } from '../../60-strategy/strategy/strategies-dialog.component';
import { StrategyService } from '../../services/str/strategy.service';
import { BaseQuoteStrategyCounts, Strategy } from '../../models/str/strategy';

@Component({
  selector: 'app-inst-price',
  templateUrl: './inst-price.component.html',
  styleUrls: ['./inst-price.component.css']
})
export class InstPriceComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<ExPair>;

  dataSource: TableDatasource<PairPrice>;

  displayedColumnsH0: string[] = [
    'index', 'baseCcy', 'quoteCcy',
    'lastTrans', 'currentPrice',
    'strategyCount', 'actions'];
  displayedColumnsH1: string[] = [
    'ex', 'updateTs', 'side', 'avgPrice',
    'price', 'priceChangePercent', 'priceSource',
  ];
  displayedColumns: string[] = [
    'index', 'baseCcy', 'quoteCcy',
    'ex', 'updateTs', 'side', 'avgPrice',
    'price', 'priceChangePercent', 'priceSource',
    'strategyCount', 'actions'];

  prices: CurrentPrices;
  strategyCountsMap: Map<string, BaseQuoteStrategyCounts>;
  $exchs: Observable<Exch[]>;
  preferDS: string = Exch.CODE_BA;

  processes: { [name: string]: boolean } = {};

  CoinLogoPath = Ccy.LogoPath;

  constructor(protected sessionService: SessionService,
              private pairService: PairService,
              private exchService: ExchService,
              private ccyService: CcyService,
              private assetService: AssetService,
              private orderService: SpotOrderService,
              private strategyService: StrategyService,
              private effectDigits: EffectDigitsPipe,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);

    const preferDS = localStorage.getItem(LocalStorageKeys.PricePreferDS);
    if (preferDS) {
      this.preferDS = preferDS;
    }
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<PairPrice>();
    this.dataSource.compareFieldMappers = {
      side: p => p.lastTrans && p.lastTrans.side || 0,
      avgPrice: p => p.lastTrans && p.lastTrans.avgPrice || 0,
      execQty: p => p.lastTrans && p.lastTrans.execQty || 0,
      ex: p => p.lastTrans && p.lastTrans.ex || 0,
      updateTs: p => p.lastTrans && p.lastTrans.updateTs || 0,
      strategyCount: p => p.strategyCount && p.strategyCount.all || 0,
    }
  }

  protected withSession(user: User) {
    this.$exchs = this.exchService.list2();
    this.loadData(true);
  }

  loadData(first = false) {
    const obs: Observable<PairPrice[]> = this.pairService.list2WithLastTrans()
      .pipe(
        map(
          (pps: PairPrice[]) => {
            if (this.prices) {
              for (const pp of pps) {
                this.setPrice(pp);
              }
            }
            if (this.strategyCountsMap) {
              for (let pp of pps) {
                pp.strategyCount = this.strategyCountsMap.get(`${pp.baseCcy}-${pp.quoteCcy}`) || {running: 0, all: 0};
              }
            }
            return pps;
          })
      );
    this.dataSource.setObservable(obs);

    this.fetchPrices(first);
    this.loadStrategiesCount();
  }

  loadStrategiesCount(manual = false) {
    this.processes.loadStrategiesCount = true;
    this.strategyService.countByBaseQuote()
      .subscribe((cs: BaseQuoteStrategyCounts[]) => {
          this.processes.loadStrategiesCount = false;
          this.strategyCountsMap = new Map<string, BaseQuoteStrategyCounts>(
            cs.map(c => [`${c.baseCcy}-${c.quoteCcy}`, c]));

          const tableData: PairPrice[] = this.dataSource.data;
          if (tableData) {
            for (let pp of tableData) {
              pp.strategyCount = this.strategyCountsMap.get(`${pp.baseCcy}-${pp.quoteCcy}`) || {running: 0, all: 0};
            }
          }
          if (manual) {
            this.snackBar.open('策略数已刷新');
          }
        },
        error => this.processes.loadStrategiesCount = false,
        () => this.processes.loadStrategiesCount = false);
  }

  transAmountTooltip(pp: PairPrice): string {
    const lastTrans: LastTransaction = pp.lastTrans;
    if (!lastTrans) {
      return '';
    }
    const execQty = lastTrans.execQty;
    const quoteAmount = lastTrans.quoteAmount;
    if (!quoteAmount || !execQty) {
      return '';
    }
    const quantityStr = this.effectDigits.transform(execQty, 5);
    let amountStr = this.effectDigits.transform(lastTrans.quoteAmount, 5);
    return `基础币种数量（${pp.baseCcy}）： ${quantityStr}\n 报价币种数量（${pp.quoteCcy}）： ${amountStr}`;
  }

  private setPrice(pp: PairPrice) {
    const key = PairPrice.priceKey(pp);
    pp.currentPrice = this.prices[key];
    this.setPriceChangePercent(pp);
  }

  private setPriceChangePercent(pp: PairPrice) {
    const {currentPrice, lastTrans} = pp;
    if (!currentPrice || !lastTrans) {
      return;
    }
    const lastPrice = lastTrans.avgPrice;
    if (!lastPrice) {
      return;
    }
    const price = currentPrice.price;
    const change = price - lastPrice;
    pp.priceChangePercent = (change / lastPrice) * 100.0;
  }

  preferDSChanged() {
    localStorage.setItem(LocalStorageKeys.PricePreferDS, this.preferDS);
    this.fetchPrices();
  }

  fetchPrices(first?: boolean) {
    this.processes.fetchPrices = true;

    this.pairService.inquirePrices(this.preferDS)
      .subscribe((cps: CurrentPrices) => {
          this.processes.fetchPrices = false;
          this.prices = cps;

          const tableData: PairPrice[] = this.dataSource.data;
          if (tableData) {
            for (let pp of tableData) {
              this.setPrice(pp);
            }
          }

          if (!first) {
            this.snackBar.open('价格已刷新');
          }
        },
        error => this.processes.fetchPrices = false,
        () => this.processes.fetchPrices = false);
  }


  refreshSinglePrice(pp: PairPrice) {
    const key = PairPrice.priceKey(pp);
    const currentPrice = this.prices[key];
    if (!currentPrice) {
      return;
    }
    let ex = currentPrice.source;
    let symbol = pp[ex + 'Symbol'];
    this.pairService.inquirePrice(ex, symbol)
      .subscribe(price => {
        currentPrice.price = +price;
        pp.currentPrice = currentPrice;
        this.setPriceChangePercent(pp);
      });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }

  showBaseCcyInfo(exp: PairPrice) {
    const pairWithUSDT = exp.quoteCcy === 'USDT' ? exp : null;
    CcyInfoDialogComponent.showCcyInfo(exp.baseCcy, this.ccyService, this.dialog, pairWithUSDT);
  }

  openOrderForm(exp: PairPrice, ex: string, symbol: string) {
    const orderForm = new OrderForm();
    if (exp.lastTrans) {
      orderForm.side = exp.lastTrans.side === 'buy' ? 'sell' : 'buy';
    }
    const exchangePair: ExchangePair = {
      ex,
      symbol: symbol,
      baseCcy: exp.baseCcy,
      quoteCcy: exp.quoteCcy
    };
    const data: OrderFormParams = {
      exchangePair,
      orderForm,
      lastTrans: exp.lastTrans,
      lastTransLoaded: true
    };

    const ref = OrderFormComponent.openOrderForm(this.dialog, data);
    OrderFormComponent.afterOrderPlacedDelay(ref, (placedOrder: PlacedOrder) => {
      if (!placedOrder) {
        return;
      }
      if (placedOrder.orderForm.type === 'market') {
        this.loadData();
      }
    });
  }

  showOrderDetail(exp: PairPrice) {
    const lt: LastTransaction = exp.lastTrans;
    if (!lt) {
      return;
    }
    if (lt.order) {
      OrderDetailDialogComponent.showOrderDetail(this.dialog, lt.order);
    } else if (lt.oid) {
      this.orderService.getById2(lt.oid)
        .subscribe((order: SpotOrder) => {
          lt.order = order;
          OrderDetailDialogComponent.showOrderDetail(this.dialog, order);
        });
    }
  }

  showOrders(exp: PairPrice) {
    this.orderService.findByBaseQuote(exp.baseCcy, exp.quoteCcy)
      .subscribe(orders => {
        if (!orders || orders.length === 0) {
          this.orderService.showMessage('无订单');
          return;
        }
        const data: OrdersPopupData = {
          baseCcy: exp.baseCcy,
          quoteCcy: exp.quoteCcy,
          orders: orders
        };
        SpotOrdersDialogComponent.showOrders(this.dialog, data);
      });
  }

  openKlineChart(pair: PairPrice, ex: string) {
    KlineChartDialogComponent.showKlineChart(
      this.dialog,
      {
        ex,
        pair
      });
  }

  showPendingOrders() {
    this.processes.loadingPendingOrders = true;
    this.orderService.fetchPendingOrders()
      .subscribe((orders: SpotOrder[]) => {
          this.processes.loadingPendingOrders = false;
          if (orders.length === 0) {
            this.snackBar.open('当前无挂单');
            return;
          }
          const ref = PendingOrdersDialogComponent.showPendingOrders(this.dialog, orders);
          ref.afterClosed().subscribe((placedOrders: PlacedOrder[]) => {
            if (!placedOrders) {
              return;
            }
            // 下了市价单才需要刷新列表
            const placedMarketOrders = placedOrders.filter(po => po.orderForm.type === 'market');
            if (placedMarketOrders.length === 0) {
              return;
            }
            const lastOrder = placedMarketOrders[placedMarketOrders.length - 1];
            const elapse = Date.now() - lastOrder.orderPlacedAt;
            const remain = PlaceOrderRefreshDelay - elapse;
            if (remain <= 0) {
              this.loadData();
            } else {
              setTimeout(() => {
                this.loadData();
              }, remain);
            }
          });
        },
        error => this.processes.loadingPendingOrders = false,
        () => this.processes.loadingPendingOrders = false
      );
  }

  sellAll() {
    this.processes.loadingAssets = true;
    this.assetService.list2(null, {filterValue: 10})
      .subscribe(assets => {
          this.processes.loadingAssets = false;
          if (!assets || assets.length == 0) {
            return;
          }

          const dialogRef = AssetsClearoutDialogComponent.clearoutAssets(this.dialog,
            {assets, availableValueThreshold: 10}
          );
          AssetsClearoutDialogComponent.afterOrdersPlacedDelay(dialogRef, () => {
            this.loadData();
          });
        },
        error => this.processes.loadingAssets = false,
        () => this.processes.loadingAssets = false);
  }

  showCurrentAssets() {
    AssetsDialogComponent.showCurrentAssets(this.assetService, this.dialog);
  }

  private updateStrategyCounts(countChanges: BaseQuoteStrategyCounts[]) {
    if (!countChanges) {
      return;
    }
    for (const cc of countChanges) {
      const key = `${cc.baseCcy}-${cc.quoteCcy}`;
      // console.log(`${key}, ${cc.running}, ${cc.all}`);
      const cc0 = this.strategyCountsMap.get(key);
      if (cc0) {
        cc0.running += cc.running;
        cc0.all += cc.all;
      }
    }
  }

  showCurrentStrategies() {
    this.processes.loadingStrategies = true;
    this.strategyService.list2(null, {status: 'started'})
      .subscribe((strategies: Strategy[]) => {
          this.processes.loadingStrategies = false;
          if (strategies.length === 0) {
            this.snackBar.open('当前无运行中的策略');
            return;
          }
          StrategiesDialogComponent.showStrategies(
            {
              status: 'started',
              strategies
            }, this.dialog).afterClosed()
            .subscribe(this.updateStrategyCounts.bind(this));
        },
        error => this.processes.loadingStrategies = false,
        () => this.processes.loadingStrategies = false
      );
  }

  showStrategies(pair: PairPrice) {
    const newStrategyPrefer: NewStrategyPrefer = {};
    const lastTrans = pair.lastTrans;
    if (lastTrans) {
      newStrategyPrefer.ex = lastTrans.ex;
      newStrategyPrefer.side = lastTrans.side === 'buy' ? 'sell' : 'buy';
    }
    const pairBQ = {baseCcy: pair.baseCcy, quoteCcy: pair.quoteCcy};
    this.strategyService.list2(null, pairBQ)
      .subscribe((strategies: Strategy[]) => {
        StrategiesDialogComponent.showStrategies(
          {
            pairBQ,
            strategies,
            newStrategyPrefer
          },
          this.dialog).afterClosed()
          .subscribe(this.updateStrategyCounts.bind(this));
      });
  }

}
