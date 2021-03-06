import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestDetailsComponent } from './request-details/request-details.component';
import { RequestsListComponent } from './requests-list/requests-list.component';
import { MaterialComponentsModule } from '@shared/material.module';
import { SharedModule } from '@shared/shared.module';
import { RequestFormComponent } from './shared/request-form/request-form.component';
import { NgxMaskModule } from 'ngx-mask';
import { RequestsMapComponent } from './shared/requests-map/requests-map.component';
import { RouterModule } from '@angular/router';
import { requestsRoutes } from './requests.routes';
import { RequestAddressFieldComponent } from './request-details/request-address-field/request-address-field.component';

@NgModule({
  declarations: [
    RequestDetailsComponent,
    RequestsListComponent,
    RequestFormComponent,
    RequestsMapComponent,
    RequestAddressFieldComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(requestsRoutes),
    MaterialComponentsModule,
    SharedModule,
    NgxMaskModule.forChild(),
  ],
  exports: [],
})
export class RequestsModule {}
