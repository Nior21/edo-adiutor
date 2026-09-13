export type EdoExchangeStatus = "accepted" | "not_accepted" | "unknown" | "own" | "pending";

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
  partiesPending?: boolean;
  uidMintrans?: string;
  isIncoming?: boolean;
  roleParticipant?: string;
  waybillNumber?: string;
  waybillDate?: string;
  titleDates?: Array<{ key: string; value: string }>;
  diagnostics?: string[];
};

export type ListMetaPayload = {
  version: string;
  total: number;
};

export type ListPagePayload = {
  offset: number;
  limit: number;
  total: number;
  items: EpdListItem[];
};

export type EnrichRowsPayload = {
  updates: Array<{
    ref: string;
    shipper: PartyCell;
    carrier: PartyCell;
    consignee: PartyCell;
  }>;
};

export type InitPayload = {
  version: string;
  items: EpdListItem[];
};

export type EdoInvitationStatusCode =
  | "accepted"
  | "rejected"
  | "awaiting_consent"
  | "requires_consent"
  | "requires_send"
  | "roaming_setup"
  | "error"
  | "not_required"
  | "unknown"
  | "in_settings"
  | "no_invitation";

export type EdoDiagnosticInvitation = {
  edoId: string;
  orgEdoId: string;
  operator: string;
  status: EdoInvitationStatusCode;
  statusLabel: string;
  statusChangedAt?: string;
  archived: boolean;
  forOurOrg: boolean;
};

export type EdoDiagnosticItem = {
  edoId: string;
  title: string;
  operatorCode?: string;
  operatorLabel?: string;
  source: "online" | "local" | "available" | "settings" | "invitation";
  inSendSettings: boolean;
  isCurrentInDoc: boolean;
  hasAccepted: boolean;
  hasArchived: boolean;
  hasLocalData?: boolean;
  settingsChangedAt?: string;
  invitations: EdoDiagnosticInvitation[];
};

export type EdoDiagnosticsPayload = {
  partyName: string;
  inn: string;
  kpp: string;
  orgEdoId: string;
  currentEdoId: string;
  onlineLoaded?: boolean;
  loadWarning?: string;
  items: EdoDiagnosticItem[];
};

export type EdoOnlineIdsPayload = {
  onlineItems: Array<{ edoId: string; title: string }>;
  onlineLoaded: boolean;
  loadWarning: string;
  error?: string;
};

export type UpdateInfoPayload = {
  phase: "check" | "apply";
  currentVersion?: string;
  latestVersion?: string;
  updateAvailable?: boolean;
  manifestConfigured?: boolean;
  epfPath?: string;
  epfUrl?: string;
  notes?: string;
  error?: string;
  success?: boolean;
  message?: string;
  targetPath?: string;
};

export type BridgeAction =
  | { action: "ready" }
  | { action: "checkUpdate" }
  | { action: "pickEpfPath" }
  | { action: "applyUpdate"; targetPath?: string }
  | { action: "getList" }
  | { action: "getListMeta" }
  | { action: "getListPage"; offset: string; limit: string }
  | { action: "enrichRows"; refs: string }
  | { action: "getDocument"; ref: string; docType: string }
  | { action: "openDocument"; ref: string; docType: string }
  | { action: "openCatalog"; ref: string }
  | { action: "openEdoSettings"; edoId: string; orgRef: string; entityRef?: string }
  | { action: "openEdoSendSettings"; entityRef: string }
  | { action: "getEdoDiagnostics"; orgRef: string; entityRef: string; edoId?: string }
  | { action: "getEdoDiagnosticsLocal"; orgRef: string; entityRef: string; edoId?: string }
  | { action: "getEdoDiagnosticsOnline"; orgRef: string; entityRef: string; edoId?: string }
  | { action: "openEdoTransportSettings"; orgRef: string; entityRef: string; edoId?: string }
  | { action: "saveComment"; ref: string; docType: string; comment: string };

export {};
