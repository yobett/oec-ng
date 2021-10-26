import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.css']
})
export class MessageDialogComponent {

  title: string;
  msg: string;
  type: 'error' | 'info' | '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.title = data.title;
    this.type = data.type;
    this.msg = data.msg;
    if (!this.msg && this.type === 'error') {
      this.msg = '出错了';
    }
  }

  static ShowMessageDialog(data, dialog: MatDialog) {
    return dialog.open(
      MessageDialogComponent, {
        disableClose: true,
        width: '380px',
        maxWidth: '90vw',
        data
      });
  }

}
