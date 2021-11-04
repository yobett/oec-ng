import { Component, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { SpotOrder } from '../../models/per/spot-order';
import { SpotOrderService } from '../../services/per/spot-order.service';
import { TableDatasource } from '../../10-common/table-datasource';
import { OrderFormComponent } from '../order-form/order-form.component';
import { PendingOrdersBaseComponent } from './pending-orders-base.component';
import { SessionService } from '../../services/sys/session.service';

@Component({
  selector: 'app-pending-orders-dialog',
  templateUrl: './pending-orders-dialog.component.html',
  styleUrls: ['./pending-orders-dialog.component.css']
})
export class PendingOrdersDialogComponent extends PendingOrdersBaseComponent {
  orders: SpotOrder[];

  displayedColumns: string[] = [/*'index',*/ 'ex', 'baseCcy', 'quoteCcy', 'side',
    /*'type', 'status',*/ 'askPrice', 'askQty', 'createTs', 'actions'];

  constructor(protected sessionService: SessionService,
              protected orderService: SpotOrderService,
              protected snackBar: MatSnackBar,
              protected dialog: MatDialog,
              public dialogRef: MatDialogRef<OrderFormComponent, number>,
              @Inject(MAT_DIALOG_DATA) public data: { orders: SpotOrder[] }) {
    super(sessionService,orderService,snackBar,dialog);
    this.orders = data.orders;
    this.dataSource = new TableDatasource<SpotOrder>();
  }


  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
    this.dataSource.setData(this.orders);
  }

  closeDialog() {
    this.dialogRef.close();
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
