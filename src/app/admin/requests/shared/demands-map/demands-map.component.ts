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
import { FormControl, FormGroup } from '@angular/forms';
import { from, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import Map from '@arcgis/core/Map';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import MapView from '@arcgis/core/views/MapView';

import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import config from '@arcgis/core/config.js';

import { RequestsFacade } from '../../requests.facade';
import { KIV_ZONES } from '@app/shared/constants';
import { RequestsService } from '../../requests.service';
import { Demand, DemandType } from '@app/shared/models/demand';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { IVolunteer } from '@app/shared/models';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { DemandsMapService } from './demands-map.services';
import { widgetViewCoordinatesInit, showCoordinates } from './map_additional';

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
  public requests: Demand[] = [];
  private subRequests$: Subscription;
  public zones = KIV_ZONES;
  public demand: DemandType;
  demandTypesFilter = Object.entries(DemandType).map(([key, value]) => key);
  form: FormGroup;
  public stepOnSelectionZone = 1;
  buttonSelectorTextOnMap = 'Următor';
  public dateDemandRequested: Date = null;

  public selectedDemands: Demand[] = [];
  public selectedCityZone = '';
  public selectedDemandTypeFilter = '';
  public anyDemand = 'any';
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
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): any {
    this.stepOnSelectionZone = 1;

    this.form = new FormGroup({
      city_sector: new FormControl(''),
      needs: new FormControl(''),
    });

    // Initialize MapView
    config.assetsPath = '/assets';
    this.initializeMap();
    // .then(() => {
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
    // });
  }

  async initializeMap() {
    try {
      //Geographic data stored temporarily in memory.
      //Displaying individual geographic features as graphics, visual aids or text on the map.
      this.graphicsLayer = new GraphicsLayer();

      this.map = await new Map({
        basemap: 'streets-navigation-vector', // possible: topo-vector
        layers: [this.graphicsLayer],
      });

      this.mapView = new MapView({
        center: this.coordinates,
        container: this.mapViewEl.nativeElement,
        zoom: 12,
        map: this.map,
      });

      this.initializeRequestsOnTheMap('init');

      this.mapView.on('click', (ev) => {
        this.mapView.hitTest(ev.screenPoint).then((res) => {
          if (res.results[0].graphic.attributes?.requestId === undefined)
            return;

          const gr: Graphic = res.results[0].graphic;
          if (gr) {
            const exist = this.selectedDemands.find(
              (r) => r._id === gr.attributes.requestId
            );
            if (exist === undefined) {
              this.selectedDemands.push(
                this.requests.find((r) => r._id === gr.attributes.requestId)
              );
              gr.symbol.set('color', [60, 210, 120, 0.7]);
            } else {
              this.selectedDemands = this.selectedDemands.filter(
                (r) => r !== exist
              );
              gr.symbol.set('color', [255, 255, 255, 0.3]);
            }
            this.mapView.graphics.add(gr.clone());
            this.mapView.graphics.remove(gr);
            //2 nex rows need to throw detectChanges by Angular
            this.selectedDemands = [...this.selectedDemands];
            this.cdr.detectChanges();
          }
        });
      });
    } catch (error) {
      console.error(error);
      this.snackMessage(`Error at map init phase, ${error}`);
    } finally {
      this.cdr.detectChanges();
    }
  }

  initializeRequestsOnTheMap(
    status: 'init' | 'filter',
    filters: any = {}
  ): void {
    if (status === 'init') {
      this.selectedDemands = [];
    } else {
      this.mapView.graphics.removeAll();
      this.selectedDemands.forEach((el) =>
        this.addDemandToMap(el, this.changedMarkerSymbol)
      );
    }
    from(
      this.requestsService.getDemand(
        {
          pageIndex: 1,
          pageSize: 20000,
        },
        {
          //TODO - temp for tests disabled
          status: 'confirmed',
          ...filters,
        }
      )
    ).subscribe(
      (res) => {
        console.log('DB return demands from DB = ', res.list);
        this.requests = res.list;
        this.requests.forEach((el) => {
          //TODO - for test purposes - delete after
          // from(this.demandsMapService.tempSetStatusToConfirmed(el)).subscribe((res) =>
          //   console.log('res', res)
          // );
          this.addDemandToMap(el, this.simpleMarkerSymbol);
        });
      },
      (err) => console.log('Error getting requests from server! ', err)
    );
  }
  //TODO - provide right types especially IRequest
  addDemandToMap(req: Demand, sym: any): void {
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
          zone: req.beneficiary.zone || 'toate',
        },
      })
    );
    this.mapView.center = pointToMap;
  }

  //for both filters on demand step (1)
  filterChanged(): void {
    let selectedZone;
    let currentFilter = {};

    this.selectedCityZone = `${this.form.get('city_sector').value}`;
    this.selectedDemandTypeFilter = `${this.form.get('needs').value}`;

    if (
      this.selectedCityZone &&
      'toate'.normalize() !== this.selectedCityZone.normalize()
    ) {
      selectedZone = this.zones.find(
        (zone) =>
          zone.value.toLowerCase() === this.selectedCityZone.toLowerCase()
      );
      this.mapView.center = new Point(selectedZone.mapCoordonates);
      currentFilter = { ...currentFilter, zone: selectedZone.value };
    }
    if (
      this.selectedDemandTypeFilter &&
      this.selectedDemandTypeFilter.normalize() !== this.anyDemand.normalize()
    ) {
      currentFilter = {
        ...currentFilter,
        type: this.selectedDemandTypeFilter,
      };
    }
    this.initializeRequestsOnTheMap('filter', currentFilter);
  }

  onSubmit(ev): void {
    ev.preventDefault();
    //for future possible actions
  }

  nextFormStep(): void {
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
        if (this.selectedDemands.length === 0) {
          this.stepOnSelectionZone--;
          this.snackMessage('va rugam sa selectati ceva la acest pas');
          break;
        }
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

  snackMessage(msg: string) {
    this.snackBar.open(msg, '', {
      duration: 3000,
      panelClass: '', //additional CSS
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
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
