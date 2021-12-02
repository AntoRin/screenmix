import { Component, Input, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-gallery",
  templateUrl: "./gallery.component.html",
  styleUrls: ["./gallery.component.css"],
})
export class GalleryComponent implements OnInit {
  @Input() baseDirectory: string | undefined;
  imagePaths: string[] = [];

  constructor(private _sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    window.rendererProcessctrl
      .listScreenshotPaths(this.baseDirectory)
      .then((paths: string[]) => {
        this.imagePaths = paths.map(
          (x) => this._sanitizer.bypassSecurityTrustResourceUrl(x) as string
        );
      })
      .catch((e) => {});
  }
}
