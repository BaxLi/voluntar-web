//Additional services for testing map component purpose
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from 'src/environments/environment';
import { Demand } from '@app/shared/models/demand';

@Injectable({
  providedIn: 'root',
})
export class DemandsMapService {
  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  tempSetStatusToConfirmed(el: Demand) {
    return this.http.put<any>(`${environment.url}/requests`, {
      _id: el._id,
      status: 'confirmed',
    });
  }

  assignDemandsToVolunteer(volunteerId: string = '', demands: Demand[] = []) {
    const bodyObj = {
      volunteer: `${volunteerId}`,
      request_list: demands.map((demand) => demand._id),
    };
    return this.http.post<any>(`${environment.url}/clusters`, bodyObj);
  }
}
