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
  @ViewChild("containerElement") public containerRef: ElementRef | undefined;

  public imageEditor: Cropper | null = null;
  public imageResolution: ImageResolution | undefined;

  private _viewOnlyMode: boolean = true;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["editing"]?.currentValue) {
      this.imageEditor?.crop();
      this.resetCropBoxToFitImage();
      this._viewOnlyMode = false;
    } else {
      this.imageEditor?.clear();
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
    this.watchContainerSize();
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

  watchContainerSize(): void {
    if (!this.containerRef) return;

    const container: HTMLDivElement = this.containerRef
      .nativeElement as HTMLDivElement;

    const resizeImage = (): void => {};

    const observer = new MutationObserver(resizeImage);

    observer.observe(container, {
      attributes: true,
    });

    this._unsubscribe$.asObservable().subscribe(() => {
      observer.disconnect();
    });
  }

  emitViewerEvent(event: ImageViewerEvent) {
    this.viewerEvent.emit(event);
  }

  handleSave() {
    if (!this.spotlightImage || !this.imageEditor) return;

    const editedImgUrl: string = this.imageEditor
      .getCroppedCanvas({})
      .toDataURL("image/png");

    this.exitEditor();

    this.emitViewerEvent({
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
      crop: (event: Cropper.CropEvent) => {},
      cropstart: (event: Cropper.CropStartEvent) => {
        if (this._viewOnlyMode) {
          event.preventDefault();
        }
      },
      responsive: true,
      restore: true,
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

  ngOnDestroy(): void {
    this._destroyImageEditor();
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
