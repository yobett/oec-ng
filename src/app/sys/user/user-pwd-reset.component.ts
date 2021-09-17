import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../services/sys/user.service';
import { User } from '../../models/sys/user';
import { validateForm } from '../../common/utils';
import { Result } from '../../models/result';

@Component({
  selector: 'app-reset-pwd',
  templateUrl: './user-pwd-reset.component.html',
  styleUrls: ['./user-pwd-reset.component.css']
})
export class UserPwdResetComponent {

  form = this.fb.group({
    username: [null],
    password: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    passwordConfirm: new FormControl(null, [Validators.required, Validators.minLength(4),
      (field) => this.pwdValidator(field)]),
  });

  hidePassword = true;
  user: User;

  constructor(private fb: FormBuilder,
              protected userService: UserService,
              private snackBar: MatSnackBar,
              public dialogRef: MatDialogRef<UserPwdResetComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.user = data.user;
    this.form.patchValue(data.user);
  }

  private pwdValidator(pwdConfirmField) {
    if (!this.form) {
      return null;
    }
    if (!pwdConfirmField.value) {
      return null;
    }
    const passwordFiled = this.form.get('password');
    const newPwd = passwordFiled.value;
    if (newPwd !== pwdConfirmField.value) {
      return {pattern: true};
    }
    return null;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save() {
    if (!validateForm(this.form)) {
      return;
    }
    const username = this.user.username;
    const newPassword = this.form.value.password;
    this.userService.resetPassword(username, newPassword)
      .subscribe((result: Result) => {
        if (!result || result.code !== Result.CODE_SUCCESS) {
          this.userService.showError(result);
          return;
        }
        this.snackBar.open(`用户${username}的密码已修改`);
        this.dialogRef.close();
      });
  }
}
