import { Component, Inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { User } from '../../models/sys/user';
import { SessionService } from '../../services/sys/session.service';
import { Result, ValueResult } from '../../models/result';


@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css']
})
export class LoginDialogComponent {

  hidePassword = true;
  message: string;

  constructor(protected sessionService: SessionService,
              public dialogRef: MatDialogRef<LoginDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  cancel(): void {
    this.dialogRef.close();
    this.message = null;
  }

  login(name, pass) {
    this.sessionService.login(name, pass)
      .subscribe((result: ValueResult<User>) => {
        if (result && result.code === Result.CODE_SUCCESS) {
          this.message = null;
          this.dialogRef.close();
        } else {
          this.message = result.message || '用户名/密码错误';
        }
      }, (error) => {
        if (error.name === 'HttpErrorResponse') {
          const httpError = error as HttpErrorResponse;
          if (httpError.error) {
            const result: Result = httpError.error;
            if (result.message) {
              this.message = result.message;
              return;
            }
          }
        }
        this.message = '发生错误了';
      });
  }

  onPassKeyup(name, pass, $event) {
    $event.stopPropagation();
    if ($event.code === 'Enter' && name && pass) {
      this.login(name, pass);
    }
  }

}
