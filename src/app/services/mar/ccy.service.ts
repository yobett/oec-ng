import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ModelCurdService } from '../model-curd.service';
import { Ccy } from '../../models/mar/ccy';
import { Result, ValueResult } from '../../models/result';
import { CcyMeta } from '../../models/mar/ccy-meta';


@Injectable()
export class CcyService extends ModelCurdService<Ccy> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/mar/ccys`;
  }

  getByCode(code: string): Observable<Ccy> {
    return this.getOne2(this.baseUrl + '/code/' + code);
  }

  listConcerned(): Observable<Ccy[]> {
    return this.list2(this.baseUrl + '/concerned');
  }

  updateConcerned(id: number, concerned: boolean): Observable<Result> {
    const url = `${this.baseUrl}/${id}/${concerned ? 'addConcern' : 'cancelConcern'}`;
    return this.pipeDefault(this.http.put<Result>(url, null));
  }

  updateConcernedByCode(code: string, concerned: boolean): Observable<Result> {
    const url = `${this.baseUrl}/code/${code}/${concerned ? 'addConcern' : 'cancelConcern'}`;
    return this.pipeDefault(this.http.put<Result>(url, null));
  }

  addConcernByCodes(codes: string[]): Observable<Result> {
    const url = `${this.baseUrl}/addConcern`;
    return this.pipeDefault(this.http.post<Result>(url, codes));
  }

  getMetadata(symbol: string): Observable<CcyMeta> {
    const url = `${this.baseUrl}/${symbol}/meta`;
    return this.pipeDefault(this.http.get<ValueResult<CcyMeta>>(url))
      .pipe(map(result => result.value));
  }

}
