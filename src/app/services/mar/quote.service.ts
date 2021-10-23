import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { BaseService } from '../base.service';
import { Quote } from '../../models/quote';


@Injectable()
export class QuoteService extends BaseService<Quote> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/mar/quotes`;
  }

  getCcyQuote(ccy: string, convert: string = 'USD'): Observable<Quote> {
    let url = `${this.baseUrl}/ccy/${ccy}?convert=` + convert;
    return this.getOne2(url);
  }

  getConcernCcyQuotes(convert: string = 'USD'): Observable<Quote[]> {
    let url = `${this.baseUrl}/latest?convert=` + convert;
    return this.list2(url);
  }

}
