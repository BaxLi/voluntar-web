import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { EsriMapComponent } from '@app/shared/esri-map/esri-map.component'
import { first } from 'rxjs/operators'

export interface coordinates {
  latitude: number
  longitude: number
  address: string
}

@Component({
  selector: 'app-request-address-field',
  templateUrl: './request-address-field.component.html',
  styleUrls: ['./request-address-field.component.scss']
})
export class RequestAddressFieldComponent implements OnInit {
  @Output() gotCoordinates = new EventEmitter<coordinates>()
  addressFromMap = ''
  constructor(private matDialog: MatDialog) {}

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
          this.gotCoordinates.emit(coors)
          this.addressFromMap = coors.address
        }
      })
  }
}
