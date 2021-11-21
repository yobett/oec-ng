import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { CurrentPrices, PriceRequest, PriceResponse } from '../../models/mar/pair-price';
import { BaseService } from '../base.service';


@Injectable()
export class PriceService extends BaseService<any> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/mar/prices`;
  }


  inquirePrices(preferDS: string = null): Observable<CurrentPrices> {
    let url = `${this.baseUrl}/concern/inquirePrices`;
    if (preferDS) {
      url = url + '?preferDS=' + preferDS;
    }
    return this.postForResult2(url);
    // return this.pipeDefault(this.http.post<ValueResult<CurrentPrices>>(url, null))
    //   .pipe(map(result => result.value));
  }

  inquirePricesEx(priceRequests: PriceRequest[]): Observable<PriceResponse[]> {
    const url = `${this.baseUrl}/inquirePrices`;
    return this.postForList2(url);
    // return this.pipeDefault(this.http.post<ListResult<PriceResponse>>(url, priceRequests))
    //   .pipe(map(result => result.list));
  }

  inquirePrice(ex: string, symbol: string): Observable<number | string> {
    const url = `${this.baseUrl}/ticker/${ex}/${symbol}`;
    return this.getOne2(url);
    // return this.pipeDefault(this.http.get<ValueResult<number | string>>(url))
    //   .pipe(map(result => result.value));
  }

}
