import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Quote } from '../../models/quote';
import { Ccy } from '../../models/mar/ccy';

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

}
