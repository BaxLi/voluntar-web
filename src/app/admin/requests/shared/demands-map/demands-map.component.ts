import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { from, Subscription } from 'rxjs';
import Map from '@arcgis/core/Map';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import MapView from '@arcgis/core/views/MapView';

// import Search from '@arcgis/core/widgets/Search';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import config from '@arcgis/core/config.js';

import { RequestsFacade } from '../../requests.facade';
import { KIV_ZONES } from '@app/shared/constants';
import { RequestsService } from '../../requests.service';
import { Demand, DemandType } from '@app/shared/models/demand';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

export interface coordinates {
  latitude: number;
  longitude: number;
  _id: any;
}

@Component({
  selector: 'app-demands-map',
  templateUrl: './demands-map.component.html',
  styleUrls: ['./demands-map.component.scss'],
})
export class DemandsMapComponent implements OnDestroy, OnInit {
  @Input() coordinates: [number, number] = [
    28.825140232956283,
    47.01266177894471,
  ];
  @Output() mapLoadedEvent = new EventEmitter<boolean>();
  @Output() mapClickedEvent = new EventEmitter<boolean>();
  @ViewChild('map', { static: true }) private mapViewEl: ElementRef;
  @ViewChild('headerSelectionZone', { static: true })
  private headerSelection: ElementRef;

  private map: Map = null;
  private mapView: MapView = null;
  private graphicsLayer: GraphicsLayer = null;
  public requests: any[] = [];
  private subRequests$: Subscription;
  private coordsWidget: HTMLElement;
  public zones = KIV_ZONES;
  public demand: DemandType;
  demands = Object.entries(DemandType).map(([key, value]) => key);
  form: FormGroup;
  stepOnSelectionZone = 1;
  buttonSelectorTextOnMap = 'Următor';
  public dateDemandRequested: Date = null;

  public selectedRequests: Demand[] = [];
  public selectedCityZone = '';
  private simpleMarkerSymbol = {
    type: 'simple-marker',
    color: [255, 255, 255, 0.3],
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
    public requestsService: RequestsService,
    private cdr: ChangeDetectorRef
  ) {}

  OnDateChange(event: MatDatepickerInputEvent<Date>) {
    console.log(`event: ${event.value}`);
  }

  ngOnInit(): any {
    this.stepOnSelectionZone = 1;
    this.form = new FormGroup({
      city_sector: new FormControl(''),
      needs: new FormControl(''),
      volunteerAvailabilityDate: new FormControl('', Validators.required),
    });
    // Initialize MapView
    config.assetsPath = '/assets';
    this.initializeMap().then(() => {
      // The map has been initialized and prefilled
      // this.mapView.goTo(
      //   new Point({
      //     latitude: 47.01820503506154 + Math.random() * 0.01,
      //     longitude: 28.812844986831664 + Math.random() * 0.01,
      //   })
      // );
      // this.mapView.center = new Point({
      //   latitude: 47.01820503506154 + Math.random() * 0.01,
      //   longitude: 28.812844986831664 + Math.random() * 0.01,
      // });
    });
  }

  async initializeMap() {
    try {
      //Geographic data stored temporarily in memory.
      //Displaying individual geographic features as graphics, visual aids or text on the map.
      this.graphicsLayer = new GraphicsLayer();

      this.map = await new Map({
        basemap: 'streets-navigation-vector',
        layers: [this.graphicsLayer],
      }); //  topo-vector

      this.mapView = new MapView({
        // container: this.mapViewEl.nativeElement,
        center: this.coordinates,
        container: this.mapViewEl.nativeElement,
        zoom: 12,
        map: this.map,
      });
      this.initializeRequestsOnTheMap('init');
      this.mapView.popup.autoOpenEnabled = false; // Disable the default popup behavior

      this.mapView.on('click', (ev) => {
        this.mapView.hitTest(ev.screenPoint).then((res) => {
          if (res.results[0].graphic.attributes?.requestId === undefined)
            return;

          this.mapView.popup.open({
            // open a popup to show some of the results
            location: ev.screenPoint,
            title: 'Hit Test Results',
            content: 'Features Found',
          });

          const gr: Graphic = res.results[0].graphic;
          if (gr) {
            const exist = this.selectedRequests.find(
              (r) => r._id === gr.attributes.requestId
            );
            if (exist === undefined) {
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
            //need to issue detectChanges by Angular
            this.selectedRequests = [...this.selectedRequests];
            this.cdr.detectChanges();
          }
        });
        this.cdr.detectChanges();
      });

      this.mapView.on('pointer-move', (ev) =>
        this.showCoordinates(this.mapView.toMap({ x: ev.x, y: ev.y }))
      );
      this.mapView.on('load', (ev) => {
        console.log('loaded');
      });

      this.widgetViewCoordinatesInit();
    } catch (error) {
      console.error(error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  initializeRequestsOnTheMap(
    status: 'init' | 'filter',
    filters: any = {}
  ): void {
    if (status === 'init') {
      this.selectedRequests = [];
    } else {
      this.mapView.graphics.removeAll();
      this.selectedRequests.forEach((el) =>
        this.addRequestToMap(el, this.changedMarkerSymbol)
      );
    }
    from(
      this.requestsService.getDemand(
        {
          pageIndex: 1,
          pageSize: 20000,
        },
        {
          status: 'confirmed',
          ...filters,
        }
      )
    ).subscribe(
      (res) => {
        console.log('DB return demands from DB = ', res.list);
        this.requests = res.list;
        this.requests.forEach((el) =>
          this.addRequestToMap(el, this.simpleMarkerSymbol)
        );
      },
      (err) => console.log('Error getting requests from server! ', err)
    );
  }
  //TODO - provide right types especially IRequest
  addRequestToMap(req: Demand, sym: any): void {
    const pointToMap = new Point({
      latitude:
        req.beneficiary.latitude || 47.01820503506154 + Math.random() * 0.01,
      longitude:
        req.beneficiary.longitude || 28.812844986831664 + Math.random() * 0.01,
    });
    this.mapView.graphics.add(
      new Graphic({
        geometry: pointToMap,
        symbol: sym,
        attributes: {
          requestId: req._id,
          zone: req.beneficiary.zone || 'centru',
        },
        popupTemplate: {
          // autocasts as new PopupTemplate()
          title: 'Places in Chisinau',
          content: [
            {
              type: 'fields',
              fieldInfos: [
                {
                  fieldName: 'name',
                  label: 'Name',
                  visible: true,
                },
                {
                  fieldName: 'address',
                  label: 'Address',
                  visible: true,
                },
              ],
            },
          ],
        },
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

  citySectorChanged(): void {
    this.selectedCityZone = `${this.form.get('city_sector').value}`;
    console.log('🚀 ~ file:  this.selectedCityZone', this.selectedCityZone);
    const selectedZone = this.zones.find(
      (zone) => zone.value.toLowerCase() === this.selectedCityZone.toLowerCase()
    );
    this.mapView.center = new Point(selectedZone.mapCoordonates);

    if ('toate'.normalize() !== this.selectedCityZone.normalize())
      this.initializeRequestsOnTheMap('filter', { zone: selectedZone.value });
    else this.initializeRequestsOnTheMap('filter');

    this.cdr.detectChanges();
  }

  necesityChanged(): void {
    this.cdr.detectChanges();
  }

  onSubmit(ev): void {
    ev.preventDefault();
  }

  nextFormStep(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    if (this.stepOnSelectionZone === 3) {
      this.stepOnSelectionZone = 1;
      this.initializeRequestsOnTheMap('init');
    } else {
      this.stepOnSelectionZone++;
    }
    switch (this.stepOnSelectionZone) {
      case 1:
        this.buttonSelectorTextOnMap = 'Următor';
        this.headerSelection.nativeElement.innerHTML = 'Selectare Beneficiari';
        break;
      case 2:
        this.buttonSelectorTextOnMap = 'Alocă';
        this.headerSelection.nativeElement.innerHTML = 'Selectare Voluntari';
        break;
      case 3:
        this.buttonSelectorTextOnMap = 'Sarcină Nouă';
        this.headerSelection.nativeElement.innerHTML = 'FINISH!';
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
