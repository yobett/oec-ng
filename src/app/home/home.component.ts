import { ChangeDetectorRef, Component, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, MediaMatcher } from '@angular/cdk/layout';
import { MatDrawerMode } from '@angular/material/sidenav/drawer';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SessionService } from '../services/sys/session.service';
import { LoginDialogComponent } from '../sys/account/login-dialog.component';
import { Result, ValueResult } from '../models/result';
import { User } from '../models/sys/user';
import { SessionSupportComponent } from '../common/session-support.component';
import { UserService } from '../services/sys/user.service';
import { UserDetailComponent } from '../sys/user/user-detail.component';
import { NotificationService } from '../services/sys/notification.service';
import { Notification } from '../models/sys/notification';
import { LocalStorageKeys } from '../config';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent extends SessionSupportComponent implements OnDestroy {

  mobileQuery: MediaQueryList;
  eventSource: EventSource;

  lastDrawerMode: MatDrawerMode;
  mobileQueryListener: () => void;

  beenLogin = false;
  notificationsOn = true;

  constructor(protected sessionService: SessionService,
              private userService: UserService,
              private notificationService: NotificationService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              private breakpointObserver: BreakpointObserver,
              private router: Router,
              changeDetectorRef: ChangeDetectorRef,
              media: MediaMatcher) {
    super(sessionService);

    this.mobileQuery = media.matchMedia('(max-width: 1000px)');
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('a', this.mobileQueryListener);

    const notifications = localStorage.getItem(LocalStorageKeys.Notifications);
    this.notificationsOn = notifications === null || notifications === 'on';
  }

  onInit() {
    if (!this.currentUser) {
      this.sessionService.checkLogin()
        .subscribe((result: ValueResult<User>) => {
          if (result.code === Result.CODE_SUCCESS && !result.value) {
            if (!this.beenLogin) {
              this.userService.openLoginDialog();
            }
          } else if (result.code === Result.CODE_NOT_AUTHENTICATED) {
            this.userService.openLoginDialog();
          }
        });
    }
  }

  drawerChange(opened: boolean, mode: MatDrawerMode) {
    if (mode === 'over' && this.lastDrawerMode === 'over') {
      return;
    }
    this.lastDrawerMode = mode;
    this.sessionService.navDrawerSubject.next(opened);
  }

  showDetail() {
    const cu = this.currentUser;
    if (!cu) {
      // alert("尚未登录!")
      this.userService.showMessage('尚未登录');
      return;
    }
    UserDetailComponent.ShowDetail(cu, this.dialog);
  }

  // @HostListener('window:visibilitychange', ['$event'])
  // visibilityChange(event) {
  //   console.log(event);
  //   console.log(document.hidden);
  // }

  enableNotification() {
    if (!window.Notification) {
      this.userService.showErrorMessage('此浏览器不支持通知');
      return;
    }
    window.Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        this.notificationsOn = true;
        if (!this.eventSource) {
          this.setupEventSource();
        }
        localStorage.setItem(LocalStorageKeys.Notifications, 'on');
        this.snackBar.open('已开启通知');
      } else {
        // console.log(permission);
        this.userService.showErrorMessage('未能获得通知权限，请手工赋予权限');
      }
    });
  }

  disableNotification() {
    this.notificationsOn = false;
    localStorage.setItem(LocalStorageKeys.Notifications, 'off');
    this.snackBar.open('已关闭通知');
  }

  async askNotificationPermission(): Promise<boolean> {

    if (!window.Notification) {
      console.error('This browser does not support notifications.');
      return false;
    }

    const permission = await window.Notification.requestPermission();
    return permission === 'granted';
  }

  setupEventSource() {
    this.eventSource = new EventSource(this.notificationService.sseUrl);
    this.eventSource.onmessage = (ev: MessageEvent) => {
      const notification: Notification = JSON.parse(ev.data);
      const message = `${notification.title}\n ${notification.body}`
      if (!this.notificationsOn) {
        console.log(message);
        return;
      }
      // console.log(document.hidden);
      if (document.visibilityState === 'visible') {
        this.snackBar.open(message, 'OK', {duration: 10 * 1000})
          .onAction()
          .subscribe(() => {
            this.snackBar.dismiss();
          });
      } else {
        this.askNotificationPermission().then(granted => {
          if (!granted) {
            return;
          }
          new window.Notification(notification.title, {
            body: notification.body
          });
        });
      }
    }
  }

  withSession(user: User) {
    this.beenLogin = true;
    if (this.notificationsOn && !this.eventSource) {
      this.setupEventSource();
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.mobileQuery.removeEventListener('a', this.mobileQueryListener);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  openLoginDialog() {
    this.dialog.open(
      LoginDialogComponent, {
        width: '350px',
        data: {}
      });
  }

  logout() {
    this.sessionService.logout()
      .subscribe((result: Result) => {
        if (!result || result.code !== Result.CODE_SUCCESS) {
          this.userService.showError(result);
          return;
        }
        this.router.navigateByUrl('').then(success => {
        });
      });
  }
}
