import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { MenuItem } from "primeng/api";
import { DashboardTab, TopMenuEvent } from "../../../../types";

@Component({
  selector: "app-top-menu",
  templateUrl: "./top-menu.component.html",
  styleUrls: ["./top-menu.component.css"],
})
export class TopMenuComponent implements OnInit {
  @Output() tabChangeEvent: EventEmitter<DashboardTab> =
    new EventEmitter<DashboardTab>();
  @Output() topMenuSelectionEvent: EventEmitter<TopMenuEvent> =
    new EventEmitter<TopMenuEvent>();

  public menuItems: MenuItem[] = [
    {
      label: "Home",
      icon: "pi pi-home",
      command: this.emitTabChangeEvent.bind(this, "gallery"),
    },
    {
      label: "File",
      icon: "pi pi-fw pi-file",
      items: [
        {
          label: "New",
          icon: "pi pi-fw pi-plus",
          items: [
            {
              label: "Bookmark",
              icon: "pi pi-fw pi-bookmark",
            },
            {
              label: "Video",
              icon: "pi pi-fw pi-video",
            },
          ],
        },
        {
          label: "Delete",
          icon: "pi pi-fw pi-trash",
          command: () => {
            this.topMenuSelectionEvent.emit("delete");
          },
        },
        {
          separator: true,
        },
        {
          label: "Export",
          icon: "pi pi-fw pi-external-link",
        },
      ],
    },
    {
      label: "Settings",
      icon: "pi pi-fw pi-cog",
      command: this.emitTabChangeEvent.bind(this, "settings"),
    },
    {
      label: "Users",
      icon: "pi pi-fw pi-user",
      items: [
        {
          label: "New",
          icon: "pi pi-fw pi-user-plus",
        },
        {
          label: "Delete",
          icon: "pi pi-fw pi-user-minus",
        },
        {
          label: "Search",
          icon: "pi pi-fw pi-users",
          items: [
            {
              label: "Filter",
              icon: "pi pi-fw pi-filter",
              items: [
                {
                  label: "Print",
                  icon: "pi pi-fw pi-print",
                },
              ],
            },
            {
              icon: "pi pi-fw pi-bars",
              label: "List",
            },
          ],
        },
      ],
    },
    {
      label: "Events",
      icon: "pi pi-fw pi-calendar",
      items: [
        {
          label: "Edit",
          icon: "pi pi-fw pi-pencil",
          items: [
            {
              label: "Save",
              icon: "pi pi-fw pi-calendar-plus",
            },
            {
              label: "Delete",
              icon: "pi pi-fw pi-calendar-minus",
            },
          ],
        },
        {
          label: "Archieve",
          icon: "pi pi-fw pi-calendar-times",
          items: [
            {
              label: "Remove",
              icon: "pi pi-fw pi-calendar-minus",
            },
          ],
        },
      ],
    },
    {
      label: "Quit",
      icon: "pi pi-fw pi-power-off",
    },
  ];

  constructor() {}

  ngOnInit(): void {}

  emitTabChangeEvent(tab: DashboardTab) {
    this.tabChangeEvent.emit(tab);
  }
}
