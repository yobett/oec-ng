import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { ExapiService } from '../../services/sys/exapi.service';
import { Result } from '../../models/result';
import { validateForm } from '../../10-common/utils';
import { Exapi } from '../../models/sys/exapi';
import { Exch } from '../../models/sys/exch';


@Component({
  selector: 'app-exapi-edit',
  templateUrl: './exapi-edit.component.html',
  styleUrls: ['./exapi-edit.component.css']
})
export class ExapiEditComponent implements OnInit {
  form = this.fb.group({
    ex: new FormControl(null, Validators.required),
    phase: null,
    key: new FormControl(null, Validators.required),
    secret: null,
    memo: null,
    enabled: null
  });

  exapi: Exapi;
  $exchs: Observable<Exch[]>;

  constructor(private exapiService: ExapiService,
              private fb: FormBuilder,
              public dialogRef: MatDialogRef<ExapiEditComponent, Exapi>,
              @Inject(MAT_DIALOG_DATA) public data: any) {

    this.exapi = data.exapi;
    this.$exchs = data.$exchs;
  }

  ngOnInit() {
    const patch = {...this.exapi} as any;
    this.form.patchValue(patch);
  }


  save() {
    if (!this.exapi) {
      this.dialogRef.close();
      return;
    }
    if (!validateForm(this.form)) {
      return;
    }
    // Save
    const toSave = Object.assign({}, this.exapi, this.form.value);

    if (this.exapi.id) {
      delete toSave.createdAt;
      this.exapiService.update(toSave)
        .subscribe((opr: Result) => {
          if (opr.code !== Result.CODE_SUCCESS) {
            this.exapiService.showError(opr);
            return;
          }
          toSave.updatedAt = new Date().toISOString();
          Object.assign(this.exapi, toSave);
          this.dialogRef.close(this.exapi);
        });
    } else {
      this.exapiService.create2(toSave)
        .subscribe((exapi: Exapi) => {
          this.dialogRef.close(exapi);
        });
    }

  }
}
