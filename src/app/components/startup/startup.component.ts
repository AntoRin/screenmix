import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-startup",
  templateUrl: "./startup.component.html",
  styleUrls: ["./startup.component.css"],
})
export class StartupComponent implements OnInit {
  public selectedDirectory: string | undefined;
  public isLoading: boolean = false;

  constructor(private _router: Router) {}

  ngOnInit(): void {
    this.isLoading = true;
    window.rendererProcessctrl.getPreferencesSetStatus().then((status) => {
      this.isLoading = false;
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
