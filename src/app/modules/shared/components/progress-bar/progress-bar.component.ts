import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { ProgressBarService } from "../../services/progress-bar.service";

@Component({
  selector: "app-progress-bar",
  templateUrl: "./progress-bar.component.html",
  styleUrls: ["./progress-bar.component.css"],
})
export class ProgressBarComponent implements OnInit, OnDestroy {
  private _progressBarToggle: Subject<boolean>;
  public showProgressBar: boolean = false;

  constructor(private _progressBarService: ProgressBarService) {
    this._progressBarToggle = this._progressBarService.subject;
  }

  ngOnInit(): void {
    this._progressBarToggle.subscribe((toggle: boolean) => {
      console.log(toggle);
      if (toggle) {
        this.showProgressBar = true;
      } else {
        this.showProgressBar = false;
      }
    });
  }

  ngOnDestroy(): void {}
}
