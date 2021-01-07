import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
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
import { ZONES } from '@app/shared/constants';
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
  public zones: Array<string> = Object.keys(ZONES).filter((key) => isNaN(+key));
  form: FormGroup;
  stepOnForm = 1;
  buttonSelectorTextOnMap = 'Următor';
  volunteers: any = '-+-';
  public selectedRequests: IRequest[] = [];
  private simpleMarkerSymbol = {
    type: 'simple-marker',
    color: [255, 255, 255, 0.3],
    width: 2,
    style: 'circle', //'circle', 'cross', 'diamond', 'path', 'square', 'triangle', 'x'
    outline: {
      color: [226, 119, 40], // orange
      width: 2,
    },
  };
  private changedMarkerSymbol = {
    type: 'simple-marker',
    color: [60, 210, 120], // green
    width: 3,
    // style: 'diamond',
    // size: 4,
    outline: {
      color: [0, 0, 0, 0.7],
      width: 1,
    },
  };

  constructor(
    public requestsFacade: RequestsFacade,
    public volunteersFacade: VolunteersFacade,
    public requestsService: RequestsService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): any {
    this.stepOnForm = 1;
    this.form = new FormGroup({
      city_sector: new FormControl(''),
      needs: new FormControl(''),
    });
    // Initialize MapView
    config.assetsPath = '/assets';
    this.zone.run(() => {
      this.initializeMap().then(() => {
        // The map has been initialized
        this.zone.run(() => {
          //-- TODO -
          //got requests section - need to reengineer ??? check
          //volunteers section - need to reengineer to service !
          // const allVolunteersFromBD = { pageSize: 20000, pageIndex: 1 };
          // this.volunteersFacade.getVolunteers(allVolunteersFromBD);
          // this.volunteersFacade.volunteers$.subscribe((vol) => {
          //   this.volunteers = vol;
          //   // console.log('VOlunteers=', vol);
          // });
        });
      });
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
        container: this.mapViewEl.nativeElement,
        center: this.coordinates,
        zoom: 12,
        map: this.map,
      });

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

      this.mapView.on('click', (ev) => {
        this.mapView.hitTest(ev.screenPoint).then((res) => {
          if (res.results[0].graphic.attributes?.requestId === undefined)
            return;

          const gr: Graphic = res.results[0].graphic;
          console.log(
            'uestsMapComponent ~ this.mapView.hitTest ~ gr',
            gr.symbol
          );
          //TODO - check if possible to upgrade Graphic by simply change symbol on already existent Point()
          if (gr) {
            const exist = this.selectedRequests.find(
              (r) => r._id === gr.attributes.requestId
            );
            this.addRequestToMap(
              {
                // @ts-expect-error: they exist in Point class
                latitude: gr.geometry?.latitude || 47.01820503506154,
                // @ts-expect-error: they exist in Point class
                longitude: gr.geometry?.longitude || 28.812844986831664,
                _id: gr.attributes.requestId || 'DUCK',
              },
              !exist ? this.changedMarkerSymbol : this.simpleMarkerSymbol
            );
            if (!exist) {
              this.selectedRequests.push(
                this.requests.find((r) => r._id === gr.attributes.requestId)
              );
            } else {
              this.selectedRequests = this.selectedRequests.filter(
                (r) => r !== exist
              );
            }
            this.mapView.graphics.remove(gr);
            this.cdr.detectChanges();
            console.log('selected arr=', this.selectedRequests);
          }
        });
      });

      this.mapView.on('pointer-move', (evt) =>
        this.showCoordinates(this.mapView.toMap({ x: evt.x, y: evt.y }))
      );

      this.widgetViewCoordinatesInit();
    } catch (error) {
      console.error(error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  addRequestToMap(req: coordinates, sym: any): void {
    // this.mapView.graphics.add(
    this.graphicsLayer.add(
      new Graphic({
        geometry: new Point({
          latitude: req.latitude || 47.01820503506154,
          longitude: req.longitude || 28.812844986831664,
        }),
        symbol: sym,
        attributes: { requestId: req._id },
      })
    );
    this.cdr.detectChanges();
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
    console.log('sector=', this.form.get('city_sector').value);
  }
  onSubmit(ev): void {}

  nextFormStep(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.stepOnForm === 3 ? (this.stepOnForm = 1) : this.stepOnForm++;
    switch (this.stepOnForm) {
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
