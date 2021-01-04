import { Component, Input, OnInit } from '@angular/core'
import { IRequest } from '@app/shared/models'

@Component({
  selector: 'app-filter-zones',
  templateUrl: './filter-zones.component.html',
  styleUrls: ['./filter-zones.component.scss']
})
export class FilterZonesComponent implements OnInit {
  @Input() selectedRequests: IRequest[]

  constructor() {
    console.log('constr')
  }

  ngOnInit(): void {
    console.log('filters map on')
  }
}
