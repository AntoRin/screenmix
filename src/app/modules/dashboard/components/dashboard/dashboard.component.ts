import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  baseDirectory: string | undefined;

  constructor() {}

  ngOnInit(): void {
    window.rendererProcessctrl.getBaseDirectory().then((dir) => {
      if (dir) this.baseDirectory = dir;
    });
  }
}
