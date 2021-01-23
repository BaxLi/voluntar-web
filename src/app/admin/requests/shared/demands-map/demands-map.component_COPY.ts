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
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import config from '@arcgis/core/config.js';

import { RequestsFacade } from '../../requests.facade';
import { RequestsService } from '../../requests.service';
import { DemandsMapService } from './demands-map.services';
import { Demand, DemandType } from '@app/shared/models/demand';
import { KIV_ZONES } from '@app/shared/constants';
import { IVolunteer } from '@app/shared/models/volunteers';

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
  @ViewChild('map', { static: true }) private mapViewEl: ElementRef;
  @ViewChild('headerSelectionZone', { static: true })
  private headerSelection: ElementRef;
  private map: Map = null;
  private mapView: MapView = null;
  private graphicsLayer: GraphicsLayer = null;
  private graphicsFeatureLayer: FeatureLayer = null;
  public requests: Demand[] = [];
  private subRequests$: Subscription;
  public zones = KIV_ZONES;
  public demand: DemandType;
  demandTypesFilter = Object.entries(DemandType).map(([key, _]) => key);
  form: FormGroup;
  public stepOnSelectionZone = 1;
  buttonSelectorTextOnMap = 'Următor';
  public dateDemandRequested: Date = null;

  private featuresForLayer = null;

  public selectedDemands: Demand[] = [];
  public selectedVolunteer: IVolunteer = null;
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
    private demandsMapService: DemandsMapService,
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
    this.initializeMapFeatureLayer();
  }

  async initializeMapFeatureLayer() {
    try {
      //Geographic data stored temporarily in memory.
      //Displaying individual geographic features as graphics, visual aids or text on the map.
      this.getDemandsFromDB();
      //prepare data for Feature
      this.requests.forEach((el) => this.addDemandToMap(el));

      console.log(this.featuresForLayer);

      this.graphicsFeatureLayer = new FeatureLayer({
        // create an instance of esri/layers/support/Field for each field object
        // fields: [
        //   {
        //     name: 'ObjectID',
        //     type: 'oid',
        //   },
        //   {
        //     name: 'demandId',
        //     type: 'string',
        //   },
        // ],
        // geometryType: 'point',
        // renderer: {
        //   type: 'simple',
        //   symbol: {
        //     type: 'text', // autocasts as new WebStyleSymbol()
        //     color: '#7A003C',
        //     text: '\ue62f',
        //     font: {
        //       size: 20,
        //       family: 'CalciteWebCoreIcons',
        //     },
        //   },
        // },
        source: this.featuresForLayer, // adding an empty feature collection
        objectIdField: 'ObjectID',
      });

      this.initializeRequestsOnTheMap('init');

      this.map = await new Map({
        basemap: 'streets-navigation-vector', // possible: topo-vector
        layers: [this.graphicsFeatureLayer],
      });

      this.mapView = new MapView({
        center: this.coordinates,
        container: this.mapViewEl.nativeElement,
        zoom: 12,
        map: this.map,
      });

      this.mapView.on('click', (ev) => {
        this.mapView.hitTest(ev.screenPoint).then((res) => {
          console.log('De aisea ', res.results);
          console.log(
            'De aisea2 ',
            res.results[1].graphic.attributes.requestId
          );
          if (res.results[0].graphic.attributes?.requestId === undefined)
            return;

          const gr: Graphic = res.results[0].graphic;
          if (gr) {
            const exist = this.selectedDemands.find(
              (r) => r._id === gr.attributes.requestId
            );
            if (exist === undefined) {
              //in case of missed - add demand to the selected demands and make it green on map
              this.selectedDemands.push(
                this.requests.find((r) => r._id === gr.attributes.requestId)
              );
              this.selectedDemands = [...this.selectedDemands];
              gr.symbol.set('color', [60, 210, 120, 0.7]);
            } else {
              //in case of exist - remove demand from selected and make it white on map
              this.selectedDemands = this.selectedDemands.filter(
                (r) => r !== exist
              );
              gr.symbol.set('color', [255, 255, 255, 0.3]);
            }
            this.graphicsLayer.add(gr.clone());
            this.graphicsLayer.remove(gr);

            //next row needs to throw detectChanges by Angular
            this.cdr.detectChanges();
          }
        });
        //center map view to selected point
        this.mapView.goTo({ center: ev.mapPoint });
      });
    } catch (error) {
      console.error(error);
      this.snackMessage(`Error at map init phase, ${error}`);
    } finally {
      this.cdr.detectChanges();
    }
  }

  getDemandsFromDB() {
    from(
      this.requestsService.getDemand(
        {
          pageIndex: 1,
          pageSize: 20000,
        },
        {
          //TODO - temp for tests disabled
          status: 'confirmed',
          // ...filters,
        }
      )
    ).subscribe((res) => {
      this.requests = res.list;
    });
  }

  initializeRequestsOnTheMap(
    status: 'init' | 'filter',
    filters: any = {}
  ): void {
    if (status === 'init') {
      this.selectedDemands = [];
    }
    // else {
    //   this.graphicsLayer.removeAll();
    //   this.selectedDemands.forEach((el) =>
    //     this.addDemandToMap(el, this.changedMarkerSymbol)
    //   );
    // }

    this.requests.forEach((el) => {
      //TODO - testing purpose, set status to confirmed to have demands on the map
      // from(this.demandsMapService.tempSetStatusToConfirmed(el)).subscribe((res) =>
      //   console.log('res', res)
      // );
      this.addDemandToMap(el, this.simpleMarkerSymbol);
    });
  }

  addDemandToMap(req: Demand, sym?: any): void {
    const pointToMap = {
      geometry: {
        type: 'point',
        latitude:
          req.beneficiary.latitude || 47.01820503506154 + Math.random() * 0.01,
        longitude:
          req.beneficiary.longitude ||
          28.812844986831664 + Math.random() * 0.01,
      },
      attributes: {
        ObjectId: req._id,
        zone: req.beneficiary.zone || 'toate',
      },
    };

    this.featuresForLayer.push(pointToMap);
  }

  // TODO fix filters not working
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
  selectedVolunteerProvided(ev) {
    this.selectedVolunteer = ev;
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
          this.snackMessage('Please select some demands');
          break;
        }
        this.buttonSelectorTextOnMap = 'Alocă';
        this.headerSelection.nativeElement.innerHTML = 'Selectare Voluntari';
        break;
      case 3:
        this.alocareaVoluntarului();
        this.buttonSelectorTextOnMap = 'Sarcină Nouă';
        this.headerSelection.nativeElement.innerHTML = 'FINISH!';
        break;
      default:
        this.buttonSelectorTextOnMap = 'ERROR !!!';
    }
  }

  alocareaVoluntarului() {
    console.log('volunteerId=', this.selectedVolunteer);
    from(
      this.demandsMapService.assignDemandsToVolunteer(
        this.selectedVolunteer._id,
        this.selectedDemands
      )
    ).subscribe(
      (res) => {
        console.log(' resp received', res);
        this.stepOnSelectionZone = 3;
      },
      (err) => {
        console.log('error', err.error);
      }
    );
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
