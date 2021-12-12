import { Component, OnInit } from "@angular/core";
import { DashboardTab } from "../../../../types";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  currentTab: DashboardTab = "gallery";
  baseDirectory: string | undefined;

  constructor() {}

  ngOnInit(): void {
    window.rendererProcessctrl
      .getBaseDirectory()
      .then((dir) => {
        if (dir) this.baseDirectory = dir;
      })
      .catch((e) => {});
  }

  changeTab(tab: DashboardTab) {
    this.currentTab = tab;
  }
}
