import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-dashboard-nav",
  templateUrl: "./dashboard-nav.component.html",
  styleUrls: ["./dashboard-nav.component.css"],
})
export class DashboardNavComponent implements OnInit {
  public menuItems: any[] = [
    {
      label: "Settings",
      icon: "pi pi-cog",
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
