export type EdoExchangeStatus = "accepted" | "not_accepted" | "unknown";

export type EtnParty = {
  role: string;
  roleLabel: string;
  participantName: string;
  inn: string;
  kpp: string;
  edoId: string;
  edoExchangeStatus: EdoExchangeStatus;
};

export type EtnListItem = {
  ref: string;
  docType: string;
  number: string;
  date: string;
  comment: string;
  uidMintrans: string;
  organization: string;
  currentTitle: string;
  waybillNumber: string;
  waybillDate: string;
  isIncoming: boolean;
};

export type EtnDocument = EtnListItem & {
  roleParticipant: string;
  currentStep: string;
  currentStepDone: boolean;
  parties: EtnParty[];
};

export type InitPayload = {
  version: string;
  items: EtnListItem[];
};

export type BridgeAction =
  | { action: "ready" }
  | { action: "getList" }
  | { action: "getDocument"; ref: string }
  | { action: "saveComment"; ref: string; comment: string };

export {};
