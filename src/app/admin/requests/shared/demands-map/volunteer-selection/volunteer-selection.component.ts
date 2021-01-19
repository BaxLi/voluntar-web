import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IVolunteer } from '@app/shared/models/volunteers';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from 'src/environments/environment';
import { VolunteersService } from '@app/admin/volunteers/volunteers.service';
import { WeekDay } from '@app/shared/week-day';
import { Demand } from '@app/shared/models/demand';
import { from } from 'rxjs';

@Component({
  selector: 'app-volunteer-selection',
  templateUrl: './volunteer-selection.component.html',
  styleUrls: ['./volunteer-selection.component.scss'],
})
export class VolunteerSelectionOnMapComponent
  implements OnInit, OnChanges, OnDestroy {
  @ViewChild('virtualScroll') virtualScroll: CdkVirtualScrollViewport;
  dateDemandRequested: Date = null;
  @Input() selectionStep = 1;
  @Input() demands: Demand[] = [];
  public volunteers: IVolunteer[] = [];
  volunteers$: Subscription;
  days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private volunteerService: VolunteersService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  volunteerClicked(id: string) {
    try {
      const demandsList = this.demands.map((el) => el._id);
      if (demandsList.length === 0) {
        this.snackBar.open('Nu ati selectat nici un demand', '', {
          duration: 3000,
          panelClass: '', //additional CSS
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
        return;
      }

      from(this.assignDemandsToVolunteer(id, demandsList)).subscribe(
        (res) => {
          console.log('volunteerId=', id, '\n resp received', res);
          this.selectionStep = 3;
        },
        (err) => {
          console.log('error', err.error);
        }
      );
    } catch (err) {
      throw new Error(
        'Server error attaching array of demands to a volunteer.(~ MapSelectionZoneComponent ~ volunteerClicked)' +
          err
      );
    }
  }

  assignDemandsToVolunteer(volunteerId: string = '', demands: string[] = []) {
    const bodyObj = {
      volunteer: `${volunteerId}`,
      request_list: demands,
    };
    return this.http.post<any>(`${environment.url}/clusters`, bodyObj);
    // .subscribe((res) => res);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log(
    //   'changed! , step=',
    //   this.selectionStep,
    //   'dateDemandRequested=',
    //   this.dateDemandRequested
    // );
    // this.cdr.detectChanges();
  }

  public ngOnInit(): void {
    this.volunteers$ = this.volunteerService
      .getVolunteers({ pageIndex: 1, pageSize: 20000 })
      .subscribe((vol) => {
        this.volunteers = [...vol.list];
        this.cdr.detectChanges();
      });
  }

  getDayName(id: number) {
    return this.days[id];
  }
  checkIfVolunteerAvailable(day: WeekDay[]): boolean {
    //luni - 0 - duminica - 6
    let dt = '9';

    if (this.dateDemandRequested) {
      dt = this.getDayName(this.dateDemandRequested.getDay());
    } else {
      //if no date selected - we show all volunteers
      return true;
    }

    if (day !== []) {
      if (day.find((d) => d === dt)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  OnDateChange(event: MatDatepickerInputEvent<Date>) {
    // console.log(`DateChanged !: ${event.value}`);
    this.dateDemandRequested = event.value;
    // this.cdr.detectChanges();
  }
  ngOnDestroy(): void {
    this.volunteers$.unsubscribe();
  }
}
