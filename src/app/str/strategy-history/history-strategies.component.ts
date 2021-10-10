import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { Observable } from 'rxjs';

import { TableDatasource } from '../../common/table-datasource';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { StrategyHistory } from '../../models/str/strategy-history';
import { Ccy } from '../../models/mar/ccy';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { StrategyHistoryService } from '../../services/str/strategy-history.service';
import { SpotOrder } from '../../models/per/spot-order';
import { OrderDetailDialogComponent } from '../../per/order/order-detail-dialog.component';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { Strategy } from '../../models/str/strategy';
import { StrategyDetailDialogComponent } from '../strategy/strategy-detail-dialog.component';

@Component({
  selector: 'app-strategies',
  templateUrl: './history-strategies.component.html',
  styleUrls: ['./history-strategies.component.css']
})
export class HistoryStrategiesComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<StrategyHistory>;

  CoinLogoPath = Ccy.LogoPath;
  getTypeLabel = Strategy.getTypeLabel;

  dataSource: TableDatasource<StrategyHistory>;
  $exchs: Observable<Exch[]>;

  allStrategies: StrategyHistory[];
  filterEx: string = 'all';

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
    this.dataSource = new TableDatasource<StrategyHistory>();
  }

  protected withSession(user: User) {
    this.$exchs = this.exchService.list2();
    this.strategyHistoryService.list2().subscribe(list => {
      this.allStrategies = list;
      this.filterData();
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

  filterData() {
    let filtered: StrategyHistory[];
    if (this.filterEx === 'all') {
      filtered = this.allStrategies;
    } else {
      filtered = this.allStrategies.filter(asset => asset.ex === this.filterEx);
    }
    this.dataSource.setData(filtered);
  }

  exGroupChanged(event: MatButtonToggleChange) {
    this.filterEx = event.value;
    this.filterData();
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
