import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatDialog} from '@angular/material/dialog';
import { Observable } from 'rxjs';

import {User} from '../../models/sys/user';
import {ModelCurdService} from '../model-curd.service';
import { Result } from '../../models/result';


@Injectable()
export class UserService extends ModelCurdService<User> {

  constructor(protected http: HttpClient,
              protected dialog: MatDialog) {
    super(http, dialog);
    this.baseUrl = this.apiBase + `/sys/users`;
  }


  resetPassword(username: string, newPassword: string): Observable<Result> {
    const url = `${this.baseUrl}/resetPass`;
    const form = {username, newPassword};
    return super.pipeDefault(this.http.post<Result>(url, form));
  }

}
