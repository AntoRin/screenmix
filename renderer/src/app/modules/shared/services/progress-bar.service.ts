import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ProgressBarService {
  private _progressBarToggle: Subject<boolean> = new Subject<boolean>();

  constructor() {}

  get subject(): Subject<boolean> {
    return this._progressBarToggle;
  }

  toggleOn() {
    this._progressBarToggle.next(true);
  }

  toggleOff() {
    this._progressBarToggle.next(false);
  }
}
