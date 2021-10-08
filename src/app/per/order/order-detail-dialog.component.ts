import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { SpotOrder } from '../../models/per/spot-order';
import { Ccy } from '../../models/mar/ccy';

@Component({
  selector: 'app-order-detail-dialog',
  templateUrl: './order-detail-dialog.component.html',
  styleUrls: ['./order-detail-dialog.component.css']
})
export class OrderDetailDialogComponent {
  order: SpotOrder;

  CoinLogoPath = Ccy.LogoPath;


  constructor(@Inject(MAT_DIALOG_DATA) public data: SpotOrder) {
    this.order = data;
  }

  static showOrderDetail(dialog: MatDialog, data: SpotOrder) {
    return dialog.open(
      OrderDetailDialogComponent, {
        disableClose: true,
        width: '380px',
        data
      });
  }

}
