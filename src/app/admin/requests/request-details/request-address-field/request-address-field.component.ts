import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  Injectable
} from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { HttpClient } from '@angular/common/http'
import { EsriMapComponent } from '@app/shared/esri-map/esri-map.component'
import { Observable, throwError } from 'rxjs'
import { catchError, retry, first } from 'rxjs/operators'

export interface coordinates {
  latitude: number
  longitude: number
  address: string
  valid: boolean
}

@Component({
  selector: 'app-request-address-field',
  templateUrl: './request-address-field.component.html',
  styleUrls: ['./request-address-field.component.scss']
})
export class RequestAddressFieldComponent implements OnInit {
  @Output() gotCoordinates = new EventEmitter<coordinates>()
  selectedAddress = ''
  constructor(private matDialog: MatDialog, private http: HttpClient) {}

  ngOnInit(): void {}

  showMapDialog() {
    this.matDialog
      .open<
        EsriMapComponent,
        { coors: number[]; address: string },
        coordinates
      >(EsriMapComponent, {
        data: {
          coors: [47.02486150651041, 28.832740004203416],
          address: 'Arcul de Triumf'
        },
        panelClass: 'esri-map',
        width: '80%',
        height: '80%',
        maxWidth: '100%',
        maxHeight: '100%'
      })
      .afterClosed()
      .pipe(first())
      .subscribe((coors) => {
        if (coors) {
          if (coors.address.length > 1 || coors.address.length == 0)
            coors.valid = true
          else coors.valid = false
          console.log(coors.valid)
          this.gotCoordinates.emit(coors)
          this.selectedAddress = coors.address
        }
      })
  }

  selectAddress(ev) {
    this.selectedAddress = ev.target.value
    let coors = {
      latitude: null,
      longitude: null,
      address: this.selectedAddress,
      valid: false
    }
    if (
      this.checkAddressExists(this.selectedAddress) ||
      this.selectedAddress.length == 0
    )
      coors.valid = true
    this.gotCoordinates.emit(coors)
  }

  checkAddressExists(address) {
    let url =
      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=' +
      address +
      '&category=&outFields=*&forStorage=false&f=pjson'
    let foundAdress
    this.http.get(url).subscribe((yourdata) => {
      console.log('you have your data: ' + JSON.stringify(yourdata))
      // foundAdress = yourdata.toObject.candidates[0].address
    })
    return true
  }
}
