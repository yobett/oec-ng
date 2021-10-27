import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';

import { Observable } from 'rxjs';

import { Asset } from '../../models/per/asset';
import { TableDatasource } from '../../common/table-datasource';
import { Result } from '../../models/result';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { AssetService } from '../../services/per/asset.service';
import { DataSyncService } from '../../services/sys/data-sync.service';
import { SyncResult, SyncResultGroup } from '../../models/sync-result';
import { ExchService } from '../../services/sys/exch.service';
import { Exch } from '../../models/sys/exch';
import { Ccy } from '../../models/mar/ccy';
import { SyncResultDialogComponent } from '../../common/sync-result/sync-result-dialog.component';
import { SyncResultGroupDialogComponent } from '../../common/sync-result/sync-result-group-dialog.component';
import { OrderForm } from '../../models/per/order-form';
import { ExchangePair } from '../../models/mar/ex-pair';
import { PairService } from '../../services/mar/pair.service';
import { OrderFormComponent, OrderFormParams } from '../order-form/order-form.component';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { OrdersPopupData, SpotOrdersDialogComponent } from '../order/spot-orders-dialog.component';
import { AssetsStructureComponent } from './assets-structure.component';
import { CcyInfoDialogComponent } from '../../mar/ccy/ccy-info-dialog.component';
import { CcyService } from '../../services/mar/ccy.service';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Asset>;

  CoinLogoPath = Ccy.LogoPath;
  allAssets: Asset[];
  assets: Asset[];
  fetchPriceFailed = false;

  holdingValueSum: number;
  frozenValueSum: number;
  skipSmallAsset = true;
  dataSource: TableDatasource<Asset>;

  displayedColumns: string[] = ['index', 'ccy', 'price', 'ex',
    'holding', 'holdingValue', 'frozen', 'frozenValue',
    /*'createdAt',*/ 'lastSync', 'actions'];

  processes: { [name: string]: boolean } = {};

  $exchs: Observable<Exch[]>;

  filterEx: string = 'all';

  constructor(protected sessionService: SessionService,
              private exchService: ExchService,
              private assetService: AssetService,
              private ccyService: CcyService,
              private orderService: SpotOrderService,
              private pairService: PairService,
              private dataSyncService: DataSyncService,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<Asset>();
  }

  protected withSession(user: User) {
    this.$exchs = this.exchService.list2();
    this.refresh();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  refresh() {
    this.processes.refreshing = true;
    this.assetService.list2().subscribe(assets => {
        this.processes.false = true;
        this.allAssets = assets;
        this.fetchPriceFailed = assets.every(a => typeof a.price === 'undefined');
        this.filterData();
      },
      error => this.processes.refreshing = false,
      () => this.processes.refreshing = false);
  }

  private filterData() {
    let filtered: Asset[];
    if (this.filterEx === 'all') {
      filtered = this.allAssets;
    } else {
      filtered = this.allAssets.filter(asset => asset.ex === this.filterEx);
    }

    if (this.fetchPriceFailed) {
      this.holdingValueSum = undefined;
      this.frozenValueSum = undefined;
    } else {
      let holdingValueSum = 0.0;
      let frozenValueSum = 0.0;
      for (const ma of filtered) {
        holdingValueSum += ma.holdingValue || 0.0;
        frozenValueSum += ma.frozenValue || 0.0;
      }
      this.holdingValueSum = holdingValueSum;
      this.frozenValueSum = frozenValueSum;
    }

    this.assets = filtered;
    if (this.skipSmallAsset && !this.fetchPriceFailed) {
      filtered = this.doFilterSmall(filtered);
    }
    this.dataSource.setData(filtered);
  }

  doFilterSmall(mas: Asset[]) {
    return mas.filter((ma) => ma.holdingValue > 1.0);
  }

  filterSmall() {
    if (this.skipSmallAsset) {
      const filtered = this.doFilterSmall(this.assets);
      this.dataSource.setData(filtered);
    } else {
      this.dataSource.setData(this.assets);
    }
  }

  exGroupChanged(event: MatButtonToggleChange) {
    this.filterEx = event.value;
    this.filterData();
  }

  syncAssets() {
    this.processes.syncAssets = true;
    this.dataSyncService.syncAssets()
      .subscribe((results: SyncResultGroup) => {
          this.processes.syncAssets = false;
          SyncResultGroupDialogComponent.ShowSyncResultGroupDialog(
            {syncResults: results, title: `同步成功`},
            this.dialog);

          this.refresh();
        },
        error => {
          this.processes.syncAssets = false;
          this.refresh();
        },
        () => this.processes.syncAssets = false
      );
  }

  syncAssetsFor(ex: string) {
    this.processes['syncAssets-' + ex] = true;
    this.dataSyncService.syncExAssets(ex)
      .subscribe((syncResult: SyncResult) => {
          this.processes['syncAssets-' + ex] = false;
          SyncResultDialogComponent.ShowSyncResultDialog(
            {syncResult, title: `同步成功（${ex}）`},
            this.dialog);
          if (syncResult.update > 0 || syncResult.create > 0) {
            this.refresh();
          }
        },
        error => this.processes['syncAssets-' + ex] = false,
        () => this.processes['syncAssets-' + ex] = false
      );
  }

  loadPairs(asset: Asset) {
    this.pairService.findExchangePairs(asset.ex, asset.ccy)
      .subscribe(pairsResult => {
        asset.pairsResult = pairsResult;
      });
  }

  openOrderForm(exchangePair: ExchangePair, side: 'buy' | 'sell' = 'sell') {
    const {ex, symbol, baseCcy, quoteCcy} = exchangePair;
    const orderForm = new OrderForm();
    orderForm.symbol = symbol;
    orderForm.side = side;
    const baseAsset = this.allAssets.find(a => a.ex === ex && a.ccy === baseCcy);
    const quoteAsset = this.allAssets.find(a => a.ex === ex && a.ccy === quoteCcy);

    const data: OrderFormParams = {baseAsset, quoteAsset, orderForm, exchangePair};

    const ref = OrderFormComponent.openOrderForm(this.dialog, data);
    OrderFormComponent.afterOrderPlacedDelay(ref, () => {
      if (data.placedForm && data.placedForm.type === 'market') {
        this.refresh();
      }
    });
  }

  showOrders(asset: Asset) {
    this.orderService.findByExCcy(asset.ex, asset.ccy)
      .subscribe(orders => {
        if (!orders || orders.length === 0) {
          this.orderService.showMessage('无订单');
          return;
        }
        const data: OrdersPopupData = {
          ex: asset.ex,
          baseCcy: asset.ccy,
          orders: orders
        };
        SpotOrdersDialogComponent.showOrders(this.dialog, data);
      });
  }

  showStructure() {
    let mas: Asset[] = this.dataSource.data;
    if (!mas) {
      return;
    }
    if (!this.skipSmallAsset) {
      mas = this.doFilterSmall(mas);
    }
    const ex = (this.filterEx === 'all') ? null : this.filterEx;
    const items = mas.map(ma => ({
      ccy: ex ? ma.ccy : `${ma.ex}: ${ma.ccy}`,
      holdingValue: ma.holdingValue
    }));
    AssetsStructureComponent.showAssetsStructureChart(
      this.dialog,
      {
        items,
        ex
      });
  }

  showCcyInfo(asset: Asset) {
    CcyInfoDialogComponent.showCcyInfo(asset.ccy, this.ccyService, this.dialog);
  }


  remove(asset: Asset) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.assetService.remove(asset)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.assetService.showError(opr);
          return;
        }
        this.dataSource.remove(asset);
      });
  }

}
