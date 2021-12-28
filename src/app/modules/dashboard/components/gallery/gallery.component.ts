import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
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
  @ViewChild("spotlightImage") spotlightImgRef: ElementRef | undefined;

  spotlightImageSrc: string | undefined;
  spotlightImageIdx: number | undefined;
  imageEditor: Cropper | null = null;
  editState:
    | {
        idx: number;
        src: string;
      }
    | undefined
    | null;

  imageOptions: MenuItem[] = [
    {
      label: "Edit",
      icon: "pi pi-pencil",
      command: this.enableImageEditing.bind(this),
    },
  ];

  set spotlightImage(value: { src: string; idx: number } | undefined) {
    this.spotlightImageSrc = value?.src;
    this.spotlightImageIdx = value?.idx;
  }

  get spotlightImage() {
    return !this.spotlightImageSrc ||
      this.spotlightImageIdx === null ||
      this.spotlightImageIdx === undefined
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

  enableImageEditing() {
    if (!this.spotlightImgRef) return;
    this.showImageInEditor(this.spotlightImgRef.nativeElement);
  }

  showImageInEditor(imageElement: HTMLImageElement) {
    if (this.imageEditor || !this.spotlightImage) return;

    this.imageEditor = new Cropper(imageElement, {
      zoomable: true,
      scalable: false,
      background: false,
      crop: () => {},
    });

    this.editState = {
      ...(this.editState || {}),
      idx: this.editState?.idx || this.spotlightImage.idx,
      src: this.editState?.src || this.spotlightImage.src,
    };
  }

  nextImage() {
    console.log(this.spotlightImage);
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
  }

  rotateLeft() {
    if (!this.imageEditor) return;
    this.imageEditor.rotate(-90);
  }

  rotateRight() {
    if (!this.imageEditor) return;
    this.imageEditor.rotate(90);
  }

  cropPreview() {
    if (!this.imageEditor || !this.spotlightImage) return;

    this.spotlightImage = {
      idx: this.spotlightImage.idx,
      src: this.imageEditor.getCroppedCanvas({}).toDataURL("image/png"),
    };
    this.waitAndEnableEditingForNewImage();
    this._destroyImageEditor();
  }

  /**
   * Wait until UI is updated with new image before enabling editing again
   */
  waitAndEnableEditingForNewImage() {
    (this.spotlightImgRef?.nativeElement as HTMLImageElement).addEventListener(
      "load",
      () => {
        this.enableImageEditing();
        (this.spotlightImgRef?.nativeElement as HTMLImageElement)
          .removeAllListeners!("load");
      }
    );
  }

  resetImage(resetState?: boolean) {
    if (!this.editState) return;
    this.spotlightImage = {
      idx: this.editState.idx,
      src: this.editState.src,
    };
    if (resetState) this.editState = null;
  }

  resetImageToPrevEditingState() {
    if (this.spotlightImage?.src === this.editState?.src) return;
    this.waitAndEnableEditingForNewImage();
    this.resetImage(false);
    this._destroyImageEditor();
  }

  applyChanges() {}

  cancelEditing() {
    this.resetImage(true);
    this._destroyImageEditor();
  }

  private _destroyImageEditor() {
    if (!this.imageEditor) return;
    this.imageEditor.destroy();
    this.imageEditor = null;
  }

  closeImageSpotlight() {
    this.cancelEditing();
    this.spotlightImage = undefined;
  }
}
