import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

import { SpotOrder } from '../../models/per/spot-order';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { TableDatasource } from '../../common/table-datasource';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';

@Component({
  selector: 'app-pending-orders',
  templateUrl: './pending-orders.component.html',
  styleUrls: ['./pending-orders.component.css']
})
export class PendingOrdersComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<SpotOrder>;

  dataSource: TableDatasource<SpotOrder>;
  $exchs: Observable<Exch[]>;

  displayedColumns: string[] = ['index', 'ex', 'pairSymbol', 'orderId', 'side',
    'type', 'status', 'askPrice', 'askQty', 'createTs', 'actions'];

  processes: { [name: string]: boolean } = {};

  constructor(protected sessionService: SessionService,
              private spotOrderService: SpotOrderService,
              private exchService: ExchService,
              private snackBar: MatSnackBar) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<SpotOrder>();
  }

  protected withSession(user: User) {
    this.$exchs = this.exchService.list2();
    this.fetchPendingOrders();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }

  fetchPendingOrders() {
    this.processes.fetchPendingOrders = true;
    this.spotOrderService.fetchPendingOrders()
      .subscribe((orders: SpotOrder[]) => {
          this.processes.fetchPendingOrders = false;
          this.dataSource.setData(orders);
          this.snackBar.open('未完成订单查询成功');
        },
        error => this.processes.fetchPendingOrders = false,
        () => this.processes.fetchPendingOrders = false
      );
  }

  fetchPendingOrdersFor(ex: string) {
    this.processes['pendingOrders-' + ex] = true;
    this.spotOrderService.fetchPendingOrdersFor(ex)
      .subscribe((orders: SpotOrder[]) => {
          this.processes['pendingOrders-' + ex] = false;
          this.snackBar.open('未完成订单查询成功（' + ex + '）');
          const data = this.dataSource.data;
          if (!data || data.length === 0) {
            this.dataSource.setData(orders);
            return;
          }
          const withoutEx = data.filter(order => order.ex !== ex);
          this.dataSource.setData(withoutEx.concat(orders));
        },
        error => this.processes['pendingOrders-' + ex] = false,
        () => this.processes['pendingOrders-' + ex] = false
      );
  }

  cancelOrder(order: SpotOrder) {
    if (!confirm('要取消订单吗？')) {
      return;
    }
    this.processes['cancelOrder-' + order.orderId] = true;
    this.spotOrderService.cancelOrder(order)
      .subscribe((res: any) => {
          this.processes['cancelOrder-' + order.orderId] = false;
          this.snackBar.open('取消订单请求已提交');
        },
        error => this.processes['cancelOrder-' + order.orderId] = false,
        () => this.processes['cancelOrder-' + order.orderId] = false
      );
  }

  trackBy(index: number, order: SpotOrder) {
    return order.orderId;
  }

}
