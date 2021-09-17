import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';

import { environment } from '../../../environments/environment';
import { User } from '../../models/sys/user';
import { Result, ValueResult } from '../../models/result';
import { LoginInfo } from '../../models/sys/login-info';
import { LocalStorageKeys } from '../../config';
import { JwtPayload } from '../../models/jwt-payload';


@Injectable()
export class SessionService {

  private baseUrl: string;

  currentUser: User;

  currentUserSubject: BehaviorSubject<User> = new BehaviorSubject(null);

  navDrawerSubject: Subject<boolean> = new Subject();


  constructor(private http: HttpClient) {
    this.baseUrl = `${environment.apiBase}/session`;
  }

  login(username, password): Observable<ValueResult<User>> {
    return this.http.post<ValueResult<LoginInfo>>(this.baseUrl,
      {username, password})
      .pipe(
        map(result => {
          const li: LoginInfo = result.value;
          if (result && result.code === Result.CODE_SUCCESS) {
            const accessToken = li.accessToken;

            localStorage.setItem(LocalStorageKeys.AccessToken, accessToken);
            this.processLogin(li.user);
          }

          const userResult = new ValueResult<User>();
          userResult.code = result.code;
          userResult.message = result.message;
          if (li) {
            userResult.value = li.user;
          }

          return userResult;
        }));
  }

  checkLogin(): Observable<ValueResult<User>> {

    const accessToken = localStorage.getItem(LocalStorageKeys.AccessToken);
    const helper = new JwtHelperService();
    const isExpired = helper.isTokenExpired(accessToken);
    if (!isExpired) {
      const payload: JwtPayload = helper.decodeToken(accessToken);
      const user = new User();
      user.id = payload.userId;
      user.username = payload.username;
      user.role = payload.role;

      if (user.id && user.username) {
        this.processLogin(user);
        return of({
          code: 0,
          value: user
        });
      }
    }

    return this.http.get<ValueResult<User>>(this.baseUrl)
      .pipe(
        map(result => {
          if (result && result.code === Result.CODE_SUCCESS) {
            this.processLogin(result.value);
          }
          return result;
        }),
        catchError(err => {
          const fail = new ValueResult<User>();
          fail.code = err.status || -1;
          return of(fail);
        })
      );
  }

  private processLogin(user: User) {
    if (!user) {
      return;
    }
    if (this.currentUser && this.currentUser.username !== user.username) {
      console.log(`User Changed: ${this.currentUser.username} -> ${user.username}`);
    }

    this.currentUser = user;
    this.currentUserSubject.next(user);
    console.log(`User Login: ${this.currentUser.username}`);
  }

  logout(): Observable<Result> {
    localStorage.removeItem(LocalStorageKeys.AccessToken);
    this.currentUser = null;
    this.currentUserSubject.next(null);
    return of({code: 0});
    /*return this.http.delete(this.baseUrl)
      .pipe(
        map((opr: Result) => {
          if (opr && opr.code === 0) {
            if (this.currentUser) {
              console.log(`User Logout: ${this.currentUser.username}`);
            }
            this.currentUser = null;
            this.currentUserSubject.next(null);
          }
          return opr;
        })
      );*/
  }

}
