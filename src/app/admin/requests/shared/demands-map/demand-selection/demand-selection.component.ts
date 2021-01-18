import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Demand, DemandType } from '@app/shared/models/demand';
import { from } from 'rxjs';

@Component({
  selector: 'app-demand-selection',
  templateUrl: './demand-selection.component.html',
  styleUrls: ['./demand-selection.component.scss'],
})
export class DemandSelectionOnMapComponent implements OnInit, OnChanges {
  @Input() selectedRequests: Demand[] = [];
  @Input() selectedCityZone = '';
  @Input() selectionStep = 1;
  constructor(private cdr: ChangeDetectorRef) {}

  volunteerClicked(id: string) {
    console.log(
      '🚀 ~ file: demand.component.ts ~ line 33 ~ MapSelectionZoneComponent ~ volunteerClicked ~ id',
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
    console.log('demand-selection.ts', this.selectedRequests);
  }
}
