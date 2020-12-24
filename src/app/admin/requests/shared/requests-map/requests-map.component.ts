import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { IRequest } from '@app/shared/models'
import { from, Subscription } from 'rxjs'
import { RequestsFacade } from '../../requests.facade'
import { loadModules } from 'esri-loader'
import esri = __esri // Esri TypeScript Types
import * as GraphicsLayer from 'esri/layers/GraphicsLayer'
import { distinctUntilChanged } from 'rxjs/operators'

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
  @ViewChild('map', { static: true }) private mapViewEl: ElementRef

  private loaded: boolean
  private search: esri.Search
  private mapView: esri.MapView = null
  private graphicsLayer: esri.GraphicsLayer = null
  private Graphic: any = null
  private requests: IRequest[] = []
  private subRequests$: Subscription
  private coordsWidget: HTMLElement
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
    color: [226, 119, 40], // orange
    width: 30,
    style: 'diamond',
    size: 40,
    outline: {
      color: [0, 0, 0, 0.7],
      width: 1
    }
  }

  private newColor: __esri.Color

  constructor(private requestsFacade: RequestsFacade) {}

  ngOnInit() {
    from(this.initializeMap()).subscribe(
      (mapView) => {
        // this.loaded = this.view.ready
        this.mapLoadedEvent.emit(true)
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
        Point
      ]: any = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/layers/GraphicsLayer',
        'esri/geometry/Point'
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
        map: map,
        highlightOptions: {
          color: 'green'
        }
      })

      this.mapView.on('click', (ev) => {
        this.mapView.hitTest(ev.screenPoint).then((res) => {
          console.log('this.mapView.hitTest ~ res', res.results)
          res.results.forEach((g) => {
            const gr: esri.Graphic = g.graphic

            if (gr) {
              const newGraphics = gr.clone()
              this.mapView.graphics.remove(gr)
              // @ts-expect-error: they exist in Point class
              const lat = gr.geometry?.latitude || 47.01820503506154
              // @ts-expect-error:
              const lon = gr.geometry?.longitude || 28.812844986831664

              const gt = new this.Graphic({
                geometry: {
                  type: 'point',
                  latitude: lat || 47.01820503506154,
                  longitude: lon || 28.812844986831664
                },
                symbol: this.changedMarkerSymbol
              })

              this.mapView.graphics.add(gt)
            }
          })
        })
      })

      this.mapView.map.layers.on('after-changes', function (event) {
        console.log(event, ' GRAPHIC was added/removed from the map.')
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
        attributes: { request: req.first_name }
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
