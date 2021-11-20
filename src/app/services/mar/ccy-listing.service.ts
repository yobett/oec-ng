import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { BaseService } from '../base.service';
import { CcyListingItem } from '../../models/mar/ccy-listing-item';


@Injectable()
export class CcyListingService extends BaseService<CcyListingItem> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/mar/ccy-listings`;
  }

}
