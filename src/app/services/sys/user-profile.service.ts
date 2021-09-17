import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { Observable } from 'rxjs';

import { User } from '../../models/sys/user';
import { Result } from '../../models/result';
import { BaseService } from '../base.service';


@Injectable()
export class UserProfileService extends BaseService<User> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/sys/user-profile`;
  }

  resetPassword(password: string, newPassword: string): Observable<Result> {
    const url = `${this.baseUrl}/resetPass`;
    const form = {password, newPassword};
    return super.pipeDefault(this.http.post<Result>(url, form));
  }

}
