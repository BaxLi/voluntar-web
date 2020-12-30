import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core'
import { IRequest } from '@app/shared/models'
import { from, Subscription } from 'rxjs'
import { RequestsFacade } from '../../requests.facade'
import { loadModules } from 'esri-loader'
import esri = __esri // Esri TypeScript Types
import { ZONES } from '@app/shared/constants'
import { FormControl, FormGroup } from '@angular/forms'
import { VolunteersFacade } from '@app/admin/volunteers/volunteers.facade'

// import Map from "@arcgis/core/Map"
// import MapView from "@arcgis/core/views/MapView"
// import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
// import Graphic from "@arcgis/core/Graphic"
// import Search from "@arcgis/core/widgets/Search"

export interface esriPoint {
  type: string
  longitude: number
  latitude: number
}

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

  private mapView: esri.MapView = null
  private graphicsLayer: esri.GraphicsLayer = null
  private Graphic: any = null
  public requests: IRequest[] = []
  private subRequests$: Subscription
  private coordsWidget: HTMLElement
  public zones: Array<string> = Object.keys(ZONES).filter((key) => isNaN(+key))
  form: FormGroup
  stepOnForm: number = 1
  buttonSelectorTextOnMap: string = 'Următor'
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
    this.stepOnForm = 1

    this.form = new FormGroup({
      city_sector: new FormControl(''),
      needs: new FormControl('')
    })
    from(this.initializeMap()).subscribe(
      (mapView) => {
        this.mapLoadedEvent.emit(true)
        //-- TODO -
        //volunteers section - need to reengineer
        const allVolunteersFromBD = { pageSize: 20000, pageIndex: 1 }
        this.volunteersFacade.getVolunteers(allVolunteersFromBD)

        this.volunteersFacade.volunteers$.subscribe((vol) => {
          this.volunteers = vol
          console.log('VOlunteers=', vol)
        })
      },
      (err) => console.log(err),
      () => {
        console.log('FINISH!')
      }
    )
  }

  async initializeMap() {
    try {
      const [
        Map,
        MapView,
        Graphic,
        GraphicsLayer,
        Search
      ]: any = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/layers/GraphicsLayer',
        'esri/widgets/Search'
      ])

      this.graphicsLayer = new GraphicsLayer({ title: 'Feature test' })
      const map = new Map({
        basemap: 'streets-navigation-vector',
        layers: [this.graphicsLayer]
      }) //  topo-vector

      this.Graphic = Graphic
      this.mapView = new MapView({
        container: this.mapViewEl.nativeElement,
        zoom: 12,
        center: this.coors,
        map: map
      })
      const searchWidget = new Search({ view: this.mapView })
      this.mapView.ui.add(searchWidget, { position: 'top-right' })

      this.mapView.on('click', (ev) => {
        this.mapView.hitTest(ev.screenPoint).then((res) => {
          if (res.results[0].graphic.attributes?.requestId === undefined) return

          const gr: esri.Graphic = res.results[0].graphic
          if (gr) {
            const exist = this.selectedRequests.find(
              (r) => r._id === gr.attributes.requestId
            )
            const updatePointOnMap = new this.Graphic({
              geometry: {
                type: 'point',
                // @ts-expect-error: they exist in Point class
                latitude: gr.geometry?.latitude || 47.01820503506154,
                // @ts-expect-error:
                longitude: gr.geometry?.longitude || 28.812844986831664
              },
              symbol: !exist
                ? this.changedMarkerSymbol
                : this.simpleMarkerSymbol,
              attributes: gr.attributes
            })

            this.mapView.graphics.remove(gr)
            this.mapView.graphics.add(updatePointOnMap)

            if (!exist)
              this.selectedRequests.push(
                this.requests.find(
                  (r) => r._id === updatePointOnMap.attributes.requestId
                )
              )
            else
              this.selectedRequests = this.selectedRequests.filter(
                (r) => r !== exist
              )
            this.cdr.detectChanges()
            console.log('selected arr=', this.selectedRequests)
          }
        })
      })

      this.mapView.map.layers.on('after-changes', function (event) {
        console.log(' GRAPHIC was added/removed from the map.', event)
      })

      this.widgetViewCoordinatesInit()

      this.mapView.on('pointer-move', (ev) => {
        const pt = this.mapView.toMap({ x: ev.x, y: ev.y })
        this.coordsWidget.innerHTML =
          'Lat/Lon ' +
          pt.latitude.toFixed(5) +
          ' ' +
          pt.longitude.toFixed(5) +
          ' | Scale 1:' +
          Math.round(this.mapView.scale * 1) / 1 +
          ' | Zoom ' +
          this.mapView.zoom
      })

      // this.mapView.on('mouseOver', (ev) => {})

      this.subRequests$ = this.requestsFacade.requests$.subscribe(
        (arr) => {
          this.requests = arr
          arr.forEach((el) => {
            this.addRequestToMap(el, this.mapView, this.Graphic)
          })
        },

        (err) => console.log('facade subscription error:', err),
        () => {
          console.log('faccade subscr end')
        }
      )
    } catch (error) {
      console.error(error)
    }
  }

  addRequestToMap(req: IRequest, view: esri.MapView, graphic: any): void {
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

  onSubmit(ev): void {}

  nextFormStep(): void {
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
