import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LastTransaction } from '../../models/per/last-transaction';
import { TableDatasource } from '../../10-common/table-datasource';
import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { LastTransService } from '../../services/per/last-trans.service';
import { User } from '../../models/sys/user';
import { LastTransEditComponent } from './last-trans-edit.component';
import { Ccy } from '../../models/mar/ccy';
import { Result } from '../../models/result';
import { PairService } from '../../services/mar/pair.service';
import { ExPair } from '../../models/mar/ex-pair';
import { SpotOrder } from '../../models/per/spot-order';
import { OrderDetailDialogComponent } from '../order/order-detail-dialog.component';
import { SpotOrderService } from '../../services/per/spot-order.service';

@Component({
  selector: 'app-last-trans',
  templateUrl: './last-trans.component.html',
  styleUrls: ['./last-trans.component.css']
})
export class LastTransComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<LastTransaction>;

  CoinLogoPath = Ccy.LogoPath;

  dataSource: TableDatasource<LastTransaction>;

  displayedColumns: string[] = ['index', 'concerned', 'baseCcy', 'quoteCcy', 'side',
    'avgPrice', 'execQty', 'quoteAmount', 'ex', 'updateTs', 'actions'];

  constructor(protected sessionService: SessionService,
              private lastTransService: LastTransService,
              private spotOrderService: SpotOrderService,
              private pairService: PairService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    const ds = new TableDatasource<LastTransaction>();
    ds.compareFieldMappers = {concerned: (lt) => lt.pair && lt.pair.concerned};
    this.dataSource = ds;
  }

  protected withSession(user: User) {
    this.dataSource.setObservable(this.lastTransService.list2WithPair());
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }

  toggleConcern(pair: ExPair) {
    if (!pair) {
      return;
    }
    const ori = pair.concerned;
    this.pairService.updateConcerned(pair.id, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          pair.concerned = !ori;
          this.snackBar.open(ori ? '已取消关注此交易对' : '已关注此交易对');
        }
      });
  }

  edit(lastTrans: LastTransaction) {
    const dialogRef: MatDialogRef<LastTransEditComponent, LastTransaction> = this.dialog.open(
      LastTransEditComponent, {
        disableClose: true,
        width: '480px',
        maxWidth: '90vw',
        data: lastTrans
      });

    const isNewRecord = !lastTrans.id;
    dialogRef.afterClosed().subscribe((lastTrans1: LastTransaction) => {
      if (!lastTrans1) {
        return;
      }
      if (isNewRecord) {
        this.dataSource.append(lastTrans1);
      } else {
        // this.dataSource.update(lastTrans1);
      }
    });
  }

  showOrderDetail(lt: LastTransaction) {
    if (lt.order) {
      OrderDetailDialogComponent.showOrderDetail(this.dialog, lt.order);
    } else {
      this.spotOrderService.getById2(lt.oid)
        .subscribe((order: SpotOrder) => {
          lt.order = order;
          OrderDetailDialogComponent.showOrderDetail(this.dialog, order);
        });
    }
  }

  editNew() {
    const lt = new LastTransaction();
    this.edit(lt);
  }

  remove(lt: LastTransaction) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.lastTransService.remove(lt)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.lastTransService.showError(opr);
          return;
        }
        this.dataSource.remove(lt);
      });
  }

}
