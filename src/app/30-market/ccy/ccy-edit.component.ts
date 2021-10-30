import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CcyService } from '../../services/mar/ccy.service';
import { Result } from '../../models/result';
import { validateForm } from '../../10-common/utils';
import { Ccy } from '../../models/mar/ccy';


@Component({
  selector: 'app-ccy-edit',
  templateUrl: './ccy-edit.component.html',
  styleUrls: ['./ccy-edit.component.css']
})
export class CcyEditComponent implements OnInit {
  form = this.fb.group({
    code: new FormControl(null, Validators.required),
    name: new FormControl(null, Validators.required),
    slug: null,
    nameZh: null,
    no: null,
    concerned: [null]
  });

  ccy: Ccy;

  constructor(private ccyService: CcyService,
              private fb: FormBuilder,
              public dialogRef: MatDialogRef<CcyEditComponent, Ccy>,
              @Inject(MAT_DIALOG_DATA) public data: Ccy) {

    this.ccy = data;
  }

  ngOnInit() {
    const patch = {...this.ccy} as any;
    this.form.patchValue(patch);
  }


  save() {
    if (!this.ccy) {
      this.dialogRef.close();
      return;
    }
    if (!validateForm(this.form)) {
      return;
    }
    // Save
    const toSave = Object.assign({}, this.ccy, this.form.value);

    if (this.ccy.id) {
      delete toSave.createdAt;
      this.ccyService.update(toSave)
        .subscribe((opr: Result) => {
          if (opr.code !== Result.CODE_SUCCESS) {
            this.ccyService.showError(opr);
            return;
          }
          Object.assign(this.ccy, toSave);
          this.dialogRef.close(this.ccy);
        });
    } else {
      this.ccyService.create2(toSave)
        .subscribe((ccy: Ccy) => {
          this.dialogRef.close(ccy);
        });

    }

  }
}
