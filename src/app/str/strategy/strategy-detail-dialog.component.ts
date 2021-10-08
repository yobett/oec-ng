import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { Ccy } from '../../models/mar/ccy';
import { Strategy } from '../../models/str/strategy';

@Component({
  selector: 'app-strategy-detail-dialog',
  templateUrl: './strategy-detail-dialog.component.html',
  styleUrls: ['./strategy-detail-dialog.component.css']
})
export class StrategyDetailDialogComponent {
  strategy: Strategy;

  CoinLogoPath = Ccy.LogoPath;
  getTypeLabel = Strategy.getTypeLabel;


  constructor(@Inject(MAT_DIALOG_DATA) public data: Strategy) {
    this.strategy = data;
  }

  static showStrategyDetail(dialog: MatDialog, data: Strategy) {
    return dialog.open(
      StrategyDetailDialogComponent, {
        disableClose: true,
        width: '380px',
        data
      });
  }

}
