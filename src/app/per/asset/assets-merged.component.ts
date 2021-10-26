import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { map, tap } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';

import { MergedAsset } from '../../models/per/asset';
import { TableDatasource } from '../../common/table-datasource';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { AssetService } from '../../services/per/asset.service';
import { DataSyncService } from '../../services/sys/data-sync.service';
import { SyncResultGroup } from '../../models/sync-result';
import { ExchService } from '../../services/sys/exch.service';
import { Exch } from '../../models/sys/exch';
import { Ccy } from '../../models/mar/ccy';
import { SyncResultGroupDialogComponent } from '../../common/sync-result/sync-result-group-dialog.component';
import { OrdersPopupData, SpotOrdersDialogComponent } from '../order/spot-orders-dialog.component';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { CcyService } from '../../services/mar/ccy.service';
import { Result } from '../../models/result';
import { PairService } from '../../services/mar/pair.service';
import { AssetsStructureComponent } from './assets-structure.component';
import { CcyPairsDialogComponent } from '../../mar/pair/ccy-pairs-dialog.component';
import { CcyInfoDialogComponent } from '../../mar/ccy/ccy-info-dialog.component';

@Component({
  selector: 'app-assets-merged',
  templateUrl: './assets-merged.component.html',
  styleUrls: ['./assets-merged.component.css']
})
export class AssetsMergedComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<MergedAsset>;

  CoinLogoPath = Ccy.LogoPath;

  dataSource: TableDatasource<MergedAsset>;

  allAssets: MergedAsset[];
  holdingValueSum: number;
  frozenValueSum: number;
  skipSmallAsset = true;
  fetchPriceFailed = false;

  displayedColumns: string[] = ['index', 'ccyConcerned', 'ccy', 'price', 'ex',
    'holding', 'holdingValue', 'frozen', 'frozenValue', 'actions'];

  processes: { [name: string]: boolean } = {};

  $exchs: Observable<Exch[]>;

  constructor(protected sessionService: SessionService,
              private ccyService: CcyService,
              private pairService: PairService,
              private assetService: AssetService,
              private orderService: SpotOrderService,
              private exchService: ExchService,
              private dataSyncService: DataSyncService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<MergedAsset>();
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
    const ccys$ = this.ccyService.listConcerned();
    const assets$ = this.assetService.list2()
      .pipe(
        tap(assets => this.fetchPriceFailed = assets.every(a => typeof a.price === 'undefined')),
        map(MergedAsset.merge)
      );
    combineLatest([ccys$, assets$])
      .subscribe(([ccys, mas]) => {
          this.processes.false = true;

          const concernedCcys = new Set<string>(ccys.map(c => c.code));
          for (const ma of mas) {
            ma.ccyConcerned = concernedCcys.has(ma.ccy);
          }

          this.allAssets = mas;
          if (this.fetchPriceFailed) {
            this.holdingValueSum = undefined;
            this.frozenValueSum = undefined;
          } else {
            let holdingValueSum = 0.0;
            let frozenValueSum = 0.0;
            for (const ma of mas) {
              holdingValueSum += ma.holdingValue || 0.0;
              frozenValueSum += ma.frozenValue || 0.0;
            }
            this.holdingValueSum = holdingValueSum;
            this.frozenValueSum = frozenValueSum;
          }
          if (this.skipSmallAsset && !this.fetchPriceFailed) {
            mas = this.doFilterSmall(mas);
          }

          this.dataSource.setData(mas);
        },
        error => this.processes.refreshing = false,
        () => this.processes.refreshing = false)
  }

  doFilterSmall(mas: MergedAsset[]) {
    return mas.filter((ma) => ma.holdingValue > 1.0);
  }

  filterSmall() {
    if (this.skipSmallAsset) {
      const filtered = this.doFilterSmall(this.allAssets);
      this.dataSource.setData(filtered);
    } else {
      this.dataSource.setData(this.allAssets);
    }
  }

  concernAllNonSmall() {
    if (!this.skipSmallAsset || this.fetchPriceFailed) {
      return;
    }
    const mas: MergedAsset[] = this.dataSource.data;
    if (!mas) {
      return;
    }
    const codes = mas.filter(m => !m.ccyConcerned).map(m => m.ccy);
    if (codes.length === 0) {
      this.snackBar.open('已全部关注');
      return;
    }
    this.ccyService.addConcernByCodes(codes)
      .subscribe(opr => {
        if (opr.code === Result.CODE_SUCCESS) {
          mas.forEach(m => m.ccyConcerned = true);
          this.snackBar.open('加入关注成功，币种数：' + codes.length);
        }
      });
  }

  concernPairsWithUSDT() {
    if (!this.skipSmallAsset || this.fetchPriceFailed) {
      return;
    }
    const mas: MergedAsset[] = this.dataSource.data;
    if (!mas) {
      return;
    }
    const codes = mas.map(m => m.ccy).filter(ccy => ccy !== 'USDT');
    this.pairService.addConcernWithUsdt(codes)
      .subscribe(opr => {
        if (opr.code === Result.CODE_SUCCESS) {
          this.snackBar.open('已把相关交易对加入关注');
        }
      });
  }

  showPairsAsBase(asset: MergedAsset) {
    const baseCcy = asset.ccy;
    this.pairService.page2(null, {baseCcy, pageSize: 30})
      .subscribe(countList => {
        const pairs = countList.list;
        CcyPairsDialogComponent.showPairs(this.dialog, {baseCcy, pairs});
      });
  }

  toggleCcyConcern(ma: MergedAsset) {
    const ori = ma.ccyConcerned;
    this.ccyService.updateConcernedByCode(ma.ccy, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          ma.ccyConcerned = !ori;
          this.snackBar.open(ori ? '已取消关注此币种' : '已关注此币种');
        }
      });
  }

  showOrders(asset: MergedAsset) {
    this.orderService.findByCcy(asset.ccy)
      .subscribe(orders => {
        if (!orders || orders.length === 0) {
          this.orderService.showMessage('无订单');
          return;
        }
        const data: OrdersPopupData = {
          baseCcy: asset.ccy,
          orders: orders
        };
        SpotOrdersDialogComponent.showOrders(this.dialog, data);
      });
  }

  holdingTooltip(ma: MergedAsset) {
    return MergedAsset.holdingTooltip(ma);
  }

  frozenTooltip(ma: MergedAsset) {
    return MergedAsset.frozenTooltip(ma);
  }

  holdingValueTooltip(ma: MergedAsset) {
    return MergedAsset.holdingValueTooltip(ma);
  }

  frozenValueTooltip(ma: MergedAsset) {
    return MergedAsset.frozenValueTooltip(ma);
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
        error => this.processes.syncAssets = false,
        () => this.processes.syncAssets = false
      );
  }

  showStructure() {
    let mas: MergedAsset[] = this.dataSource.data;
    if (!mas) {
      return;
    }
    if (!this.skipSmallAsset) {
      mas = this.doFilterSmall(mas);
    }
    const items = mas.map(ma => ({ccy: ma.ccy, holdingValue: ma.holdingValue}));
    AssetsStructureComponent.showAssetsStructureChart(
      this.dialog,
      {items});
  }

  showCcyInfo(asset: MergedAsset) {
    CcyInfoDialogComponent.showCcyInfo(asset.ccy, this.ccyService, this.dialog);
  }

}
