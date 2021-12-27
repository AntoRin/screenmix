import { Component, Input, OnInit } from "@angular/core";
import { MediaFile } from "../../../../../electron/types";
import Cropper from "cropperjs";
import { MenuItem } from "primeng/api";

@Component({
  selector: "app-gallery",
  templateUrl: "./gallery.component.html",
  styleUrls: ["./gallery.component.css"],
})
export class GalleryComponent implements OnInit {
  @Input() mediaFiles: MediaFile[] = [];

  spotlightImageSrc: string | undefined;
  spotlightImageIdx: number | undefined;
  imageEditor: Cropper | null = null;

  imageOptions: MenuItem[] = [
    {
      label: "Edit",
      icon: "pi pi-pencil",
    },
  ];

  set spotlightImage(value: { src: string; idx: number } | undefined) {
    this.spotlightImageSrc = value?.src;
    this.spotlightImageIdx = value?.idx;
  }

  get spotlightImage() {
    return !this.spotlightImageSrc || !this.spotlightImageIdx
      ? undefined
      : {
          src: this.spotlightImageSrc,
          idx: this.spotlightImageIdx,
        };
  }

  constructor() {}

  ngOnInit(): void {}

  showImageInSpotlight(imageIdx: number) {
    this.spotlightImage =
      this.mediaFiles[imageIdx].type === "image"
        ? { src: this.mediaFiles[imageIdx].path, idx: imageIdx }
        : undefined;
  }

  showImageInEditor(imageElement: HTMLImageElement) {
    if (this.imageEditor) return;

    this.imageEditor = new Cropper(imageElement, {
      zoomable: false,
      scalable: false,
      aspectRatio: 1,
      crop: () => {},
    });
  }

  nextImage() {
    if (!this.spotlightImage) return;

    let nextIdx: number = this.spotlightImage.idx;

    for (
      let idx = Math.min(
        this.spotlightImage.idx + 1,
        this.mediaFiles.length - 1
      );
      idx < this.mediaFiles.length;
      idx++
    ) {
      if (this.mediaFiles[idx].type === "image") {
        nextIdx = idx;
        break;
      }
    }

    this.spotlightImage = {
      src: this.mediaFiles[nextIdx].path,
      idx: nextIdx,
    };
  }

  previousImage() {
    if (!this.spotlightImage) return;

    let prevIdx: number = this.spotlightImage.idx;

    for (let idx = Math.max(this.spotlightImage.idx - 1, 0); idx >= 0; idx--) {
      if (this.mediaFiles[idx].type === "image") {
        prevIdx = idx;
        break;
      }
    }

    this.spotlightImage = {
      src: this.mediaFiles[prevIdx].path,
      idx: prevIdx,
    };
    console.log(this.spotlightImageIdx);
  }

  applyChanges() {}

  cancelEditing() {
    if (!this.imageEditor) return;
    this.imageEditor.destroy();
    this.imageEditor = null;
  }

  closeImageSpotlight() {
    this.cancelEditing();
    this.spotlightImage = undefined;
  }
}
