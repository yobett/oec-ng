import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { SpotOrder } from '../../models/per/spot-order';
import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { TableDatasource } from '../../10-common/table-datasource';
import { Ccy } from '../../models/mar/ccy';
import { OrderDetailDialogComponent } from '../order/order-detail-dialog.component';
import { ExchangePair } from '../../models/mar/ex-pair';
import { CancelOrderForm, OrderForm } from '../../models/per/order-form';
import { OrderFormComponent, OrderFormParams, PlacedOrder } from '../order-form/order-form.component';

@Component({
  template: ''
})
export abstract class PendingOrdersBaseComponent extends SessionSupportComponent implements AfterViewInit, OnInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<SpotOrder>;

  dataSource: TableDatasource<SpotOrder>;
  CoinLogoPath = Ccy.LogoPath;

  placedOrders: PlacedOrder[];

  processes: { [name: string]: boolean } = {};

  constructor(protected sessionService: SessionService,
              protected orderService: SpotOrderService,
              protected snackBar: MatSnackBar,
              protected dialog: MatDialog) {
    super(sessionService);
  }


  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
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
    const form: CancelOrderForm = {
      ex: order.ex,
      orderId: order.orderId,
      symbol: order.pairSymbol
    };
    this.processes['cancel-' + order.orderId] = true;
    this.orderService.cancelOrder(form)
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
    const form: CancelOrderForm = {
      ex: order.ex,
      orderId: order.orderId,
      symbol: order.pairSymbol,
      waitSyncAssets: true
    };
    this.processes['cancel-' + order.orderId] = true;
    this.orderService.cancelOrder(form)
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
    OrderFormComponent.afterOrderPlacedDelay(ref, (placedOrder: PlacedOrder) => {
      if (!this.placedOrders) {
        this.placedOrders = [];
      }
      this.placedOrders.push(placedOrder);
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
