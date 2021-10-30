import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Ccy } from '../../models/mar/ccy';
import { TableDatasource } from '../../10-common/table-datasource';
import { SessionSupportComponent } from '../../10-common/session-support.component';
import { SessionService } from '../../services/sys/session.service';
import { User } from '../../models/sys/user';
import { CcyService } from '../../services/mar/ccy.service';
import { StableCoins, StaticResource } from '../../config';
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
  avg1H = 0;
  avg24H = 0;

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
            this.setPrices(qcs);
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
            this.setPrices(tableData);
          }

          if (!first) {
            this.snackBar.open('已刷新');
          }
        },
        error => this.processes.fetchQuotes = false,
        () => this.processes.fetchQuotes = false);
  }

  private setPrices(tableData: QuoteCcy[]) {
    this.avg1H = 0;
    this.avg24H = 0;
    let count = 0;
    for (let qc of tableData) {
      const symbol = qc.code;
      const quote = this.quotesMap[symbol];
      Object.assign(qc, quote);

      if (StableCoins.includes(symbol)) {
        continue;
      }
      const c1h = quote['percent_change_1h'];
      const c24h = quote['percent_change_24h'];
      if (typeof c1h !== 'undefined' && typeof c24h !== 'undefined') {
        this.avg1H += c1h;
        this.avg24H += c24h;
        count++;
      }
    }
    if (count > 0) {
      this.avg1H /= count;
      this.avg24H /= count;
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.table.dataSource = this.dataSource;
  }

}
