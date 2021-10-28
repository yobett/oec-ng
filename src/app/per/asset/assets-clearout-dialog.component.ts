import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

import { Ccy } from '../../models/mar/ccy';
import { TableDatasource } from '../../common/table-datasource';
import { PairService } from '../../services/mar/pair.service';
import { Asset } from '../../models/per/asset';
import { PriceRequest, PriceResponse } from '../../models/mar/pair-price';
import { OrderForm, PlaceOrderResult } from '../../models/per/order-form';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { PlaceOrderRefreshDelay } from '../../config';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';


export interface AssetsClearoutData {
  assets: Asset[];
  availableValueThreshold?: number;
}

interface AssetCandidate {
  selected: boolean;

  ex: string;
  ccy: string;
  available: number;
  availableValue?: number;

  symbol?: string;
  price?: number;

  placeOrderResult?: PlaceOrderResult;
}

@Component({
  selector: 'app-assets-clearout-dialog',
  templateUrl: './assets-clearout-dialog.component.html',
  styleUrls: ['./assets-clearout-dialog.component.css']
})
export class AssetsClearoutDialogComponent implements AfterViewInit {

  @ViewChild(MatTable) table: MatTable<AssetCandidate>;
  @ViewChild(MatSort) sort: MatSort;

  dataSource: TableDatasource<AssetCandidate>;

  allCandidates: AssetCandidate[];
  assetCandidates: AssetCandidate[];
  availableValueThreshold = 10; // $
  stableCoin = 'USDT';

  priceLimit = false;
  priceIncreasePercent = 0;

  placingOrder = false;
  orderPlacedAt: number;
  totalOrdersCount = 0;
  failedOrdersCount = 0;

  $exchs: Observable<Exch[]>;
  filterEx: string = 'all';

  displayedColumns: string[] = ['selected', 'index', 'ex', 'ccy',
    'available', 'availableValue', 'usdtPrice', 'execResult'];

  CoinLogoPath = Ccy.LogoPath;

  constructor(private orderService: SpotOrderService,
              private pairService: PairService,
              private exchService: ExchService,
              private snackBar: MatSnackBar,
              public dialogRef: MatDialogRef<AssetsClearoutDialogComponent, number>,
              @Inject(MAT_DIALOG_DATA) public data: AssetsClearoutData) {
    this.dataSource = new TableDatasource<AssetCandidate>();

    if (data.availableValueThreshold) {
      this.availableValueThreshold = data.availableValueThreshold;
    }

    this.allCandidates = [];
    for (const asset of data.assets) {
      if (asset.ccy === this.stableCoin) {
        continue;
      }
      let available: number = asset.holding - asset.frozen;
      if (available <= 0) {
        continue;
      }
      let availableValue: number;
      if (typeof asset.holdingValue !== 'undefined'
        && typeof asset.frozenValue !== 'undefined') {
        availableValue = asset.holdingValue - asset.frozenValue;
        if (availableValue < this.availableValueThreshold) {
          continue;
        }
      }

      const assetCandidate: AssetCandidate = {
        selected: true,
        ex: asset.ex,
        ccy: asset.ccy,
        available,
        availableValue
      };
      this.allCandidates.push(assetCandidate);
    }

    this.filterAssetCandidates();

    this.$exchs = this.exchService.list2();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
    this.refreshPrices();
  }

  get selectedCount(): number {
    return this.assetCandidates.filter(ac => ac.selected).length;
  }

  exGroupChanged(event: MatButtonToggleChange) {
    this.filterEx = event.value;
    this.filterAssetCandidates();
  }

  filterAssetCandidates() {
    if (this.filterEx === 'all') {
      this.assetCandidates = this.allCandidates;
    } else {
      this.assetCandidates = this.allCandidates.filter(c => c.ex === this.filterEx);
    }
    this.dataSource.setData(this.assetCandidates);
  }

  refreshPrices() {
    const priceRequests: PriceRequest[] = this.allCandidates.map(ac => ({
      baseCcy: ac.ccy,
      quoteCcy: this.stableCoin,
      ex: ac.ex
    }));
    this.pairService.inquirePricesEx(priceRequests)
      .subscribe((prs: PriceResponse[]) => {
        for (const pr of prs) {
          const ac = this.allCandidates.find(ac => pr.baseCcy === ac.ccy && pr.ex === ac.ex);
          if (ac) {
            ac.price = pr.price;
            ac.symbol = pr.symbol;
          }
        }
      });
  }

  placeOrders() {
    const orderForms: OrderForm[] = [];
    const sellingAssetsMap = new Map<string, AssetCandidate>();
    const sellingAssets = this.assetCandidates.filter(ac => ac.selected);
    if (sellingAssets.every(sa => !sa.symbol)) {
      this.orderService.showMessage('尚未获得价格');
      return;
    }
    for (const sellingAsset of sellingAssets) {
      const {selected, ex, ccy, available, symbol, price} = sellingAsset;
      if (!selected) {
        continue;
      }
      if (!symbol) {
        continue;
      }
      let limitPrice: number = undefined;
      if (this.priceLimit) {
        if (!price) {
          continue;
        }
        limitPrice = price + price * this.priceIncreasePercent / 100
      }
      const orderType = this.priceLimit ? 'limit' : 'market';
      const form: OrderForm = {
        ex,
        symbol,
        side: 'sell',
        type: orderType,
        quantity: available,
        price: limitPrice
      };
      orderForms.push(form);
      sellingAssetsMap.set(`${ex}.${symbol}`, sellingAsset);
    }
    if (orderForms.length === 0) {
      return;
    }

    if (!confirm(`确定要下单吗？共${orderForms.length}单`)) {
      return;
    }

    this.placingOrder = true;
    this.orderService.placeMultiOrders(orderForms)
      .subscribe((prs: PlaceOrderResult[]) => {
          this.placingOrder = false;
          this.totalOrdersCount = orderForms.length;
          let successCount = 0;
          let failedCount = 0;
          for (const pr of prs) {
            if (pr.success) {
              successCount++;
            } else {
              failedCount++;
            }
            const sellingAsset = sellingAssetsMap.get(`${pr.ex}.${pr.symbol}`);
            if (sellingAsset) {
              sellingAsset.placeOrderResult = pr;
            }
          }
          this.failedOrdersCount = failedCount;
          this.orderPlacedAt = Date.now();
          if (failedCount === 0) {
            this.snackBar.open('下单成功');
          } else if (successCount === 0) {
            this.snackBar.open('下单失败');
          } else {
            this.snackBar.open('下单完成（部分成功）');
          }
        },
        error => this.placingOrder = false,
        () => this.placingOrder = false);
  }

  showErrMessage(toSell: AssetCandidate) {
    const result = toSell.placeOrderResult;
    if (!result || result.success) {
      return;
    }
    const title = `下单失败（${toSell.ex}：${toSell.symbol}）`;
    this.orderService.showErrorMessage(result.message, title);
  }

  closeDialog() {
    this.dialogRef.close(this.orderPlacedAt);
  }

  static clearoutAssets(dialog: MatDialog,
                        data: AssetsClearoutData): MatDialogRef<AssetsClearoutDialogComponent, number> {
    return dialog.open(
      AssetsClearoutDialogComponent, {
        disableClose: true,
        width: '600px',
        maxWidth: '96vw',
        data
      });
  }

  static afterOrdersPlacedDelay(ref: MatDialogRef<AssetsClearoutDialogComponent, number>,
                                action: () => void) {
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

}
