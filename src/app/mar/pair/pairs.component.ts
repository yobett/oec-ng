import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';

import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { ExchangePair, ExPair, ExPairFilter } from '../../models/mar/ex-pair';
import { Result, ValueResult } from '../../models/result';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { PairEditComponent } from './pair-edit.component';
import { PairService } from '../../services/mar/pair.service';
import { CcyService } from '../../services/mar/ccy.service';
import { ExchService } from '../../services/sys/exch.service';
import { Ccy } from '../../models/mar/ccy';
import { Exch } from '../../models/sys/exch';
import { PageableDatasource } from '../../common/pageable-datasource';
import { DataSyncService } from '../../services/sys/data-sync.service';
import { SyncResult, SyncResultGroup } from '../../models/sync-result';
import { SyncResultDialogComponent } from '../../common/sync-result/sync-result-dialog.component';
import { SyncResultGroupDialogComponent } from '../../common/sync-result/sync-result-group-dialog.component';
import { OrderFormComponent, OrderFormParams } from '../../per/order-form/order-form.component';
import { KlineChartDialogComponent } from '../kline-chart/kline-chart-dialog.component';
import { MessageDialogComponent } from '../../common/message-dialog/message-dialog.component';
import { CcyInfoDialogComponent } from '../ccy/ccy-info-dialog.component';
import { QuoteCcyOptions } from '../../config';
import { fullLowerCaseToFullUpperCase } from '../../common/utils';

@Component({
  selector: 'app-pairs',
  templateUrl: './pairs.component.html',
  styleUrls: ['./pairs.component.css']
})
export class PairsComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<ExPair>;

  dataSource: PageableDatasource<ExPair>;

  displayedColumns: string[] = ['index', 'concerned', 'baseCcy', 'quoteCcy',
    'oeSymbol', 'baSymbol', 'hbSymbol', /*'createdAt',*/ 'actions'];

  CoinLogoPath = Ccy.LogoPath;
  quoteCcyOptions = QuoteCcyOptions;

  $ccys: Observable<Ccy[]>;
  $exchs: Observable<Exch[]>;
  filterForm: any & ExPairFilter = this.defaultFilter();

  processes: { [name: string]: boolean } = {};

  constructor(protected sessionService: SessionService,
              private ccyService: CcyService,
              private exchService: ExchService,
              private pairService: PairService,
              private dataSyncService: DataSyncService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new PageableDatasource<ExPair>(this.pairService);
  }

  protected withSession(user: User) {
    this.$exchs = this.exchService.list2();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.filter = this.filterForm;
    this.table.dataSource = this.dataSource;
  }

  private defaultFilter(): ExPairFilter {
    return {
      ex: '',
      concerned: true
    } as ExPairFilter;
  }

  filter() {
    delete this.filterForm.concerned;
    fullLowerCaseToFullUpperCase(this.filterForm, 'baseCcy');
    fullLowerCaseToFullUpperCase(this.filterForm, 'quoteCcy');
    this.dataSource.refresh(this.filterForm);
  }

  resetFilter() {
    this.filterForm.baseCcy = '';
    this.filterForm.quoteCcy = '';
    this.dataSource.refresh(this.filterForm);
  }

  concernedGroupChanged(event: MatButtonToggleChange) {
    if (event.value === 'concerned') {
      this.filterForm.concerned = true;
    } else {
      delete this.filterForm.concerned;
    }
    this.dataSource.refresh();
  }

  openOrderForm(exp: ExPair, ex: string) {
    const symbol = exp[ex + 'Symbol'];
    const exchangePair: ExchangePair = {
      ex,
      symbol,
      baseCcy: exp.baseCcy,
      quoteCcy: exp.quoteCcy
    };
    const data: OrderFormParams = {exchangePair};

    OrderFormComponent.openOrderForm(this.dialog, data);
  }

  openKlineChart(pair: ExPair, ex: string) {
    KlineChartDialogComponent.showKlineChart(
      this.dialog,
      {
        ex,
        pair
      });
  }


  exchangeInfo(exp: ExPair, ex: string) {
    const symbol = exp[ex + 'Symbol'];
    this.pairService.getExchangeInfo(ex, symbol)
      .subscribe((result: ValueResult<any>) => {
        const info = result.value;
        const msg = JSON.stringify(info, null, 2);
        const title = `交易对参数（${ex}: ${exp.baseCcy}-${exp.quoteCcy}）`;
        const data = {msg, type: '', title};
        MessageDialogComponent.ShowMessageDialog(data, this.dialog);
      });
  }

  syncPairs() {
    this.processes.syncPairs = true;
    this.dataSyncService.syncPairs()
      .subscribe((results: SyncResultGroup) => {
          this.processes.syncPairs = false;
          SyncResultGroupDialogComponent.ShowSyncResultGroupDialog(
            {syncResults: results, title: `同步成功`},
            this.dialog);
          this.dataSource.refresh();
        },
        error => {
          this.processes.syncPairs = false;
          this.dataSource.refresh();
        },
        () => this.processes.syncPairs = false
      );
  }

  syncPairsFor(ex: string) {
    this.processes.syncPairs = true;
    this.dataSyncService.syncExPairs(ex)
      .subscribe((syncResult: SyncResult) => {
          this.processes.syncPairs = false;
          SyncResultDialogComponent.ShowSyncResultDialog(
            {syncResult, title: `同步成功（${ex}）`},
            this.dialog);
          this.dataSource.refresh();
        },
        error => this.processes.syncPairs = false,
        () => this.processes.syncPairs = false
      );
  }

  toggleConcern(pair: ExPair) {
    const ori = pair.concerned;
    this.pairService.updateConcerned(pair.id, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          pair.concerned = !ori;
          this.snackBar.open(ori ? '已取消关注' : '已加入关注');
        }
      });
  }

  edit(pair) {
    if (!this.$ccys) {
      this.$ccys = this.ccyService.listConcerned().pipe(shareReplay());
    }

    const dialogRef: MatDialogRef<PairEditComponent, ExPair> = this.dialog.open(
      PairEditComponent, {
        disableClose: true,
        width: '480px',
        maxWidth: '90vw',
        data: {pair, $ccys: this.$ccys}
      });

    const isNewRecord = !pair.id;
    dialogRef.afterClosed().subscribe((pair1: ExPair) => {
      console.log(pair1);
      if (!pair1) {
        return;
      }
      if (isNewRecord) {
        this.dataSource.refresh();
      } else {
        // this.dataSource.update(pair1);
      }
    });
  }

  editNew() {
    this.edit(new ExPair());
  }

  remove(pair: ExPair) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.pairService.remove(pair)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.pairService.showError(opr);
          return;
        }
        this.dataSource.refresh();
      });
  }

  showBaseCcyInfo(pair: ExPair) {
    CcyInfoDialogComponent.showCcyInfo(pair.baseCcy, this.ccyService, this.dialog);
  }

}
