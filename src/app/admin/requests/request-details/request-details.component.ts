import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { SPECIAL_CONDITIONS, ZONES } from '@app/shared/constants'
import { RequestsFacade } from '../requests.facade'
import { coordinates } from './request-address-field/request-address-field.component'

export enum ILNESS_OPTIONS {
  'None' = 'Nu are',
  'Has symptoms' = 'Are simptome'
}

export const BENEFICIARY_NEEDS = [
  {
    label: 'Food',
    value: 'Produse Alimentare'
  },
  {
    label: 'Drugs',
    value: 'Medicamente'
  },
  {
    label: 'Transport',
    value: 'Transport Persoana'
  },
  {
    label: 'Payment',
    value: 'Achitare Facturi'
  }
]

@Component({
  templateUrl: './request-details.component.html',
  styleUrls: ['./request-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestDetailsComponent implements OnInit, OnDestroy {
  form: FormGroup
  zones: Array<string> = Object.keys(ZONES).filter((key) => isNaN(+key))
  needs = BENEFICIARY_NEEDS
  ilnessOptions: Array<string> = Object.values(ILNESS_OPTIONS).filter((key) =>
    isNaN(+key)
  )
  specialConditions = SPECIAL_CONDITIONS

  existentBeneficiary = false //Testing for the beneficiary component

  constructor(private requestsFacade: RequestsFacade) {}

  onSubmit(ev: Event) {
    // Transform the values for backend
    this.form
      .get('need')
      .setValue(
        this.getEnumKeyByEnumValue(
          BENEFICIARY_NEEDS,
          this.form.get('need').value
        )
      )
    this.form
      .get('ilness')
      .setValue(
        this.getEnumKeyByEnumValue(
          ILNESS_OPTIONS,
          this.form.get('ilness').value
        )
      )
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      first_name: new FormControl(null, [Validators.required]),
      last_name: new FormControl(null, [Validators.required]),
      age: new FormControl(null),
      zone: new FormControl(null, [Validators.required]),
      address: new FormControl(null, [Validators.required]),
      apartment: new FormControl(null),
      entrance: new FormControl(null),
      floor: new FormControl(null),
      phone: new FormControl(null, [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(8),
        Validators.pattern(/^([0-9]){8}$/)
      ]),
      landline: new FormControl(
        null,
        // because we add prefix 22 at form submit.
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^([0-9]){6}$/)
        ]
      ),
      special_condition: new FormControl(null, [Validators.required]),
      ilness: new FormControl('', [Validators.required]),
      need: new FormControl('', [Validators.required]),
      comments: new FormControl(''),
      password: new FormControl(null, [Validators.required]),
      urgent: new FormControl(false)
    })
  }
  ngOnDestroy() {}

  getEnumKeyByEnumValue(myEnum, enumValue) {
    let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue)
    return keys.length > 0 ? keys[0] : null
  }

  enumUnsorted() {}

  checkForExistentBeneficiary(phone: any) {
    // this function should display the hidden div if the beneficiary is found
    // check if the logic works
    if (phone.length == 8) this.existentBeneficiary = true
    else this.existentBeneficiary = false
  }

  getUrgentStyleObject() {
    if (this.form.get('urgent').value === false) {
      return { backgroundColor: 'white', color: '#ed5555' }
    } else return { backgroundColor: '#ed5555', color: 'white' }
  }

  updateAdress(event: coordinates) {
    console.log(
      '🚀 ~ file: request-details.component.ts ~ line 130 ~ RequestDetailsComponent ~ updateAdress ~ event',
      event
    )
    this.form.get('address').patchValue(event.address)
    console.log(
      "🚀 ~ file: request-details.component.ts ~ line 136 ~ RequestDetailsComponent ~ updateAdress ~ this.form.get('address')",
      this.form.get('address').value
    )
  }
}
