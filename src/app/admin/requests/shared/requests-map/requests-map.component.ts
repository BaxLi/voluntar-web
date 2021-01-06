import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { FormGroup } from '@angular/forms'
// import { loadModules } from 'esri-loader';
import { from, Subscription } from 'rxjs'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Search from '@arcgis/core/widgets/Search'
import BasemapToggle from '@arcgis/core/widgets/BasemapToggle'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import { RequestsFacade } from '../../requests.facade'
import { VolunteersFacade } from '@app/admin/volunteers/volunteers.facade'
import { IRequest } from '@app/shared/models'
import { ZONES } from '@app/shared/constants'

@Component({
  selector: 'app-requests-map',
  templateUrl: './requests-map.component.html',
  styleUrls: ['./requests-map.component.scss']
})
export class RequestsMapComponent implements OnDestroy, OnInit {
  @Input() coors: [number, number] = [28.825140232956283, 47.01266177894471]
  @Output() mapLoadedEvent = new EventEmitter<boolean>()
  @Output() mapClickedEvent = new EventEmitter<boolean>()
  @ViewChild('map', { static: true }) private mapViewEl: ElementRef

  private search: Search
  private view: MapView = null
  private map: Map = null
  private mapView: MapView = null
  private graphicsLayer: GraphicsLayer = null
  private Graphic: any = null
  public requests: IRequest[] = []
  private subRequests$: Subscription
  private coordsWidget: HTMLElement
  public zones: Array<string> = Object.keys(ZONES).filter((key) => isNaN(+key))
  form: FormGroup
  stepOnForm = 1
  buttonSelectorTextOnMap = 'Următor'
  volunteers: any = '-+-'
  public selectedRequests: IRequest[] = []
  private simpleMarkerSymbol = {
    type: 'simple-marker',
    color: [255, 255, 255, 0.3],
    width: 2,
    style: 'circle', //'circle', 'cross', 'diamond', 'path', 'square', 'triangle', 'x'
    outline: {
      color: [226, 119, 40], // orange
      width: 2
    }
  }
  private changedMarkerSymbol = {
    type: 'simple-marker',
    color: [60, 210, 120], // green
    width: 3,
    // style: 'diamond',
    // size: 4,
    outline: {
      color: [0, 0, 0, 0.7],
      width: 1
    }
  }

  constructor(
    public requestsFacade: RequestsFacade,
    public volunteersFacade: VolunteersFacade,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialize MapView
    from(this.initializeMap()).subscribe(() => {
      // The map has been initialized
      this.mapLoadedEvent.emit(true)
    })
  }

  async initializeMap() {
    try {
      this.graphicsLayer = new GraphicsLayer({ title: 'Feature test' })
      this.map = new Map({
        basemap: 'streets-navigation-vector',
        layers: [this.graphicsLayer]
      }) //  topo-vector

      this.view = new MapView({
        container: this.mapViewEl.nativeElement,
        zoom: 12,
        map: this.map
      })

      this.search = new Search()
      this.view.ui.add([this.search], 'top-right')
      this.view.ui.add(
        new BasemapToggle({
          view: this.view,
          nextBasemap: 'hybrid'
        }),
        'bottom-left'
      )

      this.view.when(
        async () => {
          const [latitude, longitude] = this.coors
          await this.view.goTo(
            [
              latitude || 47.01266177894471,
              longitude || 28.825140232956283
            ].reverse()
          )
        },
        (err: any) => console.log('facade subscription error:', err)
      )
    } catch (error) {
      console.error(error)
    }
  }

  addRequestToMap(req: IRequest, view: MapView, graphic: any): void {
    const point = {
      type: 'point',
      latitude: req.latitude || 47.01820503506154,
      longitude: req.longitude || 28.812844986831664
    }

    view.graphics.add(
      new graphic({
        geometry: point,
        symbol: this.simpleMarkerSymbol,
        attributes: { requestId: req._id }
      })
    )
  }

  widgetViewCoordinatesInit(): void {
    // Widget view coordinates
    this.coordsWidget = document.createElement('Coordinates')
    this.mapViewEl.nativeElement.appendChild(this.coordsWidget)
    this.coordsWidget.id = 'coordsWidget'
    this.coordsWidget.className = 'esri-widget esri-component'
    this.coordsWidget.style.padding = '5px 2px 1px'
    this.coordsWidget.style.width = '350px'
    this.coordsWidget.style.height = '20px'
    this.mapView.ui.add(this.coordsWidget, 'bottom-right')
  }

  citySectorChanged() {
    console.log('sector=', this.form.get('city_sector').value)
  }
  onSubmit(ev): void {}

  nextFormStep(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.stepOnForm === 3 ? (this.stepOnForm = 1) : this.stepOnForm++
    switch (this.stepOnForm) {
      case 1:
        this.buttonSelectorTextOnMap = 'Următor'
        break
      case 2:
        this.buttonSelectorTextOnMap = 'Alocă'
        break
      case 3:
        this.buttonSelectorTextOnMap = 'Sarcină Nouă'
        break
      default:
        this.buttonSelectorTextOnMap = 'ERROR !!!'
    }
  }

  ngOnDestroy() {
    console.log('🚀 RequestsMapComponent ~ ngOnDestroy ~ ngOnDestroy')
    this.subRequests$.unsubscribe()
    this.mapView.on('click', null)
    this.mapView.on('pointer-move', null)

    if (this.mapView) {
      this.mapView.destroy()
      this.mapView = null
    }
    if (this.graphicsLayer) this.graphicsLayer = null
  }
}
