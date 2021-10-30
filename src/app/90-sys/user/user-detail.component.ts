import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';

import {User} from '../../models/sys/user';
import {ChangePwdComponent} from '../account/change-pwd.component';

@Component({
  selector: 'app-driver-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent {
  user: User;

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<UserDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.user = data;
  }

  static ShowDetail(cu, dialog: MatDialog) {
    dialog.open(
      UserDetailComponent, {
        disableClose: true,
        width: '380px',
        maxWidth: '90vw',
        data: cu
      });
  }

  goBack() {
    this.dialogRef.close();
  }

  userPwdChange() {
    this.dialog.open(
      ChangePwdComponent, {
        disableClose: true,
        width: '480px',
        maxWidth: '90vw',
        data: {user: this.user}
      });
  }
}

