/**
 * Copied from https://github.com/angular/material.angular.io/blob/master/src/app/shared/style-manager/style-manager.ts
 */

import {Injectable} from '@angular/core';

@Injectable()
export class StyleManagerService {
  constructor() {
  }

  /**
   * Set the stylesheet with the specified key.
   */
  setStyle(key: string, href: string): void {
    getLinkElementForKey(key).setAttribute('href', href);
  }

  /**
   * Remove the stylesheet with the specified key.
   */
  removeStyle(key: string): void {
    const existingLinkElement = getExistingLinkElementByKey(key);
    if (existingLinkElement) {
      document.head.removeChild(existingLinkElement);
    }
  }
}

function getLinkElementForKey(key: string): Element {
  return getExistingLinkElementByKey(key) || createLinkElementWithKey(key);
}

function getExistingLinkElementByKey(key: string): Element {
  return document.head.querySelector(
    `link[rel="stylesheet"].${getClassNameForKey(key)}`
  );
}

function createLinkElementWithKey(key: string): Element {
  const linkEl = document.createElement('link');
  linkEl.setAttribute('rel', 'stylesheet');
  linkEl.classList.add(getClassNameForKey(key));
  document.head.appendChild(linkEl);
  return linkEl;
}

function getClassNameForKey(key: string): string {
  return `app-${key}`;
}
