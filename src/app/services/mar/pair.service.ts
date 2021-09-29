import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ModelCurdService } from '../model-curd.service';
import { ExchangePair, ExchangePairsResult, ExPair } from '../../models/mar/ex-pair';
import { ListResult, Result, ValueResult } from '../../models/result';
import { CurrentPrices, PairPrice } from '../../models/mar/pair-price';


@Injectable()
export class PairService extends ModelCurdService<ExPair> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/mar/pairs`;
  }

  findExPair(baseCcy: string, quoteCcy: string): Observable<ExPair> {
    return this.getOne2(this.baseUrl + '/bq/' + baseCcy + '/' + quoteCcy);
  }

  getExchangeInfo(ex: string, symbol: string): Observable<ValueResult<any>> {
    const url = `${this.baseUrl}/exchangeInfo/${ex}/${symbol}`;
    return this.pipeDefault(this.http.get<ValueResult<any>>(url))
  }

  findConcerned(): Observable<ExPair[]> {
    return this.list2(this.baseUrl + '/concern');
  }

  list2WithLastTrans(): Observable<PairPrice[]> {
    return this.list2(this.baseUrl + '/concern/withLastTrans') as Observable<PairPrice[]>;
  }

  inquirePrices(preferDS: string = null): Observable<CurrentPrices> {
    let url = `${this.baseUrl}/concern/inquirePrices`;
    if (preferDS) {
      url = url + '?preferDS=' + preferDS
    }
    return this.pipeDefault(this.http.post<ValueResult<CurrentPrices>>(url, null))
      .pipe(map(result => result.value));
  }

  inquirePrice(ex: string, symbol: string): Observable<number | string> {
    const url = `${this.baseUrl}/ticker/${ex}/${symbol}`;
    return this.pipeDefault(this.http.get<ValueResult<number | string>>(url))
      .pipe(map(result => result.value));
  }

  updateConcerned(id: number, concerned: boolean): Observable<Result> {
    const url = `${this.baseUrl}/${id}/${concerned ? 'addConcern' : 'cancelConcern'}`;
    return this.pipeDefault(this.http.put<Result>(url, null));
  }

  addConcernWithUsdt(codes: string[]): Observable<Result> {
    const url = `${this.baseUrl}/addConcern/quote/USDT`;
    return this.pipeDefault(this.http.post<Result>(url, codes));
  }

  findExchangePairsByBase(ex: string, baseCcy: string): Observable<ExchangePair[]> {
    const url = `${this.baseUrl}/exchangePairs/ex/${ex}/base/${baseCcy}`;
    return this.pipeDefault(this.http.get<ListResult<ExchangePair>>(url))
      .pipe(map(result => result.list));
  }

  findExchangePairsByQuote(ex: string, quoteCcy: string): Observable<ExchangePair[]> {
    const url = `${this.baseUrl}/exchangePairs/ex/${ex}/quote/${quoteCcy}`;
    return this.pipeDefault(this.http.get<ListResult<ExchangePair>>(url))
      .pipe(map(result => result.list));
  }

  findExchangePairs(ex: string, ccy): Observable<ExchangePairsResult> {
    const url = `${this.baseUrl}/exchangePairs/ebq/${ex}/${ccy}`;
    return this.pipeDefault(this.http.get<ValueResult<number | string>>(url))
      .pipe(map(result => result.value));
  }

}
