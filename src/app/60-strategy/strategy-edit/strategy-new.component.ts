import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { validateForm } from '../../10-common/utils';
import { Ccy } from '../../models/mar/ccy';
import { Strategy } from '../../models/str/strategy';
import { StrategyService } from '../../services/str/strategy.service';
import { Exch } from '../../models/sys/exch';
import { ExPair } from '../../models/mar/ex-pair';
import { PairService } from '../../services/mar/pair.service';


@Component({
  selector: 'app-strategy-new',
  templateUrl: './strategy-new.component.html',
  styleUrls: ['./strategy-new.component.css']
})
export class StrategyNewComponent implements OnInit {
  form = this.fb.group({
    ex: new FormControl(null, Validators.required),
    baseCcy: new FormControl(null, Validators.required),
    quoteCcy: new FormControl(null, Validators.required),
    // side: new FormControl(null, Validators.required),
  });

  CoinLogoPath = Ccy.LogoPath;
  getTypeLabel = Strategy.getTypeLabel;

  strategy: Strategy;
  $ccys: Observable<Ccy[]>;
  $exchs: Observable<Exch[]>;
  pair: ExPair;
  pairsMap: Map<string, ExPair> = new Map<string, ExPair>();

  loadingPair = false

  constructor(private strategyService: StrategyService,
              private pairService: PairService,
              private fb: FormBuilder,
              public dialogRef: MatDialogRef<StrategyNewComponent, Strategy>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.strategy = data.strategy;
    this.$ccys = data.$ccys;
    this.$exchs = data.$exchs;
  }

  ngOnInit() {
    const patch = {...this.strategy} as any;
    this.form.patchValue(patch);
    this.resetPair();
  }

  ccyChanged(value) {
    this.resetPair();
  }

  resetPair() {
    const {baseCcy, quoteCcy} = this.form.value;
    if (!baseCcy || !quoteCcy) {
      return;
    }
    const key = baseCcy + '-' + quoteCcy;
    this.pair = this.pairsMap.get(key);
    if (this.pair) {
      return;
    }
    this.loadingPair = true
    this.pairService.findExPair(baseCcy, quoteCcy)
      .subscribe(pair => {
          this.loadingPair = false
          this.pairsMap.set(key, pair);
          const curFormValue = this.form.value;
          if (baseCcy === curFormValue.baseCcy && quoteCcy === curFormValue.quoteCcy) {
            this.pair = pair;
          }
        },
        error => this.loadingPair = false,
        () => this.loadingPair = false);
  }

  save() {
    if (!validateForm(this.form)) {
      return;
    }
    // Save
    const toSave: Strategy = Object.assign({}, this.strategy, this.form.value);
    const ex = toSave.ex
    toSave.symbol = this.pair[ex + 'Symbol']
    if (!toSave.symbol) {
      this.strategyService.showErrorMessage('无此交易对')
    }
    this.strategyService.create2(toSave)
      .subscribe((strategy: Strategy) => {
        this.dialogRef.close(strategy);
      });

  }
}
