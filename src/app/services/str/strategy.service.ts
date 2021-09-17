import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ModelCurdService } from '../model-curd.service';
import { Strategy } from '../../models/str/strategy';
import { ListResult, Result } from '../../models/result';


@Injectable()
export class StrategyService extends ModelCurdService<Strategy> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/str/strategies`;
  }

  saveMany(strategies: Strategy[]): Observable<Strategy[]> {
    const url = `${this.baseUrl}/saveMany`;
    return super.pipeDefault(this.http.post<ListResult<Strategy>>(url, strategies))
      .pipe(map(this.unwrapListResult));
  }

  findByType(type: string, params?: any): Observable<Strategy[]> {
    const url = `${this.baseUrl}/type/${type}`
    return super.list2(url, params);
  }

  setStatus(id: number, status: string): Observable<Result> {
    const url = this.baseUrl + '/' + id + '/status/' + status;
    return this.pipeDefault(this.http.post<Result>(url, null));
  }

  clearPeak(id: number): Observable<Result> {
    const url = this.baseUrl + '/' + id + '/clearPeak';
    return this.pipeDefault(this.http.post<Result>(url, null));
  }

  pauseAll(type: string = null): Observable<Result> {
    let url = this.baseUrl;
    if (type) {
      url += '/pause/type/' + type;
    } else {
      url += '/pauseAll';
    }
    return this.pipeDefault(this.http.post<Result>(url, null));
  }

  resumeAll(type: string = null): Observable<Result> {
    let url = this.baseUrl;
    if (type) {
      url += '/resume/type/' + type;
    } else {
      url += '/resumeAll';
    }
    return this.pipeDefault(this.http.post<Result>(url, null));
  }

  executeStrategy(id: number): Observable<Strategy> {
    const url = this.baseUrl + '/' + id + '/execute';
    return this.postForResult2(url, null);
  }

  testExecuteStrategy(id: number): Observable<Strategy> {
    const url = this.baseUrl + '/' + id + '/test-execute';
    return this.postForResult2(url, null);
  }

  executeAll(type: string = null): Observable<Result> {
    let url = this.baseUrl;
    if (type) {
      url += '/execute/type/' + type;
    } else {
      url += '/executeAll';
    }
    return this.pipeDefault(this.http.post<Result>(url, null));
  }

}
