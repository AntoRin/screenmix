import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { MediaFile } from "../../../../../electron/types";
import Cropper from "cropperjs";
import { MenuItem } from "primeng/api";
import { EditState } from "../../../../types";

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
  editState: EditState | null | undefined;

  imageOptions: MenuItem[] = [
    {
      label: "Edit",
      icon: "pi pi-pencil",
      command: this.enableImageEditing.bind(this),
    },
  ];

  saveOptions = [
    {
      label: "Save",
      icon: "pi pi-save",
      command: this.applyChanges.bind(this),
    },
    {
      separator: true,
    },
    {
      label: "Save as a new file",
      icon: "pi pi-plus",
      command: this.applyChanges.bind(this),
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
      previousImageIdx:
        this.editState?.previousImageIdx || this.spotlightImage.idx,
      previousImageSrc:
        this.editState?.previousImageSrc || this.spotlightImage.src,
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

  /**
   * If there's a backed-up src of the spotlight image, this updates the current spotlight image with that src.
   */
  resetImage() {
    if (!this.editState) return;
    this.spotlightImage = {
      idx: this.editState.previousImageIdx,
      src: this.editState.previousImageSrc,
    };
  }

  /**
   * Reset edits to original using backed-up image src, wait until UI loads the new image, and then enable editing again.
   */
  resetImageToPrevEditingState() {
    if (this.spotlightImage?.src === this.editState?.previousImageSrc) return;

    this.waitAndEnableEditingForNewImage();
    this.resetImage();
    this._destroyImageEditor();
  }

  async applyChanges() {
    try {
      if (!this.spotlightImage || !this.imageEditor) return;

      await window.rendererProcessctrl.saveEditedImage({
        dataUrl: this.imageEditor.getCroppedCanvas({}).toDataURL("image/png"),
        mode: "image",
        name: this.mediaFiles[this.spotlightImage.idx].name,
      });

      this.exitEditor();
    } catch (error) {
      console.log(error);
    }
  }

  exitEditor(preserveEdits: boolean = false) {
    if (!preserveEdits) this.resetImage();
    this.editState = null;
    this._destroyImageEditor();
  }

  private _destroyImageEditor() {
    if (!this.imageEditor) return;
    this.imageEditor.destroy();
    this.imageEditor = null;
  }

  closeImageSpotlight() {
    this.exitEditor();
    this.spotlightImage = undefined;
  }
}
