import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  // NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { from, Subscription } from 'rxjs';
import Map from '@arcgis/core/Map';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import MapView from '@arcgis/core/views/MapView';

// import Search from '@arcgis/core/widgets/Search';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Expand from '@arcgis/core/widgets/Expand';
import Bookmarks from '@arcgis/core/widgets/Bookmarks';
import config from '@arcgis/core/config.js';

import { RequestsFacade } from '../../requests.facade';
import { VolunteersFacade } from '@app/admin/volunteers/volunteers.facade';
import { IRequest } from '@app/shared/models';
import { KIV_ZONES } from '@app/shared/constants';
import { RequestsService } from '../../requests.service';

export interface coordinates {
  latitude: number;
  longitude: number;
  _id: any;
}

@Component({
  selector: 'app-requests-map',
  templateUrl: './requests-map.component.html',
  styleUrls: ['./requests-map.component.scss'],
})
export class RequestsMapComponent implements OnDestroy, OnInit {
  @Input() coordinates: [number, number] = [
    28.825140232956283,
    47.01266177894471,
  ];
  @Output() mapLoadedEvent = new EventEmitter<boolean>();
  @Output() mapClickedEvent = new EventEmitter<boolean>();
  @ViewChild('map', { static: true }) private mapViewEl: ElementRef;

  private map: Map = null;
  private mapView: MapView = null;
  private graphicsLayer: GraphicsLayer = null;
  public requests: any[] = [];
  private subRequests$: Subscription;
  private coordsWidget: HTMLElement;
  public zones = KIV_ZONES;
  form: FormGroup;
  stepOnSelectionZone = 1;
  buttonSelectorTextOnMap = 'Următor';
  volunteers: any = '-+-';
  public selectedRequests: IRequest[] = [];
  public selectedCityZone = '';
  private simpleMarkerSymbol = {
    type: 'simple-marker',
    color: [255, 255, 255, 0.3],
    // width: 2,
    style: 'circle', //'circle', 'cross', 'diamond', 'path', 'square', 'triangle', 'x'
    outline: {
      color: [226, 119, 40], // orange
      width: 2,
    },
  };
  private changedMarkerSymbol = {
    type: 'simple-marker',
    color: [60, 210, 120, 0.7], // green
    outline: {
      color: [0, 0, 0, 0.7],
      width: 1,
    },
  };

  constructor(
    public requestsFacade: RequestsFacade,
    public volunteersFacade: VolunteersFacade,
    public requestsService: RequestsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): any {
    this.stepOnSelectionZone = 1;
    this.form = new FormGroup({
      city_sector: new FormControl(''),
      needs: new FormControl(''),
    });
    // Initialize MapView
    config.assetsPath = '/assets';
    this.initializeMap().then(() => {
      // The map has been initialized
      this.mapView.container = this.mapViewEl.nativeElement;
      from(
        this.requestsService.getRequests({
          pageIndex: 1,
          pageSize: 20000,
        })
      ).subscribe(
        (res) => {
          this.requests = res.list;
          this.requests.forEach((el) => {
            this.addRequestToMap(el, this.simpleMarkerSymbol);
          });
        },
        (err) => console.log('Error getting requests from server! ', err)
      );
    });
  }

  async initializeMap() {
    try {
      this.graphicsLayer = new GraphicsLayer({ title: 'Feature test' });
      this.map = await new Map({
        basemap: 'streets-navigation-vector',
        layers: [this.graphicsLayer],
      }); //  topo-vector

      this.mapView = new MapView({
        // container: this.mapViewEl.nativeElement,
        center: this.coordinates,
        zoom: 12,
        map: this.map,
      });

      this.mapView.on('click', (ev) => {
        this.mapView.hitTest(ev.screenPoint).then((res) => {
          if (res.results[0].graphic.attributes?.requestId === undefined)
            return;

          const gr: Graphic = res.results[0].graphic;
          if (gr) {
            const exist = this.selectedRequests.find(
              (r) => r._id === gr.attributes.requestId
            );
            if (!exist) {
              this.selectedRequests.push(
                this.requests.find((r) => r._id === gr.attributes.requestId)
              );
              gr.symbol.set('color', [60, 210, 120, 0.7]);
            } else {
              this.selectedRequests = this.selectedRequests.filter(
                (r) => r !== exist
              );
              gr.symbol.set('color', [255, 255, 255, 0.3]);
            }
            this.mapView.graphics.add(gr.clone());
            this.mapView.graphics.remove(gr);
            //need to issue detectChanges by Angular for map-selectionzone
            this.selectedRequests = [...this.selectedRequests];
            this.cdr.detectChanges();
          }
        });
      });

      this.mapView.on('pointer-move', (ev) =>
        this.showCoordinates(this.mapView.toMap({ x: ev.x, y: ev.y }))
      );

      this.widgetViewCoordinatesInit();
      return this.map;
    } catch (error) {
      console.error(error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  addRequestToMap(req: coordinates, sym: any): void {
    const pointToMap = new Point({
      latitude: req.latitude || 47.01820503506154,
      longitude: req.longitude || 28.812844986831664,
    });
    this.graphicsLayer.add(
      new Graphic({
        geometry: pointToMap,
        symbol: sym,
        attributes: { requestId: req._id },
      })
    );
    this.mapView.center = pointToMap;
  }

  widgetViewCoordinatesInit(): void {
    // Widget view coordinates
    this.coordsWidget = document.createElement('Coordinates');
    this.mapViewEl.nativeElement.appendChild(this.coordsWidget);
    this.coordsWidget.id = 'coordsWidget';
    this.coordsWidget.className = 'esri-widget esri-component';
    this.coordsWidget.style.padding = '5px 2px 1px';
    this.coordsWidget.style.width = '550px';
    this.coordsWidget.style.height = '20px';
    this.mapView.ui.add(this.coordsWidget, 'bottom-right');
  }

  showCoordinates(pt): void {
    this.coordsWidget.innerHTML = `Lat/Lon ${pt.latitude} / ${pt.longitude}
      | Scale 1:${Math.round(this.mapView.scale * 1) / 1} | Zoom
      ${this.mapView.zoom}`;
  }

  citySectorChanged() {
    this.selectedCityZone = this.form.get('city_sector').value;
    this.mapView.center = new Point(
      this.zones.find(
        (zone) =>
          zone.value.toLowerCase() === this.selectedCityZone.toLowerCase()
      ).mapCoordonates
    );
    this.cdr.detectChanges();
  }

  onSubmit(ev): void {}

  nextFormStep(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.stepOnSelectionZone === 3
      ? (this.stepOnSelectionZone = 1)
      : this.stepOnSelectionZone++;
    switch (this.stepOnSelectionZone) {
      case 1:
        this.buttonSelectorTextOnMap = 'Următor';
        break;
      case 2:
        this.buttonSelectorTextOnMap = 'Alocă';
        break;
      case 3:
        this.buttonSelectorTextOnMap = 'Sarcină Nouă';
        break;
      default:
        this.buttonSelectorTextOnMap = 'ERROR !!!';
    }
  }

  ngOnDestroy() {
    console.log('🚀 RequestsMapComponent ~ ngOnDestroy ~ ngOnDestroy');
    this.subRequests$.unsubscribe();
    this.mapView.on('click', null);
    this.mapView.on('pointer-move', null);

    if (this.mapView) {
      this.mapView.destroy();
    }
    if (this.graphicsLayer) this.graphicsLayer = null;
  }
}
