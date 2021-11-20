import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { Observable } from 'rxjs';

import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { PairService } from '../../services/mar/pair.service';
import { CcyService } from '../../services/mar/ccy.service';
import { Ccy } from '../../models/mar/ccy';
import { PageableDatasource } from '../../10-common/pageable-datasource';
import { CcyInfoDialogComponent } from '../ccy/ccy-info-dialog.component';
import { QuoteCcyOptions } from '../../config';
import { fullLowerCaseToFullUpperCase } from '../../10-common/utils';
import { PairKline } from '../../models/mar/kline';
import { RollingPriceService } from '../../services/mar/rolling-price.service';
import { KlineChartDialogComponent } from '../kline-chart/kline-chart-dialog.component';
import { Exch } from '../../models/sys/exch';
import { ExPair } from '../../models/mar/ex-pair';
import { Result } from '../../models/result';
import { ExchService } from '../../services/sys/exch.service';


export interface RollingPricesFilter {
  list: 'dropping' | 'rising' | 'concerned';
  forceRefresh?: boolean;
  baseCcy?: string;
  quoteCcy?: string;
}

@Component({
  selector: 'app-24h-price',
  templateUrl: './rolling24h-price.component.html',
  styleUrls: ['./rolling24h-price.component.css']
})
export class Rolling24hPriceComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<PairKline>;

  dataSource: PageableDatasource<PairKline>;

  displayedColumns: string[] = ['index', 'concerned', 'baseCcy', 'quoteCcy',
    'changePercent', 'open', 'close', 'low', 'high', 'avgPrice', 'actions'];

  CoinLogoPath = Ccy.LogoPath;
  quoteCcyOptions = QuoteCcyOptions;
  $exchs: Observable<Exch[]>;

  filterForm: RollingPricesFilter = this.defaultFilter();

  processes: { [name: string]: boolean } = {};

  constructor(protected sessionService: SessionService,
              private ccyService: CcyService,
              private exchService: ExchService,
              private rollingPriceService: RollingPriceService,
              private pairService: PairService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new PageableDatasource<PairKline>(this.rollingPriceService);
  }

  protected withSession(user: User) {
    this.$exchs = this.exchService.list2();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.filter = this.filterForm;
    this.table.dataSource = this.dataSource;
    this.dataSource.refresh(this.filterForm);
  }

  private defaultFilter(): RollingPricesFilter {
    return {
      list: 'concerned',
      quoteCcy: 'USDT'
    } as RollingPricesFilter;
  }

  filter() {
    fullLowerCaseToFullUpperCase(this.filterForm, 'baseCcy');
    fullLowerCaseToFullUpperCase(this.filterForm, 'quoteCcy');
    this.dataSource.refresh(this.filterForm);
  }

  resetFilter() {
    this.filterForm.baseCcy = '';
    this.filterForm.quoteCcy = '';
    this.dataSource.refresh(this.filterForm);
  }

  listChanged(event: MatButtonToggleChange) {
    this.filterForm.list = event.value;
    this.filter();
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

  openKlineChart(pair: ExPair, ex: string) {
    KlineChartDialogComponent.showKlineChart(
      this.dialog,
      {
        ex,
        pair
      });
  }

  showBaseCcyInfo(pair: ExPair) {
    const pairWithUSDT = pair.quoteCcy === 'USDT' ? pair : null;
    CcyInfoDialogComponent.showCcyInfo(pair.baseCcy, this.ccyService, this.dialog, pairWithUSDT);
  }

}
