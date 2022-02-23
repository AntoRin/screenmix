import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import Cropper from "cropperjs";
import { ImageResolution, ImageViewerEvent, MediaFile } from "common-types";
import { Subject } from "rxjs";

@Component({
  selector: "app-image-viewer",
  templateUrl: "./image-viewer.component.html",
  styleUrls: ["./image-viewer.component.css"],
})
export class ImageViewerComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() public editing: boolean = false;
  @Input() public spotlightImage: MediaFile | null = null;

  @Output() public viewerEvent: EventEmitter<ImageViewerEvent> =
    new EventEmitter<ImageViewerEvent>();

  @ViewChild("spotlightImageElement") public spotlightImgRef:
    | ElementRef
    | undefined;

  public imageEditor: Cropper | null = null;
  public imageResolution: ImageResolution | undefined;

  private _viewOnlyMode: boolean = true;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["editing"]?.currentValue) {
      this.resetImageToPrevEditingState();
      this._viewOnlyMode = false;
    } else {
      this.resetImageToPrevEditingState();
      this._viewOnlyMode = true;
    }

    if (changes["spotlightImage"]) {
      this.imageEditor?.replace(
        (changes["spotlightImage"].currentValue as MediaFile).path
      );
    }
  }

  ngAfterViewInit(): void {
    this.enableImageEditing();
  }

  updateImageData() {
    if (!this.spotlightImgRef) return;

    const imgEl: HTMLImageElement = this.spotlightImgRef
      .nativeElement as HTMLImageElement;

    this.imageResolution = {
      width: imgEl.naturalWidth,
      height: imgEl.naturalHeight,
    };
  }

  emitViewerEvent(event: ImageViewerEvent) {
    this.viewerEvent.emit(event);
  }

  handleSave(asCopy: boolean = false) {
    if (!this.spotlightImage || !this.imageEditor) return;

    const editedImgUrl: string = this.imageEditor
      .getCroppedCanvas({})
      .toDataURL("image/png");

    this.exitEditor();

    asCopy
      ? this.emitViewerEvent({
          eventName: "saveAsCopy",
          data: editedImgUrl,
        })
      : this.emitViewerEvent({
          eventName: "save",
          data: editedImgUrl,
        });
  }

  enableImageEditing() {
    if (!this.spotlightImgRef || this.imageEditor) return;
    this.showImageInEditor(this.spotlightImgRef.nativeElement);
  }

  showImageInEditor(imageElement: HTMLImageElement) {
    if (this.imageEditor || !this.spotlightImage) return;

    this.imageEditor = new Cropper(imageElement, {
      guides: false,
      autoCrop: false,
      autoCropArea: 1,
      scalable: true,
      zoomable: true,
      background: false,
      dragMode: "move",
      responsive: true,
      restore: true,
      viewMode: 0,
      wheelZoomRatio: 0.5,
      zoom: (event) =>
        event.detail.ratio < 0.1 ? event.preventDefault() : undefined,
      ready: () => {
        if (!this._viewOnlyMode) this.imageEditor?.crop();
      },
      cropstart: (event: Cropper.CropStartEvent) => {
        if (this._viewOnlyMode && event.detail.action !== "move") {
          event.preventDefault();
        }
      },
    });
  }

  closeImageSpotlight() {
    this.exitEditor();
    this.emitViewerEvent({
      eventName: "closeViewer",
    });
  }

  exitEditor() {
    this.emitViewerEvent({
      eventName: "closeEditor",
    });
  }

  private _destroyImageEditor() {
    if (!this.imageEditor) return;
    this.imageEditor.destroy();
    this.imageEditor = null;
  }

  rotateLeft() {
    if (!this.imageEditor) return;
    this.imageEditor.rotate(-90);
    this.resetCropBoxToFitImage();
  }

  rotateRight() {
    if (!this.imageEditor) return;
    this.imageEditor.rotate(90);
    this.resetCropBoxToFitImage();
  }

  zoomOut() {
    this.imageEditor?.zoom(-0.5);
  }

  zoomIn() {
    this.imageEditor?.zoom(0.5);
  }

  centerImage(): void {
    if (!this.imageEditor) return;

    const containerData = this.imageEditor.getContainerData();
    const canvasData = this.imageEditor.getCanvasData();

    this.imageEditor.setCanvasData({
      height: canvasData.height,
      left: containerData.width / 2 - (canvasData.width - canvasData.width / 2),
      width: canvasData.width,
      top:
        containerData.height / 2 - (canvasData.height - canvasData.height / 2),
    });
  }

  resetCropBoxToFitImage() {
    if (!this.imageEditor) return;

    const cropData = this.imageEditor.getData();
    const imageData = this.imageEditor.getImageData();
    const canvasData = this.imageEditor.getCanvasData();

    this.imageEditor.setCropBoxData({
      height:
        cropData.rotate === 90 || cropData.rotate === 270
          ? imageData.width
          : imageData.height,
      width:
        cropData.rotate === 90 || cropData.rotate === 270
          ? imageData.height
          : imageData.width,
      left: canvasData.left,
      top: canvasData.top,
    });
  }

  cropPreview() {
    if (!this.imageEditor) return;

    this.imageEditor.replace(
      this.imageEditor.getCroppedCanvas({}).toDataURL("image/png")
    );
  }

  resetImageToPrevEditingState() {
    if (!this.imageEditor || !this.spotlightImage) return;
    this.imageEditor.replace(this.spotlightImage.path);
  }

  deleteImage() {
    this.emitViewerEvent({
      eventName: "delete",
    });
  }

  ngOnDestroy(): void {
    this._destroyImageEditor();
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
