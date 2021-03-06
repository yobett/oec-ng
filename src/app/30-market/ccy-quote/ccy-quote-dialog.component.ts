import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Quote } from '../../models/mar/quote';
import { Ccy } from '../../models/mar/ccy';
import { QuoteService } from '../../services/mar/quote.service';

@Component({
  selector: 'app-ccy-quote-dialog',
  templateUrl: './ccy-quote-dialog.component.html',
  styleUrls: ['./ccy-quote-dialog.component.css']
})
export class CcyQuoteDialogComponent {

  quote: Quote;

  CoinLogoPath = Ccy.LogoPath;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.quote = data.quote;
  }

  static showQuote(ccy: string, quoteService: QuoteService, dialog: MatDialog) {
    quoteService.getCcyQuote(ccy)
      .subscribe((quote: Quote) => {
          if (!quote) {
            quoteService.showErrorMessage('未能查到此币种的币价');
            return;
          }
          dialog.open(
            CcyQuoteDialogComponent, {
              // disableClose: true,
              width: '350px',
              maxWidth: '90vw',
              data: {quote}
            });
        }
      );
  }

}
