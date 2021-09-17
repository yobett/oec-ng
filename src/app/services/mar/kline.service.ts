import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { Kline, KlineQueryForm } from '../../models/mar/kline';
import { BaseService } from '../base.service';


@Injectable()
export class KlineService extends BaseService<Kline> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/mar/klines`;
  }

  queryKlines(form: KlineQueryForm): Observable<Kline[]> {
    const ex = form.ex;
    const symbol = (form.pair as any)[ex + 'Symbol'];
    const interval = form.intervalOption.value;
    let url = `${this.baseUrl}/${ex}/${symbol}/${interval}?limit=` + form.limit;
    if (form.olderThan) {
      url += '&olderThan=' + form.olderThan;
    }
    if (form.newerThan) {
      url += '&newerThan=' + form.newerThan;
    }
    return this.list2(url);
  }

}
