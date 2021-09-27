import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SyncResult } from '../../models/sync-result';

@Component({
  selector: 'app-sync-result-dialog',
  templateUrl: './sync-result-dialog.component.html',
  styleUrls: ['./sync-result-dialog.component.css']
})
export class SyncResultDialogComponent {

  title: string;
  syncResult: SyncResult;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title?: string, syncResult: SyncResult }) {
    this.title = data.title || '同步完成';
    this.syncResult = data.syncResult;
  }

  static ShowSyncResultDialog(data, dialog: MatDialog) {
    return dialog.open(
      SyncResultDialogComponent, {
        disableClose: true,
        width: '380px',
        data
      });
  }

}
