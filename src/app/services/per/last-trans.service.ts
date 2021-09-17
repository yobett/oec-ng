import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { ModelCurdService } from '../model-curd.service';
import { LastTransaction } from '../../models/per/last-transaction';


@Injectable()
export class LastTransService extends ModelCurdService<LastTransaction> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/per/last-trans`;
  }

  findLastTransaction(baseCcy: string, quoteCcy: string): Observable<LastTransaction> {
    return this.getOne2(this.baseUrl + '/bq/' + baseCcy + '/' + quoteCcy);
  }

  list2WithPair(): Observable<LastTransaction[]> {
    return this.list2(this.baseUrl + '/all/withPair');
  }

}
