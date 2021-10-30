import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Moment } from 'moment';

import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { StrategyHistory, StrategyHistoryFilter } from '../../models/str/strategy-history';
import { Ccy } from '../../models/mar/ccy';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { StrategyHistoryService } from '../../services/str/strategy-history.service';
import { SpotOrder } from '../../models/per/spot-order';
import { OrderDetailDialogComponent } from '../../50-order/order/order-detail-dialog.component';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { Strategy } from '../../models/str/strategy';
import { StrategyDetailDialogComponent } from '../strategy/strategy-detail-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { PageableDatasource } from '../../10-common/pageable-datasource';
import { DATE_FORMAT } from '../../config';

@Component({
  selector: 'app-strategies',
  templateUrl: './history-strategies.component.html',
  styleUrls: ['./history-strategies.component.css']
})
export class HistoryStrategiesComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<StrategyHistory>;

  CoinLogoPath = Ccy.LogoPath;
  getTypeLabel = Strategy.getTypeLabel;
  strategyTypes = Strategy.TypeOptions;

  dataSource: PageableDatasource<StrategyHistory>;
  $exchs: Observable<Exch[]>;

  today: Date = new Date();
  filterForm: any & StrategyHistoryFilter = {ex: 'all', type: 'all', side: 'all'};

  processes: { [name: string]: boolean } = {};

  displayedColumns: string[] = ['index', 'baseCcy', 'quoteCcy', 'ex', 'type', /*'watchDirection',*/
    'side', 'basePoint', 'expectingPoint', 'peak', 'valley', /*'clientOrderId',*/ 'orderPlacedAt', 'actions'];

  constructor(protected sessionService: SessionService,
              private strategyHistoryService: StrategyHistoryService,
              private exchService: ExchService,
              private spotOrderService: SpotOrderService,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new PageableDatasource<StrategyHistory>(this.strategyHistoryService);
    this.dataSource.paramsTransformer = (form) => {
      form = {...form};
      if (form.ex === 'all') {
        delete form.ex;
      }
      if (form.side === 'all') {
        delete form.side;
      }
      if (form.type === 'all') {
        delete form.type;
      }
      let mom = form.orderPlacedDateTo;
      if (mom) {
        if (mom.constructor.name === 'Moment' || mom['_isAMomentObject'] === true) {
          form.orderPlacedDateTo = (mom as Moment).format(DATE_FORMAT);
        }
      } else {
        delete form.orderPlacedDateTo;
      }
      return form;
    };
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

  filter() {
    this.dataSource.refresh(this.filterForm);
  }

  resetFilter() {
    this.filterForm = {ex: 'all', type: 'all', side: 'all'};
    this.dataSource.refresh(this.filterForm);
  }

  showStrategyDetail(strategy: Strategy) {
    StrategyDetailDialogComponent.showStrategyDetail(this.dialog, strategy);
  }

  showOrderDetail(st: StrategyHistory) {
    if (st.order) {
      OrderDetailDialogComponent.showOrderDetail(this.dialog, st.order);
    } else {
      this.spotOrderService.getByClientOrderId(st.clientOrderId)
        .subscribe((order: SpotOrder) => {
          st.order = order;
          OrderDetailDialogComponent.showOrderDetail(this.dialog, order);
        });
    }
  }

}
