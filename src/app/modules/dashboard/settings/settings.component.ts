import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
})
export class SettingsComponent implements OnInit {
  @Input() baseDirectory: string | undefined;
  @Output() directoryChangeEvent: EventEmitter<string> =
    new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  updateBaseDirectory() {
    window.rendererProcessctrl
      .selectBaseDirectory()
      .then((value) => {
        if (value) this.directoryChangeEvent.emit(value);
      })
      .catch((e) => {});
  }
}
