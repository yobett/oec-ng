import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserProfileService } from '../../services/sys/user-profile.service';
import { Result } from '../../models/result';
import { User } from '../../models/sys/user';
import { validateForm } from '../../common/utils';

@Component({
  selector: 'app-change-pwd',
  templateUrl: './change-pwd.component.html',
  styleUrls: ['./change-pwd.component.css']
})
export class ChangePwdComponent {

  form = this.fb.group({
    accountName: [null],
    oriPassword: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    newPassword: new FormControl(null, [Validators.required, Validators.minLength(4)]),
    passwordConfirm: new FormControl(null, [Validators.required, Validators.minLength(4),
      (field) => this.pwdValidator(field)
    ]),
  });

  hidePassword = true;
  user: User;

  constructor(private fb: FormBuilder,
              protected userProfileService: UserProfileService,
              public dialogRef: MatDialogRef<ChangePwdComponent>,
              private snackBar: MatSnackBar,
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
    const passwordFiled = this.form.get('newPassword');
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

    const values = {...this.form.value};

    this.userProfileService.resetPassword(values.oriPassword, values.newPassword)
      .subscribe((result: Result) => {
        if (!result || result.code !== Result.CODE_SUCCESS) {
          this.userProfileService.showError(result);
          return;
        }
        this.snackBar.open('密码修改成功');
        this.dialogRef.close();
      });
  }
}
