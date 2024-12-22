import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  constructor(partial: Partial<UpdatePatientDto>) {
    super();
    Object.assign(this, partial);
  }
}
