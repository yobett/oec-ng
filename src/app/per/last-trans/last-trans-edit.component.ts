import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import {Result} from '../../models/result';
import {validateForm} from '../../common/utils';
import { LastTransService } from '../../services/per/last-trans.service';
import { LastTransaction } from '../../models/per/last-transaction';


@Component({
  selector: 'app-last-trans-edit',
  templateUrl: './last-trans-edit.component.html',
  styleUrls: ['./last-trans-edit.component.css']
})

export class LastTransEditComponent implements OnInit {
  form = this.fb.group({
    baseCcy: new FormControl(null, Validators.required),
    quoteCcy: new FormControl(null, Validators.required),
    side: new FormControl(null, [Validators.required]),
    avgPrice: new FormControl(null, [Validators.required]),
    execQty: new FormControl(null, [Validators.required]),
    ex: null,
  });

  lastTrans: LastTransaction;

  constructor(private lastTransService: LastTransService,
              private fb: FormBuilder,
              public dialogRef: MatDialogRef<LastTransEditComponent, LastTransaction>,
              @Inject(MAT_DIALOG_DATA) public data: LastTransaction) {

    this.lastTrans = data;
  }

  ngOnInit() {
    const patch = {...this.lastTrans} as any;
    this.form.patchValue(patch);
  }


  save() {
    if (!this.lastTrans) {
      this.dialogRef.close();
      return;
    }
    if (!validateForm(this.form)) {
      return;
    }
    // Save
    const toSave = Object.assign({}, this.lastTrans, this.form.value);

    if (this.lastTrans.id) {
      delete toSave.createdAt;
      this.lastTransService.update(toSave)
        .subscribe((opr: Result) => {
          if (opr.code !== Result.CODE_SUCCESS) {
            this.lastTransService.showError(opr);
            return;
          }
          Object.assign(this.lastTrans, toSave);
          this.dialogRef.close(this.lastTrans);
        });
    } else {
      this.lastTransService.create2(toSave)
        .subscribe((lastTrans: LastTransaction) => {
          this.dialogRef.close(lastTrans);
        });

    }

  }
}
