import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { SpotOrder } from '../../models/per/spot-order';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { TableDatasource } from '../../10-common/table-datasource';
import { Exch } from '../../models/sys/exch';
import { ExchService } from '../../services/sys/exch.service';
import { PendingOrdersBaseComponent } from './pending-orders-base.component';

@Component({
  selector: 'app-pending-orders',
  templateUrl: './pending-orders.component.html',
  styleUrls: ['./pending-orders.component.css']
})
export class PendingOrdersComponent extends PendingOrdersBaseComponent {
  $exchs: Observable<Exch[]>;

  displayedColumns: string[] = ['index', 'ex', 'baseCcy', 'quoteCcy', /*'pairSymbol', 'orderId',*/ 'side',
    'type', 'status', 'askPrice', 'askQty', 'createTs', 'actions'];

  constructor(protected sessionService: SessionService,
              protected orderService: SpotOrderService,
              protected exchService: ExchService,
              protected snackBar: MatSnackBar,
              protected dialog: MatDialog) {
    super(sessionService,orderService,snackBar,dialog);
    this.dataSource = new TableDatasource<SpotOrder>();
  }

  protected withSession(user: User) {
    this.$exchs = this.exchService.list2();
    this.fetchPendingOrders();
  }

  fetchPendingOrders() {
    this.processes.fetchPendingOrders = true;
    this.orderService.fetchPendingOrders()
      .subscribe((orders: SpotOrder[]) => {
          this.processes.fetchPendingOrders = false;
          this.dataSource.setData(orders);
          this.snackBar.open('当前挂单查询成功');
        },
        error => this.processes.fetchPendingOrders = false,
        () => this.processes.fetchPendingOrders = false
      );
  }

}
