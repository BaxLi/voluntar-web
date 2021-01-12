import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { IRequest } from '@app/shared/models';

@Component({
  selector: 'app-beneficiary-selection',
  templateUrl: './beneficiary-selection.component.html',
  styleUrls: ['./beneficiary-selection.component.scss'],
})
export class BeneficiarySelectionComponent implements OnInit, OnChanges {
  @Input() selectedRequests: IRequest[];
  @Input() selectedCityZone = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('changed', this.selectedCityZone);
  }

  public ngOnInit(): void {
    console.log('selectedRequests', this.selectedRequests);
  }
}
