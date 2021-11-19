import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { TableDatasource } from '../../10-common/table-datasource';
import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { StrategyNewComponent } from '../strategy-edit/strategy-new.component';
import { StrategyService } from '../../services/str/strategy.service';
import { Strategy, StrategyFilter } from '../../models/str/strategy';
import { Result } from '../../models/result';
import { Ccy } from '../../models/mar/ccy';
import { CcyService } from '../../services/mar/ccy.service';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { ExchangePair, ExPair } from '../../models/mar/ex-pair';
import { KlineChartDialogComponent } from '../../30-market/kline-chart/kline-chart-dialog.component';
import { OrderForm } from '../../models/per/order-form';
import { OrderFormComponent, OrderFormParams, PlacedOrder } from '../../50-order/order-form/order-form.component';
import { LocalStorageKeys } from '../../config';
import { StrategyDetailDialogComponent } from './strategy-detail-dialog.component';

@Component({
  selector: 'app-strategies',
  templateUrl: './strategies.component.html',
  styleUrls: ['./strategies.component.css']
})
export class StrategiesComponent extends SessionSupportComponent implements AfterViewInit, OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Strategy>;

  CoinLogoPath = Ccy.LogoPath;
  strategyType: string;
  getTypeLabel = Strategy.getTypeLabel;

  dataSource: TableDatasource<Strategy>;
  $ccys: Observable<Ccy[]>;
  $exchs: Observable<Exch[]>;

  allStrategies: Strategy[];
  allStrategiesMap: Map<number, Strategy>;
  filterEx: string = 'all';
  filterSide: 'all' | 'buy' | 'sell' = 'all';
  filterStatus: string = 'started'; // all

  processes: { [name: string]: boolean } = {};

  displayedColumns1: string[] = ['index', 'baseCcy', 'quoteCcy', 'ex', 'side', 'basePoint', 'expectingPercent', 'tradeVol'];
  displayedColumns21: string[] = ['tradingPoint', 'lastCheckAt', 'watchLevel', 'status'];
  displayedColumns22: string[] = ['executor', 'createdAt', 'actions'];
  // displayedColumns2: string[] = [...this.displayedColumns21, ...this.displayedColumns22];

  displayedColumnsByType = {
    [Strategy.TypeLB]: [...this.displayedColumns1, 'drawbackPercent', 'valley', 'beyondExpect',
      ...this.displayedColumns21, 'autoStartNext', ...this.displayedColumns22],
    [Strategy.TypeHS]: [...this.displayedColumns1, 'drawbackPercent', 'peak', 'beyondExpect',
      ...this.displayedColumns21, 'autoStartNext', ...this.displayedColumns22],
    [Strategy.TypeLS]: [...this.displayedColumns1, 'valley',
      ...this.displayedColumns21, 'updateBasePoint', ...this.displayedColumns22],
    [Strategy.TypeHB]: [...this.displayedColumns1, 'peak',
      ...this.displayedColumns21, 'updateBasePoint', ...this.displayedColumns22]
  }

  displayedColumnsTypeAll: string[] = ['index', 'baseCcy', 'quoteCcy', 'ex',
    'type', /*'watchDirection',*/
    'side', 'basePoint', 'expectingPercent', 'tradeVol',
    'drawbackPercent', 'peak', 'valley', 'beyondExpect',
    ...this.displayedColumns21, 'updateBasePoint', 'autoStartNext', ...this.displayedColumns22];

  displayedColumns: string[] = this.displayedColumnsTypeAll;

  constructor(protected sessionService: SessionService,
              private ccyService: CcyService,
              private strategyService: StrategyService,
              private exchService: ExchService,
              private activatedRoute: ActivatedRoute,
              private router: Router,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const type = params.get('type');
      this.strategyType = (type && type !== 'all') ? type.toUpperCase() : null;
      if (this.strategyType) {
        const columns = this.displayedColumnsByType[this.strategyType];
        if (columns) {
          this.displayedColumns = columns;
        } else {
          console.error('unknown Strategy type: ' + this.strategyType);
        }
        if (this.filterSide !== 'all') {
          const strategy = new Strategy(this.strategyType);
          this.filterSide = strategy.side;
        }
      } else {
        this.displayedColumns = this.displayedColumnsTypeAll;
      }
      if (this.dataSource) {
        this.dataSource.data = [];
        this.refresh();
      }
    });
    const filterEx = localStorage.getItem(LocalStorageKeys.StrategiesFilterEx);
    if (filterEx) {
      this.filterEx = filterEx;
    }
    const filterStatus = localStorage.getItem(LocalStorageKeys.StrategiesFilterStatus);
    if (filterStatus) {
      this.filterStatus = filterStatus;
    }
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<Strategy>();
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
    let filter: StrategyFilter = null;
    const getAll = this.filterEx === 'all' && this.filterSide === 'all' && this.filterStatus === 'all';
    if (!getAll) {
      filter = {};
      if (this.filterEx !== 'all') {
        filter.ex = this.filterEx;
      }
      if (this.filterSide !== 'all') {
        filter.side = this.filterSide;
      }
      if (this.filterStatus !== 'all') {
        filter.status = this.filterStatus;
      }
    }
    this.processes.refreshing = true;
    let obs: Observable<Strategy[]> = this.strategyType ?
      this.strategyService.findByType(this.strategyType, filter) :
      this.strategyService.list2(null, filter);
    obs.subscribe(list => {
        this.processes.false = true;
        if (getAll) {
          this.allStrategies = list;
          this.allStrategiesMap = new Map<number, Strategy>(list.map(s => [s.id, s]));
        } else {
          if (this.allStrategiesMap) {
            const list2 = [];
            for (const ns of list) {
              const os = this.allStrategiesMap.get(ns.id);
              if (os) {
                Object.assign(os, ns);
                list2.push(os);
              } else {
                list2.push(ns);
              }
            }
            list = list2;
          }
        }
        this.dataSource.setData(list);
        localStorage.setItem(LocalStorageKeys.StrategiesFilterEx, this.filterEx);
        localStorage.setItem(LocalStorageKeys.StrategiesFilterStatus, this.filterStatus);
      },
      error => this.processes.refreshing = false,
      () => this.processes.refreshing = false);
  }

  filterData() {
    if (this.allStrategies) {
      this.doFilterData();
    } else {
      this.refresh();
    }
  }

  doFilterData() {
    let filtered: Strategy[];
    if (this.filterEx === 'all') {
      filtered = this.allStrategies;
    } else {
      filtered = this.allStrategies.filter(asset => asset.ex === this.filterEx);
    }
    if (this.filterSide !== 'all') {
      filtered = filtered.filter(asset => asset.side === this.filterSide);
    }
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === this.filterStatus);
    }
    this.dataSource.setData(filtered);
    localStorage.setItem(LocalStorageKeys.StrategiesFilterEx, this.filterEx);
    localStorage.setItem(LocalStorageKeys.StrategiesFilterStatus, this.filterStatus);
  }

  exGroupChanged(event: MatButtonToggleChange) {
    this.filterEx = event.value;
    this.filterData();
  }

  sideGroupChanged(event: MatButtonToggleChange) {
    this.filterSide = event.value;
    this.filterData();
  }

  statusGroupChanged(event: MatButtonToggleChange) {
    this.filterStatus = event.value;
    this.filterData();
  }

  editNew() {
    if (!this.$ccys) {
      this.$ccys = this.ccyService.listConcerned().pipe(shareReplay());
    }
    const strategy = new Strategy(this.strategyType);
    strategy.ex = this.filterEx == 'all' ? Exch.DefaultExch : this.filterEx;
    strategy.quoteCcy = 'USDT';
    const dialogRef: MatDialogRef<StrategyNewComponent, Strategy> = StrategyNewComponent
      .openEditNewComponent({
        strategy,
        $ccys: this.$ccys,
        $exchs: this.$exchs
      }, this.dialog);

    dialogRef.afterClosed().subscribe((strategy1: Strategy) => {
      if (!strategy1) {
        return;
      }
      this.dataSource.append(strategy1);
      this.router.navigate(['strategies', this.strategyType, strategy1.id])
        .then(success => {
        });
    });
  }

  start(strategy: Strategy) {
    this.strategyService.setStatus(strategy.id, 'started')
      .subscribe(result => {
        strategy.status = 'started';
        this.snackBar.open('已开始');
      });
  }

  pause(strategy: Strategy) {
    this.strategyService.setStatus(strategy.id, 'paused')
      .subscribe(result => {
        strategy.status = 'paused';
        this.snackBar.open('已暂停');
      });
  }

  clearPeak(strategy: Strategy) {
    this.strategyService.clearPeak(strategy.id)
      .subscribe(result => {
        strategy.peak = null;
        strategy.peakTime = null;
        strategy.valley = null;
        strategy.valleyTime = null;
        strategy.beyondExpect = false;
        this.snackBar.open('已清除峰/谷值');
      });
  }

  pauseAll() {
    this.strategyService.pauseAll(this.strategyType)
      .subscribe(result => {
        let allStrategies = this.allStrategies;
        if (!allStrategies) {
          allStrategies = this.dataSource.data;
        }
        for (const st of allStrategies) {
          if (st.status === 'started') {
            st.status = 'paused';
          }
        }
        if (this.strategyType) {
          this.snackBar.open(`全部已暂停（${this.getTypeLabel(this.strategyType)}）`);
        } else {
          this.snackBar.open('全部已暂停');
        }
      });
  }

  resumeAll() {
    this.strategyService.resumeAll(this.strategyType)
      .subscribe(result => {
        let allStrategies = this.allStrategies;
        if (!allStrategies) {
          allStrategies = this.dataSource.data;
        }
        for (const st of allStrategies) {
          if (st.status === 'paused') {
            st.status = 'started';
          }
        }
        if (this.strategyType) {
          this.snackBar.open(`全部已恢复（${this.getTypeLabel(this.strategyType)}）`);
        } else {
          this.snackBar.open('全部已恢复');
        }
      });
  }

  execute(strategy: Strategy) {
    this.processes['execute-' + strategy.id] = true;
    this.strategyService.executeStrategy(strategy.id)
      .subscribe((strategy1: Strategy) => {
          this.processes['execute-' + strategy.id] = false;
          Object.assign(strategy, strategy1);
          this.snackBar.open('检查已完成');
        },
        error => this.processes['execute-' + strategy.id] = false,
        () => this.processes['execute-' + strategy.id] = false);
  }

  executeAll() {
    this.processes.executeAll = true;
    this.strategyService.executeAll(this.strategyType)
      .subscribe(result => {
          this.processes.executeAll = false;
          this.refresh();
          if (this.strategyType) {
            this.snackBar.open(`全部检查已完成（${this.getTypeLabel(this.strategyType)}）`);
          } else {
            this.snackBar.open('全部检查已完成');
          }
        },
        error => this.processes.executeAll = false,
        () => this.processes.executeAll = false);
  }

  openKlineChart(strategy: Strategy) {
    const pair: ExPair = new ExPair();
    pair.baseCcy = strategy.baseCcy;
    pair.quoteCcy = strategy.quoteCcy;
    pair[strategy.ex + 'Symbol'] = strategy.symbol;
    KlineChartDialogComponent.showKlineChart(
      this.dialog,
      {
        ex: strategy.ex,
        pair
      });
  }

  openOrderForm(strategy: Strategy) {
    const orderForm = new OrderForm();
    orderForm.side = strategy.side;
    const exchangePair: ExchangePair = {
      ex: strategy.ex,
      symbol: strategy.symbol,
      baseCcy: strategy.baseCcy,
      quoteCcy: strategy.quoteCcy
    };
    const data: OrderFormParams = {exchangePair, orderForm};

    const ref = OrderFormComponent.openOrderForm(this.dialog, data);
    if (strategy.status === 'started') {
      ref.afterClosed().subscribe((placedOrder: PlacedOrder) => {
        if (placedOrder) {
          this.pause(strategy);
        }
      });
    }
  }

  showDetail(strategy: Strategy) {
    StrategyDetailDialogComponent.showStrategyDetail(this.dialog, strategy);
  }

  remove(strategy: Strategy) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.strategyService.remove(strategy)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.strategyService.showError(opr);
          return;
        }
        this.dataSource.remove(strategy);
      });
  }

}
