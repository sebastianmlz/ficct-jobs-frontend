import { StageCode } from "./index";

export const STAGE_LABEL: Record<StageCode, string> = {
  received: "Recibida",
  preselected: "Preseleccionado",
  interview_scheduled: "Entrevista agendada",
  interview_done: "Entrevista realizada",
  offer: "Oferta",
  hired: "Contratado",
  rejected: "Rechazado",
  withdrawn: "Retirado",
};

export const VACANCY_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  pending_review: "En revisión",
  active: "Activa",
  rejected: "Rechazada",
  closed: "Cerrada",
};

export const INTERVIEW_STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendada",
  done: "Realizada",
  cancelled: "Cancelada",
};

export const MODALITY_LABEL: Record<string, string> = {
  onsite: "Presencial",
  remote: "Remoto",
  hybrid: "Híbrido",
  phone: "Teléfono",
};

export function stageLabel(s: string): string {
  return STAGE_LABEL[s as StageCode] ?? s;
}

export function vacancyStatusLabel(s: string): string {
  return VACANCY_STATUS_LABEL[s] ?? s;
}

export function interviewStatusLabel(s: string): string {
  return INTERVIEW_STATUS_LABEL[s] ?? s;
}

export function modalityLabel(s: string): string {
  return MODALITY_LABEL[s] ?? s;
}
