import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ProgressBarService } from "../../modules/shared/services/progress-bar.service";

@Component({
  selector: "app-startup",
  templateUrl: "./startup.component.html",
  styleUrls: ["./startup.component.css"],
})
export class StartupComponent implements OnInit {
  public selectedDirectory: string | undefined;

  constructor(
    private _router: Router,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this._progressBarService.toggleOn();
    window.rendererProcessctrl.getPreferencesSetStatus().then((status) => {
      this._progressBarService.toggleOff();
      if (status) this._router.navigate(["dashboard"]);
    });
  }

  async selectDirectory(): Promise<void> {
    try {
      const selectResponse: string | undefined =
        await window.rendererProcessctrl.selectBaseDirectory();

      if (selectResponse) {
        this.selectedDirectory = selectResponse;
      }
    } catch (error) {
      console.log(error);
    }
  }

  handleConfigSubmit(): void {
    if (!this.selectedDirectory) {
      return;
    }
    this._router.navigate(["dashboard"]);
  }
}
