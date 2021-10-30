import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { PairService } from '../../services/mar/pair.service';
import { Result } from '../../models/result';
import { validateForm } from '../../10-common/utils';
import { ExPair } from '../../models/mar/ex-pair';
import { Ccy } from '../../models/mar/ccy';


@Component({
  selector: 'app-pair-edit',
  templateUrl: './pair-edit.component.html',
  styleUrls: ['./pair-edit.component.css']
})
export class PairEditComponent implements OnInit {
  form = this.fb.group({
    baseCcy: new FormControl(null, Validators.required),
    quoteCcy: new FormControl(null, Validators.required),
    concerned: [null],
    oeSymbol: null,
    baSymbol: null,
    hbSymbol: null,
  });

  CoinLogoPath = Ccy.LogoPath;
  pair: ExPair;
  $ccys: Observable<Ccy[]>;

  constructor(private pairService: PairService,
              private fb: FormBuilder,
              public dialogRef: MatDialogRef<PairEditComponent, ExPair>,
              @Inject(MAT_DIALOG_DATA) public data: any) {

    this.pair = data.pair;
    this.$ccys = data.$ccys;
  }

  ngOnInit() {
    const patch = {...this.pair} as any;
    this.form.patchValue(patch);
  }

  save() {
    if (!this.pair) {
      this.dialogRef.close();
      return;
    }
    if (!validateForm(this.form)) {
      return;
    }

    // Save
    const toSave: ExPair = Object.assign({}, this.pair, this.form.value);
    if (toSave.quoteCcy === toSave.baseCcy) {
      this.form.controls['quoteCcy'].setErrors({e: '不能与基础币种相同'});
      return;
    }

    if (this.pair.id) {
      delete toSave.createdAt;
      this.pairService.update(toSave)
        .subscribe((opr: Result) => {
          if (opr.code !== Result.CODE_SUCCESS) {
            this.pairService.showError(opr);
            return;
          }
          Object.assign(this.pair, toSave);
          this.dialogRef.close(this.pair);
        });
    } else {
      this.pairService.create2(toSave)
        .subscribe((pair: ExPair) => {
          this.dialogRef.close(pair);
        });
    }

  }
}
