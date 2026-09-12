export type EdoExchangeStatus = "accepted" | "not_accepted" | "unknown" | "own";

export type PartyEntityKind = "organization" | "contragent" | "";

export type PartyCell = {
  name: string;
  inn: string;
  kpp: string;
  edoId: string;
  edoExchangeStatus: EdoExchangeStatus;
  isOwnOrganization?: boolean;
  entityRef?: string;
  entityKind?: PartyEntityKind;
};

export type EpdListItem = {
  ref: string;
  docType: string;
  docTypeName: string;
  number: string;
  ibNumber: string;
  date: string;
  organization: string;
  organizationRef?: string;
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
  titleDates?: Array<{ key: string; value: string }>;
  diagnostics?: string[];
};

export type InitPayload = {
  version: string;
  items: EpdListItem[];
};

export type BridgeAction =
  | { action: "ready" }
  | { action: "getList" }
  | { action: "getDocument"; ref: string; docType: string }
  | { action: "openDocument"; ref: string; docType: string }
  | { action: "openCatalog"; ref: string }
  | { action: "openEdoSettings"; edoId: string; orgRef: string }
  | { action: "saveComment"; ref: string; docType: string; comment: string };

export {};
