import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';

import { Ccy, CcyFilter } from '../../models/mar/ccy';
import { Result } from '../../models/result';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { CcyEditComponent } from './ccy-edit.component';
import { CcyService } from '../../services/mar/ccy.service';
import { StaticResource } from '../../config';
import { PageableDatasource } from '../../common/pageable-datasource';
import { SyncResult } from '../../models/sync-result';
import { DataSyncService } from '../../services/sys/data-sync.service';
import { CcyMetaComponent } from './ccy-meta.component';
import { SyncResultDialogComponent } from '../../common/sync-result/sync-result-dialog.component';
import { QuoteService } from '../../services/mar/quote.service';
import { CcyQuoteDialogComponent } from '../ccy-quote/ccy-quote-dialog.component';
import { CcyPairsDialogComponent } from '../pair/ccy-pairs-dialog.component';
import { PairService } from '../../services/mar/pair.service';

@Component({
  selector: 'app-ccys',
  templateUrl: './ccys.component.html',
  styleUrls: ['./ccys.component.css']
})
export class CcysComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Ccy>;

  dataSource: PageableDatasource<Ccy>;

  displayedColumns: string[] = ['index', 'concerned', 'no', 'code', 'name', /*'createdAt',*/ 'actions'];

  staticBase = StaticResource.BASE;

  processes: { [name: string]: boolean } = {};

  filterForm: any & CcyFilter = this.defaultFilter();

  constructor(protected sessionService: SessionService,
              private ccyService: CcyService,
              private quoteService: QuoteService,
              private pairService: PairService,
              private dataSyncService: DataSyncService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new PageableDatasource<Ccy>(this.ccyService);
  }

  protected withSession(user: User) {
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.filter = this.filterForm;
    this.table.dataSource = this.dataSource;
  }

  private defaultFilter(): CcyFilter {
    return {
      concerned: true
    } as CcyFilter;
  }

  filter() {
    delete this.filterForm.concerned;
    this.dataSource.refresh(this.filterForm);
  }

  resetFilter() {
    this.filterForm.code = '';
    this.filterForm.name = '';
    this.dataSource.refresh(this.filterForm);
  }

  concernedGroupChanged(event: MatButtonToggleChange) {
    if (event.value === 'concerned') {
      this.filterForm.concerned = true;
    } else {
      delete this.filterForm.concerned;
    }
    this.dataSource.refresh();
  }

  syncCurrencies(limit: number) {
    this.processes.syncCurrencies = true;
    this.dataSyncService.syncCurrencies(limit)
      .subscribe((syncResult: SyncResult) => {
          this.processes.syncCurrencies = false;
          SyncResultDialogComponent.ShowSyncResultDialog({
            syncResult,
            title: `同步成功（前${limit}条）`
          }, this.dialog);
          this.dataSource.refresh();
        },
        error => this.processes.syncCurrencies = false,
        () => this.processes.syncCurrencies = false
      );
  }

  syncCurrenciesFromPairs() {
    this.processes.syncCurrencies = true;
    this.dataSyncService.syncCurrenciesFromPairs()
      .subscribe((syncResult: SyncResult) => {
          this.processes.syncCurrencies = false;
          SyncResultDialogComponent.ShowSyncResultDialog({
            syncResult,
            title: '同步成功（系统中所有交易对所涉及的币种）'
          }, this.dialog);
          this.dataSource.refresh();
        },
        error => this.processes.syncCurrencies = false,
        () => this.processes.syncCurrencies = false
      );
  }

  showMeta(ccy: Ccy) {
    CcyMetaComponent.showMetadata(ccy.code, this.ccyService, this.dialog);
  }

  showQuote(ccy: Ccy) {
    CcyQuoteDialogComponent.showQuote(ccy.code, this.quoteService, this.dialog);
  }

  edit(ccy) {
    const dialogRef: MatDialogRef<CcyEditComponent, Ccy> = this.dialog.open(
      CcyEditComponent, {
        disableClose: true,
        width: '480px',
        maxWidth: '90vw',
        data: ccy
      });

    const isNewRecord = !ccy.id;
    dialogRef.afterClosed().subscribe((ccy1: Ccy) => {
      console.log(ccy1);
      if (!ccy1) {
        return;
      }
      if (isNewRecord) {
        this.dataSource.refresh();
      } else {
        // this.dataSource.update(ccy1);
      }
    });
  }

  editNew() {
    this.edit(new Ccy());
  }

  toggleConcern(ccy: Ccy) {
    const ori = ccy.concerned;
    this.ccyService.updateConcerned(ccy.id, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          ccy.concerned = !ori;
          this.snackBar.open(ori ? '已取消关注' : '已加入关注');
        }
      });
  }

  showPairsAsBase(ccy: Ccy) {
    const baseCcy = ccy.code;
    this.pairService.page2(null, {baseCcy, pageSize: 30})
      .subscribe(countList => {
        const pairs = countList.list;
        CcyPairsDialogComponent.showPairs(this.dialog, {baseCcy, pairs});
      });
  }

  remove(ccy: Ccy) {
    if (!confirm('确定要删除吗？')) {
      return;
    }
    this.ccyService.remove(ccy)
      .subscribe((opr: Result) => {
        if (opr.code !== Result.CODE_SUCCESS) {
          this.ccyService.showError(opr);
          return;
        }
        this.dataSource.refresh();
      });
  }

}
