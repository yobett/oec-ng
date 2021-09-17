import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { ModelCurdService } from '../model-curd.service';
import { Exapi } from '../../models/sys/exapi';


@Injectable()
export class ExapiService extends ModelCurdService<Exapi> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/sys/exapis`;
  }


}
