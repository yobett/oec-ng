import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { SpotOrder } from '../../models/per/spot-order';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { TableDatasource } from '../../10-common/table-datasource';
import { Ccy } from '../../models/mar/ccy';
import { OrderDetailDialogComponent } from '../order/order-detail-dialog.component';
import { ExchangePair } from '../../models/mar/ex-pair';
import { OrderForm } from '../../models/per/order-form';
import { OrderFormComponent, OrderFormParams } from '../order-form/order-form.component';

@Component({
  selector: 'app-pending-orders-dialog',
  templateUrl: './pending-orders-dialog.component.html',
  styleUrls: ['./pending-orders-dialog.component.css']
})
export class PendingOrdersDialogComponent implements AfterViewInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<SpotOrder>;

  dataSource: TableDatasource<SpotOrder>;
  CoinLogoPath = Ccy.LogoPath;
  orders: SpotOrder[];

  displayedColumns: string[] = [/*'index',*/ 'ex', 'baseCcy', 'quoteCcy', 'side',
    /*'type', 'status',*/ 'askPrice', 'askQty', 'createTs', 'actions'];

  processes: { [name: string]: boolean } = {};

  constructor(private orderService: SpotOrderService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              @Inject(MAT_DIALOG_DATA) public data: { orders: SpotOrder[] }) {
    this.orders = data.orders;
    this.dataSource = new TableDatasource<SpotOrder>();
  }


  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
    this.dataSource.setData(this.orders);
  }

  fetchPendingOrdersFor(ex: string) {
    this.processes['pending-' + ex] = true;
    this.orderService.fetchPendingOrdersFor(ex)
      .subscribe((orders: SpotOrder[]) => {
          this.processes['pending-' + ex] = false;
          this.snackBar.open('已刷新（' + ex + '）');
          const data = this.dataSource.data;
          if (!data || data.length === 0) {
            this.dataSource.setData(orders);
            return;
          }
          const withoutEx = data.filter(order => order.ex !== ex);
          this.dataSource.setData(withoutEx.concat(orders));
        },
        error => this.processes['pending-' + ex] = false,
        () => this.processes['pending-' + ex] = false
      );
  }

  cancelOrder(order: SpotOrder) {
    if (!confirm('要取消订单吗？')) {
      return;
    }
    this.processes['cancel-' + order.orderId] = true;
    this.orderService.cancelOrder(order)
      .subscribe((res: any) => {
          this.processes['cancel-' + order.orderId] = false;
          this.snackBar.open('订单已取消');
          this.dataSource.remove(order);
        },
        error => this.processes['cancel-' + order.orderId] = false,
        () => this.processes['cancel-' + order.orderId] = false
      );
  }

  cancelAndOpenForm(order: SpotOrder) {
    if (!confirm('要取消订单吗？')) {
      return;
    }
    this.processes['cancel-' + order.orderId] = true;
    this.orderService.cancelOrder(order)
      .subscribe((res: any) => {
          this.processes['cancel-' + order.orderId] = false;
          this.snackBar.open('订单已取消');
          this.openOrderForm(order);
        },
        error => this.processes['cancel-' + order.orderId] = false,
        () => this.processes['cancel-' + order.orderId] = false
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

  static showPendingOrders(dialog: MatDialog, orders: SpotOrder[]) {
    return dialog.open(
      PendingOrdersDialogComponent, {
        disableClose: true,
        width: '700px',
        maxWidth: '90vw',
        data: {orders}
      });
  }

}
