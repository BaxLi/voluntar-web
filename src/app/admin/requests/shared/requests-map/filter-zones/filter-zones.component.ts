import { Component, Input, OnInit } from '@angular/core'
import { IRequest } from '@app/shared/models'

@Component({
  selector: 'app-filter-zones',
  templateUrl: './filter-zones.component.html',
  styleUrls: ['./filter-zones.component.scss']
})
export class FilterZonesComponent implements OnInit {
  @Input('zone') selectedRequests: IRequest[] = []

  constructor() {
    console.log('!!!!! app-filter-zones  constr')
  }

  public ngOnInit(): void {
    console.log('filters map on')
    console.log(
      '🚀 ~ file: filter-zones.component.ts ~ line 11 ~ FilterZonesComponent ~ selectedRequests',
      this.selectedRequests
    )
  }
}
