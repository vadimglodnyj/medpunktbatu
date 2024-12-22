import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFacilityDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}
