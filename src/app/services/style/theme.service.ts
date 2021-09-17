import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

import { StyleManagerService } from './style-manager.service';

export interface Theme {
  backgroundColor: string;
  buttonColor: string;
  headingColor: string;
  label: string;
  value: string;
  darkTheme: boolean;
}

@Injectable()
export class ThemeService {

  currentTheme: Theme;
  themeSubject: Subject<Theme> = new Subject();

  options: Theme[] = [
    {
      backgroundColor: '#fff',
      buttonColor: '#ff4081',
      headingColor: '#3f51b5',
      label: '靛蓝 & 红',
      value: 'indigo-pink',
      darkTheme: false
    },
    {
      backgroundColor: '#fff',
      buttonColor: '#ffc107',
      headingColor: '#673ab7',
      label: '深紫 & 琥珀',
      value: 'deeppurple-amber',
      darkTheme: false
    },
    {
      backgroundColor: '#303030',
      buttonColor: '#607d8b',
      headingColor: '#e91e63',
      label: '红 & 蓝灰',
      value: 'pink-bluegrey',
      darkTheme: true
    },
    {
      backgroundColor: '#303030',
      buttonColor: '#4caf50',
      headingColor: '#9c27b0',
      label: '紫 & 绿',
      value: 'purple-green',
      darkTheme: true
    }
  ];

  defaultTheme: Theme = this.options[0];

  constructor(
    private http: HttpClient,
    private styleManager: StyleManagerService
  ) {
  }

  getTheme(key: string): Theme {
    return this.options.find(t => t.value === key);
  }

  setDefaultTheme(): void {
    const themeKey = localStorage.getItem('theme');
    if (themeKey) {
      const theme = this.getTheme(themeKey);
      if (theme) {
        this.setTheme(theme);
        return;
      }
    }
    this.setTheme(this.defaultTheme);
  }

  setTheme(theme: Theme): void {
    this.styleManager.setStyle(
      'theme',
      `assets/${theme.value}.css`
    );
    localStorage.setItem('theme', theme.value);
    this.currentTheme = theme;
    this.themeSubject.next(theme);
  }
}
