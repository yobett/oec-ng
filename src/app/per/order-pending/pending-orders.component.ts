import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { SpotOrder } from '../../models/per/spot-order';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { TableDatasource } from '../../common/table-datasource';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { Ccy } from '../../models/mar/ccy';
import { OrderDetailDialogComponent } from '../order/order-detail-dialog.component';
import { ExchangePair } from '../../models/mar/ex-pair';
import { OrderForm } from '../../models/per/order-form';
import { OrderFormComponent, OrderFormParams } from '../order-form/order-form.component';

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
  CoinLogoPath = Ccy.LogoPath;

  displayedColumns: string[] = ['index', 'ex', 'baseCcy', 'quoteCcy', /*'pairSymbol',*/ 'orderId', 'side',
    'type', 'status', 'askPrice', 'askQty', 'createTs', 'actions'];

  processes: { [name: string]: boolean } = {};

  constructor(protected sessionService: SessionService,
              private spotOrderService: SpotOrderService,
              private exchService: ExchService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
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
          this.snackBar.open('订单已取消');
          this.dataSource.remove(order);
          // this.fetchPendingOrdersFor(order.ex);
        },
        error => this.processes['cancelOrder-' + order.orderId] = false,
        () => this.processes['cancelOrder-' + order.orderId] = false
      );
  }


  cancelAndOpenForm(order: SpotOrder) {
    if (!confirm('要取消订单吗？')) {
      return;
    }
    this.processes['cancelOrder-' + order.orderId] = true;
    this.spotOrderService.cancelOrder(order)
      .subscribe((res: any) => {
          this.processes['cancelOrder-' + order.orderId] = false;
          this.snackBar.open('订单已取消');

          this.openOrderForm(order);
        },
        error => this.processes['cancelOrder-' + order.orderId] = false,
        () => this.processes['cancelOrder-' + order.orderId] = false
      );
  }

  openOrderForm(order: SpotOrder) {

    const exchangePair: ExchangePair = {
      ex: order.ex,
      symbol: order.pairSymbol,
      baseCcy: order.baseCcy,
      quoteCcy: order.quoteCcy
    };
    const orderForm = new OrderForm();
    orderForm.side = order.side as 'buy' | 'sell';
    orderForm.type = 'limit';
    orderForm.price = order.askPrice;
    orderForm.quantity = order.askQty;
    const data: OrderFormParams = {orderForm, exchangePair};

    const ref = OrderFormComponent.openOrderForm(this.dialog, data);
    OrderFormComponent.afterOrderPlacedDelay(ref, () => {
      this.fetchPendingOrdersFor(order.ex);
    });
  }

  showOrderDetail(order: SpotOrder) {
    OrderDetailDialogComponent.showOrderDetail(this.dialog, order);
  }

  trackBy(index: number, order: SpotOrder) {
    return order.orderId;
  }

}