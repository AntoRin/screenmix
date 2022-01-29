import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
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
    private _route: ActivatedRoute,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this.getBaseDirectory();
    this._route.queryParams.subscribe((q) => {
      console.log(q);
    });
  }

  async getBaseDirectory() {
    try {
      this._progressBarService.toggleOn();
      const baseDir = await window.rendererProcessctrl.getBaseDirectory();
      if (baseDir) this._router.navigate(["dashboard"]);
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
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
