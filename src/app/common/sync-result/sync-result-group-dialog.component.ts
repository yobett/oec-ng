import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SyncResult, SyncResultGroup } from '../../models/sync-result';

@Component({
  selector: 'app-sync-result-group-dialog',
  templateUrl: './sync-result-group-dialog.component.html',
  styleUrls: ['./sync-result-group-dialog.component.css']
})
export class SyncResultGroupDialogComponent {

  title: string;
  syncResults: SyncResultGroup;

  syncResultArray: { name: string, result: SyncResult }[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title?: string, syncResults: SyncResultGroup }) {
    this.title = data.title || 'Sync Success';
    this.syncResults = data.syncResults;

    this.syncResultArray = [];
    for (const ex in this.syncResults) {
      if (Object.prototype.hasOwnProperty.call(this.syncResults, ex)) {
        const name = ex.toUpperCase();
        const result = this.syncResults[ex];
        this.syncResultArray.push({name, result});
      }
    }
  }

  static ShowSyncResultGroupDialog(data, dialog: MatDialog) {
    return dialog.open(
      SyncResultGroupDialogComponent, {
        disableClose: true,
        width: '380px',
        data
      });
  }

}
