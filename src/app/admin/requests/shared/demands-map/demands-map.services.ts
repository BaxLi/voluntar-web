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
}
