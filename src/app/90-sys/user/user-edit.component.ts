import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import {User} from '../../models/sys/user';
import {UserService} from '../../services/sys/user.service';
import {Result} from '../../models/result';
import {validateForm} from '../../10-common/utils';


@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css']
})

export class UserEditComponent implements OnInit {
  hidePassword = true;
  form = this.fb.group({
    username: new FormControl(null, [Validators.required, Validators.minLength(3)]),
    password: [null],
    role: new FormControl(null),
    email: new FormControl(null)
  });

  user: User;

  constructor(private userService: UserService,
              private fb: FormBuilder,
              public dialogRef: MatDialogRef<UserEditComponent, User>,
              @Inject(MAT_DIALOG_DATA) public data: User) {

    this.user = data;
  }

  ngOnInit() {
    const patch = {...this.user} as any;
    this.form.patchValue(patch);
  }


  save() {
    if (!this.user) {
      this.dialogRef.close();
      return;
    }
    if (!validateForm(this.form)) {
      return;
    }
    // Save
    const toSave = Object.assign({}, this.user, this.form.value);

    if (this.user.id) {
      delete toSave.createdAt;
      this.userService.update(toSave)
        .subscribe((opr: Result) => {
          if (opr.code !== Result.CODE_SUCCESS) {
            this.userService.showError(opr);
            return;
          }
          Object.assign(this.user, toSave);
          this.dialogRef.close(this.user);
        });
    } else {
      const password = toSave.password;
      if (!password) {
        this.form.get('password').setErrors({required: true});
        return;
      }
      if (password.length < 4) {
        this.form.get('password').setErrors({minlength: true});
        return;
      }
      this.userService.create2(toSave)
        .subscribe((user: User) => {
          this.dialogRef.close(user);
        });

    }

  }
}
