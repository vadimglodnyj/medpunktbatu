export class ExportVisitDto {
  patientName!: string;
  startDate!: Date;
  endDate!: Date | null;
  facility!: string;
  preliminaryDiagnosis!: string | null;
  finalDiagnosis!: string | null;
  documents!: string[];
  hasAppendix21!: boolean;
}
