import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';
import { Observable } from 'rxjs';

import { SpotOrder, SpotOrderFilter } from '../../models/per/spot-order';
import { Result } from '../../models/result';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { PageableDatasource } from '../../common/pageable-datasource';
import { DataSyncService } from '../../services/sys/data-sync.service';
import { SyncResult, SyncResultGroup } from '../../models/sync-result';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { Ccy } from '../../models/mar/ccy';
import { SyncResultGroupDialogComponent } from '../../common/sync-result/sync-result-group-dialog.component';
import { SyncResultDialogComponent } from '../../common/sync-result/sync-result-dialog.component';
import { OrderFormComponent, OrderFormParams } from '../order-form/order-form.component';
import { ExchangePair } from '../../models/mar/ex-pair';
import { OrderForm } from '../../models/per/order-form';
import { OrderDetailDialogComponent } from './order-detail-dialog.component';

@Component({
  selector: 'app-spot-orders',
  templateUrl: './spot-orders.component.html',
  styleUrls: ['./spot-orders.component.css']
})
export class SpotOrdersComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<SpotOrder>;

  dataSource: PageableDatasource<SpotOrder>;

  displayedColumns: string[] = ['index', 'ex', 'baseCcy', 'quoteCcy', 'pairSymbol', 'orderId', 'side',
    'type', 'status', 'avgPrice', 'execQty', 'quoteAmount', 'createTs', /*'createdAt'/!*First Sync*!/,*/ 'actions'];

  CoinLogoPath = Ccy.LogoPath;
  $exchs: Observable<Exch[]>;

  filterEx: string = 'all';
  filterForm: any & SpotOrderFilter = {};

  processes: { [name: string]: boolean } = {};

  constructor(protected sessionService: SessionService,
              private exchService: ExchService,
              private spotOrderService: SpotOrderService,
              private dataSyncService: DataSyncService,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new PageableDatasource<SpotOrder>(this.spotOrderService);
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
    this.filterForm = {};
    this.dataSource.refresh(this.filterForm);
  }

  exGroupChanged(event: MatButtonToggleChange) {
    this.filterEx = event.value;
    if (this.filterEx === 'all') {
      delete this.filterForm.ex;
    } else {
      this.filterForm.ex = this.filterEx;
    }
    this.filter();
  }

  syncOrders() {
    this.processes.syncOrders = true;
    this.dataSyncService.syncOrders()
      .subscribe((results: SyncResultGroup) => {
          this.processes.syncOrders = false;
          SyncResultGroupDialogComponent.ShowSyncResultGroupDialog(
            {syncResults: results, title: '同步成功'},
            this.dialog);

          this.dataSource.refresh();
        },
        error => {
          this.processes.syncOrders = false;
          this.dataSource.refresh();
        },
        () => this.processes.syncOrders = false
      );
  }

  syncOrdersFor(ex: string) {
    this.processes['syncOrders-' + ex] = true;
    let obs: Observable<SyncResult>;
    if (ex === 'ba') {
      obs = this.dataSyncService.syncOrdersBa();
    } else if (ex === 'oe') {
      obs = this.dataSyncService.syncOrdersOe();
    } else if (ex === 'hb') {
      obs = this.dataSyncService.syncOrdersHb();
    }
    obs.subscribe((syncResult: SyncResult) => {
        this.processes['syncOrders-' + ex] = false;
        SyncResultDialogComponent.ShowSyncResultDialog(
          {syncResult, title: `同步成功（${ex}）`},
          this.dialog);
        if (syncResult.update > 0 || syncResult.create > 0) {
          this.dataSource.refresh();
        }
      },
      error => this.processes['syncOrders-' + ex] = false,
      () => this.processes['syncOrders-' + ex] = false
    );
  }

  showOrderDetail(order: SpotOrder) {
    OrderDetailDialogComponent.showOrderDetail(this.dialog, order);
  }

  openOrderForm(order: SpotOrder) {

    const exchangePair: ExchangePair = {
      ex: order.ex,
      symbol: order.pairSymbol,
      baseCcy: order.baseCcy,
      quoteCcy: order.quoteCcy
    };
    const orderForm = new OrderForm();
    orderForm.side = order.side === 'buy' ? 'sell' : 'buy';
    const data: OrderFormParams = {orderForm, exchangePair};

    const ref = OrderFormComponent.openOrderForm(this.dialog, data);
    OrderFormComponent.afterOrderPlacedDelay(ref, () => {
      if (data.placedForm && data.placedForm.type === 'market') {
        this.dataSource.refresh();
      }
    });
  }

  remove(spotOrder: SpotOrder) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.spotOrderService.remove(spotOrder)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.spotOrderService.showError(opr);
          return;
        }
        this.dataSource.refresh();
      });
  }

}
