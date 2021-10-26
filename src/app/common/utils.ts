import { FormGroup } from '@angular/forms';


export function validateForm(form: FormGroup): boolean {
  form.updateValueAndValidity();
  if (!form.invalid) {
    return true;
  }
  const controls = form.controls;
  for (const controlName in controls) {
    if (!controls.hasOwnProperty(controlName)) {
      continue;
    }
    const control = controls[controlName];
    if (!control) {
      continue;
    }
    if (control.errors) {
      control.markAsTouched();
    }
  }
  return false;
}

export interface TsDataItem {
  ts: number;
}

export function mergeTsData(currentData: TsDataItem[], newData: TsDataItem[]): TsDataItem[] {
  if (newData.length === 0) {
    // console.log('merge... 1');
    return currentData;
  }
  if (currentData.length === 0) {
    // console.log('merge... 2');
    return newData;
  }
  const currentFirst = currentData[0];
  const currentLast = currentData[currentData.length - 1];
  const newFirst = newData[0];
  const newLast = newData[newData.length - 1];

  if (newLast.ts < currentFirst.ts) {
    // C      ------
    // N -----
    // console.log('merge... 3');
    return newData.concat(currentData);
  }
  if (currentLast.ts < newFirst.ts) {
    // C ------
    // N       -----
    // console.log('merge... 4');
    return currentData.concat(newData);
  }
  if (currentFirst.ts <= newFirst.ts && currentLast.ts >= newLast.ts) {
    // contains
    // C ------
    // N ------
    // console.log('merge... 5');
    return currentData;
  }
  if (newFirst.ts <= currentFirst.ts && newLast.ts >= currentLast.ts) {
    // contains
    // C   ---
    // N ------
    // console.log('merge... 6');
    return newData;
  }
  // overlap
  if (newFirst.ts <= currentFirst.ts) {
    // C     ------
    // N ------
    // console.log('merge... 7');
    const newLastTs = newLast.ts;
    const currentWithoutOverlap = currentData.filter(k => k.ts > newLastTs);
    return newData.concat(currentWithoutOverlap);
  } else {
    // C ------
    // N     ------
    // console.log('merge... 8');
    const newFirstTs = newFirst.ts;
    const currentWithoutOverlap = currentData.filter(k => k.ts < newFirstTs);
    return currentWithoutOverlap.concat(newData);
  }

}

export function moneySumValue(mon): number {
  if (mon === 0) {
    return 0;
  }
  if (!mon) {
    return mon;
  }
  const money = +mon;
  if (money > 1000) {
    return Math.round(money);
  }
  if (money > 100) {
    return +money.toFixed(1);
  }
  return +money.toFixed(2);
}

export function upDownPercent(from: number, to: number, posSign = false, abs = false): string {
  if (!from || !to) {
    return '';
  }
  let percent = (to - from) * 100 / from;
  if (abs) {
    percent = Math.abs(percent);
  }
  const ns = percent.toFixed(2);
  if (percent > 0 && posSign) {
    return '+' + ns + '%';
  }
  return ns + '%';
}
