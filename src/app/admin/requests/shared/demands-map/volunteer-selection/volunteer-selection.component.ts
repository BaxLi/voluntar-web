import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { IRequest } from '@app/shared/models/requests';
import { IVolunteer } from '@app/shared/models/volunteers';
import { Demand, DemandType } from '@app/shared/models/demand';
import { from } from 'rxjs';
import { VolunteersService } from '@app/admin/volunteers/volunteers.service';
import { WeekDay } from '@app/shared/week-day';

@Component({
  selector: 'app-volunteer-selection',
  templateUrl: './volunteer-selection.component.html',
  styleUrls: ['./volunteer-selection.component.scss'],
})
export class VolunteerSelectionOnMapComponent implements OnInit, OnChanges {
  @Input() dateDemandRequested: Date = null;
  @Input() selectionStep = 1;
  public volunteers: IVolunteer[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private volunteerService: VolunteersService
  ) {}

  volunteerClicked(id: string) {
    console.log(
      '🚀 ~ file: ~ line 33 ~ MapSelectionZoneComponent ~ volunteerClicked ~ id',
      id
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log(
    //   'changed',
    //   this.selectedCityZone,
    //   'step=',
    //   this.selectionStep,
    //   'selReq=',
    //   this.selectedRequests
    // );
    // this.cdr.detectChanges();
  }

  public ngOnInit(): void {
    this.volunteerService
      .getVolunteers({ pageIndex: 1, pageSize: 20000 })
      //TODO - unsubscribe from here!!! onDestroy
      .subscribe((vol) => {
        this.volunteers = vol.list;
        console.log('volunteer-selection.ts init', this.volunteers);
        this.cdr.detectChanges();
      });
  }

  checkIfVolunteerAvailable(day: WeekDay[]) {}
}
