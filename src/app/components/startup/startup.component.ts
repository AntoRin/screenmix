import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ProgressBarService } from "../../modules/shared/services/progress-bar.service";

@Component({
  selector: "app-startup",
  templateUrl: "./startup.component.html",
  styleUrls: ["./startup.component.css"],
})
export class StartupComponent implements OnInit {
  public screenmixDirectories: string[] = [];

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this._route.queryParams.subscribe((q) => {
      const redirect =
        q?.["redirect"] === true || q?.["redirect"] === undefined;
      this.getBaseDirectory(redirect);
      if (!redirect) this.getScreenmixDirectories();
    });
  }

  async getBaseDirectory(redirect: boolean = true) {
    try {
      this._progressBarService.toggleOn();
      const baseDir = await window.rendererProcessctrl.getBaseDirectory();
      if (baseDir && redirect) this._router.navigate(["dashboard"]);
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }

  async getScreenmixDirectories() {
    try {
      this._progressBarService.toggleOn();
      this.screenmixDirectories =
        await window.rendererProcessctrl.getScreenmixDirectories();
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }

  async selectDirectory(): Promise<void> {
    try {
      await window.rendererProcessctrl.selectBaseDirectory();
      this.getScreenmixDirectories();
    } catch (error) {
      console.log(error);
    }
  }

  async navigateToWorkspace(idx: number) {
    try {
      await window.rendererProcessctrl.setBaseDirectory(
        this.screenmixDirectories[idx]
      );
      this._router.navigate(["dashboard"]);
    } catch (error) {}
  }
}
