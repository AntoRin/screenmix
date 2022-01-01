import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MediaFile } from "../../../../../electron/types";
import Cropper from "cropperjs";
import { MenuItem } from "primeng/api";
import { Subject } from "rxjs";

@Component({
  selector: "app-gallery",
  templateUrl: "./gallery.component.html",
  styleUrls: ["./gallery.component.css"],
})
export class GalleryComponent implements OnInit, OnChanges {
  @Input() mediaFiles: MediaFile[] = [];
  @Input() actions$: Subject<string> | undefined;
  @ViewChild("spotlightImageElement") spotlightImgRef: ElementRef | undefined;

  mediaFileClones: MediaFile[] = [];

  imageEditor: Cropper | null = null;

  spotlightImage: MediaFile | null = null;

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

  constructor() {}

  ngOnInit(): void {
    if (this.actions$)
      this.actions$.asObservable().subscribe((action) => {
        if (action === "delete") {
          this.deleteSelectedItems();
        }
      });
  }

  ngOnChanges() {
    this.mediaFileClones = JSON.parse(JSON.stringify(this.mediaFiles));

    this.mediaFileClones.forEach((f, i) => {
      f.path = this.bustCache(f.path);
      f.customData = {
        idx: i,
        selected: false,
      };

      if (f.name === this.spotlightImage?.name) {
        this.spotlightImage = f;
      }
    });
  }

  bustCache(url: string) {
    return `${url}?nonce=${Date.now()}`;
  }

  showImageInSpotlight(imageIdx: number) {
    this.spotlightImage =
      this.mediaFileClones[imageIdx].type === "image"
        ? this.mediaFileClones[imageIdx]
        : null;
  }

  enableImageEditing() {
    if (!this.spotlightImgRef) return;
    this.showImageInEditor(this.spotlightImgRef.nativeElement);
  }

  showImageInEditor(imageElement: HTMLImageElement) {
    if (this.imageEditor || !this.spotlightImage) return;

    this.imageEditor = new Cropper(imageElement, {
      guides: false,
      autoCropArea: 1,
      scalable: true,
      zoomable: true,
      background: false,
      cropend: () => {},
    });
  }

  nextImage() {
    if (!this.spotlightImage) return;

    const currentIdx: number = this.mediaFileClones.findIndex(
      (f) => f.path === this.spotlightImage?.path
    );

    let nextIdx: number = currentIdx;

    for (
      let idx = Math.min(currentIdx + 1, this.mediaFileClones.length - 1);
      idx < this.mediaFileClones.length;
      idx++
    ) {
      if (this.mediaFileClones[idx].type === "image") {
        nextIdx = idx;
        break;
      }
    }

    this.spotlightImage = this.mediaFileClones[nextIdx];
  }

  previousImage() {
    if (!this.spotlightImage) return;

    const currentIdx = this.mediaFileClones.findIndex(
      (f) => f.path === this.spotlightImage?.path
    );

    let prevIdx: number = currentIdx;

    for (let idx = Math.max(currentIdx - 1, 0); idx >= 0; idx--) {
      if (this.mediaFileClones[idx].type === "image") {
        prevIdx = idx;
        break;
      }
    }

    this.spotlightImage = this.mediaFileClones[prevIdx];
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
    if (!this.imageEditor) return;

    this.imageEditor.replace(
      this.imageEditor.getCroppedCanvas({}).toDataURL("image/png")
    );
  }

  /**
   * Reset edits to original using backed-up image src, wait until UI loads the new image, and then enable editing again.
   */
  resetImageToPrevEditingState() {
    if (!this.imageEditor || !this.spotlightImage) return;
    this.imageEditor.replace(this.spotlightImage.path);
  }

  async applyChanges() {
    try {
      if (!this.spotlightImage || !this.imageEditor) return;

      const editedImgUrl: string = this.imageEditor
        .getCroppedCanvas({})
        .toDataURL("image/png");

      this.exitEditor();

      const currentIdx = this.mediaFileClones.findIndex(
        (f) => f.name === this.spotlightImage?.name
      );

      await window.rendererProcessctrl.saveEditedImage({
        dataUrl: editedImgUrl,
        mode: "image",
        name: this.mediaFileClones[currentIdx].name,
      });
    } catch (error) {
      console.log(error);
    }
  }

  exitEditor() {
    this._destroyImageEditor();
  }

  private _destroyImageEditor() {
    if (!this.imageEditor) return;
    this.imageEditor.destroy();
    this.imageEditor = null;
  }

  closeImageSpotlight() {
    this.exitEditor();
    this.spotlightImage = null;
  }

  async deleteSelectedItems() {
    try {
      const selectedItems = this.mediaFileClones.filter(
        (f) => f.customData.selected === true
      );
      await window.rendererProcessctrl.deleteMediaFiles(
        selectedItems.map((f) => f.name)
      );
    } catch (error) {}
  }
}
