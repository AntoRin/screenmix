import { Component, Input, OnInit } from "@angular/core";
import { MediaFile } from "../../../../../electron/types";

@Component({
  selector: "app-gallery",
  templateUrl: "./gallery.component.html",
  styleUrls: ["./gallery.component.css"],
})
export class GalleryComponent implements OnInit {
  @Input() mediaFiles: MediaFile[] = [];

  constructor() {}

  ngOnInit(): void {}
}
