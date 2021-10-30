import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {User} from '../models/sys/user';
import {SessionService} from '../services/sys/session.service';

@Component({template: ''})
export abstract class SessionSupportComponent implements OnInit, OnDestroy {

  protected userChangeSubscription: Subscription;

  get currentUser() {
    return this.sessionService.currentUser;
  }

  protected constructor(protected sessionService: SessionService) {

  }

  protected onInit() {
  }

  protected withSession(user: User) {
  }

  protected onUserFirstLogin(user: User) {
    // console.log('First Login: ' + user.username);
  }

  ngOnInit() {

    this.onInit();

    let login = true;
    this.userChangeSubscription = this.sessionService.currentUserSubject
      .subscribe((user: User) => {
        if (!user) {
          login = false;
          return;
        }
        if (!login) {
          login = true;
          this.onUserFirstLogin(user);
        }

        this.withSession(user);
      });

  }

  ngOnDestroy(): void {
    if (this.userChangeSubscription) {
      this.userChangeSubscription.unsubscribe();
    }
  }
}
