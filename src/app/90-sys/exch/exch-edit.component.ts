import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

import {ExchService} from '../../services/sys/exch.service';
import {Result} from '../../models/result';
import {validateForm} from '../../10-common/utils';
import {Exch} from '../../models/sys/exch';


@Component({
  selector: 'app-exch-edit',
  templateUrl: './exch-edit.component.html',
  styleUrls: ['./exch-edit.component.css']
})

export class ExchEditComponent implements OnInit {
  form = this.fb.group({
    code: new FormControl(null, [Validators.required]),
    name: new FormControl(null, [Validators.required])
  });

  exch: Exch;

  constructor(private exchService: ExchService,
              private fb: FormBuilder,
              public dialogRef: MatDialogRef<ExchEditComponent, Exch>,
              @Inject(MAT_DIALOG_DATA) public data: Exch) {

    this.exch = data;
  }

  ngOnInit() {
    const patch = {...this.exch} as any;
    this.form.patchValue(patch);
  }


  save() {
    if (!this.exch) {
      this.dialogRef.close();
      return;
    }
    if (!validateForm(this.form)) {
      return;
    }
    // Save
    const toSave = Object.assign({}, this.exch, this.form.value);

    if (this.exch.id) {
      delete toSave.createdAt;
      this.exchService.update(toSave)
        .subscribe((opr: Result) => {
          if (opr.code !== Result.CODE_SUCCESS) {
            this.exchService.showError(opr);
            return;
          }
          Object.assign(this.exch, toSave);
          this.dialogRef.close(this.exch);
        });
    } else {
      this.exchService.create2(toSave)
        .subscribe((exch: Exch) => {
          this.dialogRef.close(exch);
        });

    }

  }
}
