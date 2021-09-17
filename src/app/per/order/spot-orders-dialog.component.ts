import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { SpotOrder } from '../../models/per/spot-order';
import { Ccy } from '../../models/mar/ccy';
import { TableDatasource } from '../../common/table-datasource';

export interface OrdersPopupData {
  ex?: string;
  baseCcy: string;
  quoteCcy?: string;
  orders: SpotOrder[];
}

@Component({
  selector: 'app-spot-orders-dialog',
  templateUrl: './spot-orders-dialog.component.html',
  styleUrls: ['./spot-orders-dialog.component.css']
})
export class SpotOrdersDialogComponent implements AfterViewInit {
  @ViewChild(MatTable) table: MatTable<SpotOrder>;

  dataSource: TableDatasource<SpotOrder>;
  baseCcy: string;
  quoteCcy?: string;
  ex?: string;

  displayedColumns: string[] = ['index', 'ex', 'baseCcy', 'quoteCcy', /*'pairSymbol', 'orderId',*/ 'side',
    'type', 'status', 'avgPrice', 'execQty', 'quoteAmount', 'createTs'];

  CoinLogoPath = Ccy.LogoPath;

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrdersPopupData) {
    this.dataSource = new TableDatasource<SpotOrder>();
    this.dataSource.data = data.orders;
    this.ex = data.ex;
    this.baseCcy = data.baseCcy;
    this.quoteCcy = data.quoteCcy;
    if (this.ex) {
      this.displayedColumns = this.displayedColumns.filter(c => c !== 'ex');
    }
  }

  ngAfterViewInit() {
    this.table.dataSource = this.dataSource;
  }

  static showOrders(dialog: MatDialog, data: OrdersPopupData) {
    return dialog.open(
      SpotOrdersDialogComponent, {
        disableClose: true,
        width: '100%',
        data
      });
  }


}
