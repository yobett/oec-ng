import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ccy } from '../../models/mar/ccy';
import { CcyService } from '../../services/mar/ccy.service';
import { QuoteService } from '../../services/mar/quote.service';
import { CcyMetaComponent } from './ccy-meta.component';
import { CcyQuoteDialogComponent } from '../ccy-quote/ccy-quote-dialog.component';
import { Result } from '../../models/result';
import { CcyPairsDialogComponent } from '../pair/ccy-pairs-dialog.component';
import { PairService } from '../../services/mar/pair.service';

@Component({
  selector: 'app-ccy-info-dialog',
  templateUrl: './ccy-info-dialog.component.html',
  styleUrls: ['./ccy-info-dialog.component.css']
})
export class CcyInfoDialogComponent {

  ccy: Ccy;
  concernChanged: (concerned: boolean) => void;

  CoinLogoPath = Ccy.LogoPath;

  constructor(private ccyService: CcyService,
              private quoteService: QuoteService,
              private pairService: PairService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.ccy = data.ccy;
    this.concernChanged = data.concernChanged;
  }

  showMeta(ccy: Ccy) {
    CcyMetaComponent.showMetadata(ccy.code, this.ccyService, this.dialog);
  }

  showQuote(ccy: Ccy) {
    CcyQuoteDialogComponent.showQuote(ccy.code, this.quoteService, this.dialog);
  }

  showPairsAsBase(ccy: Ccy) {
    const baseCcy = ccy.code;
    this.pairService.page2(null, {baseCcy, pageSize: 30})
      .subscribe(countList => {
        const pairs = countList.list;
        CcyPairsDialogComponent.showPairs(this.dialog, {baseCcy, pairs});
      });
  }

  toggleConcern(ccy: Ccy) {
    const ori = ccy.concerned;
    this.ccyService.updateConcerned(ccy.id, !ori)
      .subscribe((opr: Result) => {
        if (opr.code === Result.CODE_SUCCESS) {
          ccy.concerned = !ori;
          this.snackBar.open(ori ? '已取消关注' : '已加入关注');
          if (this.concernChanged) {
            this.concernChanged(ccy.concerned);
          }
        }
      });
  }

  static showCcyInfo(ccy: string,
                     ccyService: CcyService,
                     dialog: MatDialog,
                     concernChanged?: (concerned: boolean) => void) {
    ccyService.getByCode(ccy)
      .subscribe((ccy: Ccy) => {
          dialog.open(
            CcyInfoDialogComponent, {
              disableClose: true,
              width: '350px',
              maxWidth: '90vw',
              data: {ccy, concernChanged}
            });
        }
      );
  }

}