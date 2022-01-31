import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ProgressBarService } from "../../modules/shared/services/progress-bar.service";

@Component({
  selector: "app-startup",
  templateUrl: "./startup.component.html",
  styleUrls: ["./startup.component.css"],
})
export class StartupComponent implements OnInit {
  public mediaDirectories: string[] = [];
  public baseDirectory: string | undefined;

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
      if (!redirect) this.getMediaDirectories();
    });
  }

  async getBaseDirectory(redirect: boolean = true) {
    try {
      this._progressBarService.toggleOn();
      this.baseDirectory = await window.rendererProcessctrl.getBaseDirectory();
      if (this.baseDirectory && redirect) this._router.navigate(["dashboard"]);
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }

  async getMediaDirectories() {
    try {
      this._progressBarService.toggleOn();
      this.mediaDirectories =
        await window.rendererProcessctrl.getMediaDirectories();
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }

  async selectDirectory(): Promise<void> {
    try {
      await window.rendererProcessctrl.addMediaDirectory();
      this.getMediaDirectories();
    } catch (error) {
      console.log(error);
    }
  }

  async navigateToWorkspace(idx: number) {
    try {
      await window.rendererProcessctrl.setBaseDirectory(
        this.mediaDirectories[idx]
      );
      this._router.navigate(["dashboard"]);
    } catch (error) {}
  }

  async removeMediaDir(dir: string) {
    try {
      await window.rendererProcessctrl.removeMediaDirectory(dir);
      this.getMediaDirectories();
    } catch (error) {}
  }

  baseName(path: string) {
    const splits = (path || "").split("\\");
    return splits[splits.length - 1];
  }
}
