import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Ccy } from '../../models/mar/ccy';
import { TableDatasource } from '../../common/table-datasource';
import { SessionSupportComponent } from '../../common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { CcyService } from '../../services/mar/ccy.service';
import { StaticResource } from '../../config';
import { Quote } from '../../models/quote';
import { QuoteService } from '../../services/mar/quote.service';

declare type QuoteCcy = (Ccy & Quote);

@Component({
  selector: 'app-ccy-quotes',
  templateUrl: './ccy-quotes.component.html',
  styleUrls: ['./ccy-quotes.component.css']
})
export class CcyQuotesComponent extends SessionSupportComponent implements AfterViewInit, OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<QuoteCcy>;

  dataSource: TableDatasource<QuoteCcy>;

  columnsBase: string[] = ['index', 'code', 'name', 'price',
    'percent_change_1h', 'percent_change_24h',
    'percent_change_7d', 'percent_change_30d'];

  columnsExtra: string[] = ['percent_change_60d', 'percent_change_90d'];

  displayedColumns: string[] = this.columnsBase;

  staticBase = StaticResource.BASE;
  moreColumns = false;

  processes: { [name: string]: boolean } = {};

  quotesMap: { [symbol: string]: Quote };

  constructor(protected sessionService: SessionService,
              private ccyService: CcyService,
              private quoteService: QuoteService,
              private snackBar: MatSnackBar) {
    super(sessionService);
  }

  protected onInit() {
    super.onInit();
    this.dataSource = new TableDatasource<QuoteCcy>();
  }

  protected withSession(user: User) {
    const qcObs: Observable<QuoteCcy[]> = this.ccyService.listConcerned()
      .pipe(
        map(ccys => ccys as QuoteCcy[]),
        tap(qcs => {
          if (this.quotesMap) {
            for (let qc of qcs) {
              const quote = this.quotesMap[qc.code];
              Object.assign(qc, quote);
            }
          }
        }));
    this.dataSource.setObservable(qcObs);

    this.fetchQuotes(true);
  }

  showEarlier() {
    this.displayedColumns = this.moreColumns ? this.columnsBase.concat(this.columnsExtra) : this.columnsBase;
  }

  fetchQuotes(first?: boolean) {
    this.processes.fetchQuotes = true;
    this.quoteService.getConcernCcyQuotes()
      .subscribe(qs => {
          this.processes.fetchQuotes = false;
          this.quotesMap = {};
          for (let q of qs) {
            this.quotesMap[q.symbol] = q;
          }
          const tableData: QuoteCcy[] = this.dataSource.data;
          if (tableData) {
            for (let qc of tableData) {
              const quote = this.quotesMap[qc.code];
              Object.assign(qc, quote);
            }
          }

          if (!first) {
            this.snackBar.open('已刷新');
          }
        },
        error => this.processes.fetchQuotes = false,
        () => this.processes.fetchQuotes = false);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

}
