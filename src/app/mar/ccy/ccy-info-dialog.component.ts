import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ccy } from '../../models/mar/ccy';
import { CcyService } from '../../services/mar/ccy.service';
import { QuoteService } from '../../services/mar/quote.service';
import { CcyMetaComponent } from './ccy-meta.component';
import { CcyQuoteDialogComponent } from '../ccy-quote/ccy-quote-dialog.component';
import { Result } from '../../models/result';

@Component({
  selector: 'app-ccy-info-dialog',
  templateUrl: './ccy-info-dialog.component.html',
  styleUrls: ['./ccy-info-dialog.component.css']
})
export class CcyInfoDialogComponent {

  ccy: Ccy;

  CoinLogoPath = Ccy.LogoPath;

  constructor(private ccyService: CcyService,
              private quoteService: QuoteService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.ccy = data.ccy;
  }

  showMeta(ccy: Ccy) {
    CcyMetaComponent.showMetadata(ccy.code, this.ccyService, this.dialog);
  }

  showQuote(ccy: Ccy) {
    CcyQuoteDialogComponent.showQuote(ccy.code, this.quoteService, this.dialog);
  }

  toggleConcern(ccy: Ccy) {
    const ori = ccy.concerned;
    this.ccyService.updateConcerned(ccy.id, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          ccy.concerned = !ori;
          this.snackBar.open(ori ? '已取消关注' : '已加入关注');
        }
      });
  }

  static showCcyInfo(ccy: string, ccyService: CcyService, dialog: MatDialog) {
    ccyService.getByCode(ccy)
      .subscribe((ccy: Ccy) => {
          dialog.open(
            CcyInfoDialogComponent, {
              disableClose: true,
              width: '350px',
              data: {ccy}
            });
        }
      );
  }

}
