import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { Notification } from '../../models/sys/notification';
import { BaseService } from '../base.service';

@Injectable()
export class NotificationService extends BaseService<Notification> {

  sseUrl: string;

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/sys/notifications`;
    this.sseUrl = this.baseUrl + '/sse';
  }

}
