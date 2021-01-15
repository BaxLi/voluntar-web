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
import { VolunteersFacade } from '@app/admin/volunteers/volunteers.facade';
import { Demand, DemandType } from '@app/shared/models/demand';

@Component({
  selector: 'app-map-selectionzone',
  templateUrl: './map-selectionzone.component.html',
  styleUrls: ['./map-selectionzone.component.scss'],
})
export class MapSelectionZoneComponent implements OnInit, OnChanges {
  @Input() selectedRequests: Demand[] = [];
  @Input() selectedCityZone = '';
  @Input() selectionStep = 1;
  public volunteers: IVolunteer[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    public volunteersFacade: VolunteersFacade
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log(
      'changed',
      this.selectedCityZone,
      'step=',
      this.selectionStep,
      'selReq=',
      this.selectedRequests
    );
    this.cdr.detectChanges();
  }

  public ngOnInit(): void {
    console.log('selectedRequests', this.selectedRequests);
    this.volunteersFacade.getVolunteers({ pageSize: 20000, pageIndex: 1 });
    this.volunteersFacade.volunteers$.subscribe(
      (vol) => (this.volunteers = vol)
    );
  }
}
