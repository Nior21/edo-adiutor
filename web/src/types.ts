export type EdoExchangeStatus = "accepted" | "not_accepted" | "unknown" | "own";

export type PartyCell = {
  name: string;
  inn: string;
  kpp: string;
  edoId: string;
  edoExchangeStatus: EdoExchangeStatus;
  isOwnOrganization?: boolean;
};

export type EpdListItem = {
  ref: string;
  docType: string;
  docTypeName: string;
  number: string;
  ibNumber: string;
  date: string;
  organization: string;
  currentStep: string;
  currentStepDone: boolean;
  posted: boolean;
  deletionMark: boolean;
  comment: string;
  shipper: PartyCell;
  consignee: PartyCell;
  carrier: PartyCell;
  uidMintrans?: string;
  isIncoming?: boolean;
  roleParticipant?: string;
  waybillNumber?: string;
  waybillDate?: string;
  titleDates?: Record<string, string>;
  diagnostics?: string[];
};

export type InitPayload = {
  version: string;
  items: EpdListItem[];
};

export type BridgeAction =
  | { action: "ready" }
  | { action: "getList" }
  | { action: "getDocument"; ref: string }
  | { action: "openDocument"; ref: string }
  | { action: "saveComment"; ref: string; comment: string };

export {};
