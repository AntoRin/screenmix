import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { DirectorySelectResponse } from "../../../electron/types";

@Component({
  selector: "app-startup",
  templateUrl: "./startup.component.html",
  styleUrls: ["./startup.component.css"],
})
export class StartupComponent implements OnInit {
  public selectedDirectory: string | undefined;

  constructor(private _router: Router) {}

  ngOnInit(): void {}

  async selectDirectory(): Promise<void> {
    try {
      const selectResponse: DirectorySelectResponse =
        await window.rendererProcessctrl.selectDirectory();

      if (!selectResponse.canceled) {
        this.selectedDirectory = selectResponse.filePaths[0];
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
