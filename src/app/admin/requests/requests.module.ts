import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestDetailsComponent } from './request-details/request-details.component';
import { RequestsListComponent } from './requests-list/requests-list.component';
import { MaterialComponentsModule } from '@shared/material.module';
import { SharedModule } from '@shared/shared.module';
import { RequestFormComponent } from './shared/request-form/request-form.component';
import { NgxMaskModule } from 'ngx-mask';
import { DemandsMapComponent } from './shared/demands-map/demands-map.component';
import { RouterModule } from '@angular/router';
import { requestsRoutes } from './requests.routes';
import { RequestAddressFieldComponent } from './request-details/request-address-field/request-address-field.component';
import { VolunteerSelectionOnMapComponent } from './shared/demands-map/volunteer-selection/volunteer-selection.component';
import { DemandSelectionOnMapComponent } from './shared/demands-map/demand-selection/demand-selection.component';

@NgModule({
  declarations: [
    RequestDetailsComponent,
    RequestsListComponent,
    RequestFormComponent,
    DemandsMapComponent,
    RequestAddressFieldComponent,
    DemandSelectionOnMapComponent,
    VolunteerSelectionOnMapComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(requestsRoutes),
    MaterialComponentsModule,
    SharedModule,
    NgxMaskModule.forChild(),
  ],
})
export class RequestsModule {}
