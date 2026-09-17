import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  notifyReady,
  requestApplyUpdate,
  requestCheckUpdate,
  requestDocument,
  requestOpenLaunchEpf,
  requestOpenRelease,
  requestPickAndOpenEpf,
} from "./bridge";
import { bridgeAsync } from "./bridgeAsync";
import { AboutModal } from "./AboutModal";
import { DocumentModal } from "./DocumentModal";
import { EpdTableRow } from "./EpdTableRow";
import { useFloatingMenu } from "./FloatingMenu";
import type { FloatingMenuEntry } from "./FloatingMenu";
import { copyToClipboard } from "./copy";
import { hasCommentWorkTag } from "./commentDisplay";
import { setCommentWorkTag } from "./commentWorkTag";
import { itemsByRefs, refsInVisibleRange } from "./listSelection";
import { buildRowContextMenuEntries } from "./rowContextMenuItems";
import { buildRowsCopyPreview, buildRowsCopyText } from "./rowCopyText";
import { StatusBar } from "./StatusBar";
import { TableSubhead } from "./TableSubhead";
import { UpdateOfferModal } from "./UpdateOfferModal";
import { daysWithItems, filterItems, loadStoredDays, loadStoredQuery } from "./epdSearch";
import {
  parseDocumentPayload,
  parseDocumentXmlPayload,
  parseEdoDiagnosticsPayload,
  parseEdoOnlineIdsPayload,
  parseInitPayload,
  parseListMetaPayload,
  parseListPagePayload,
  parseUpdateInfoPayload,
} from "./parsePayload";
import { SupersededOverlay } from "./SupersededOverlay";
import { VersionPickerModal } from "./VersionPickerModal";
import { isLoadActive } from "./loadProgressUi";
import { cancelListLoad, loadRegistryPaginated, type ListLoadProgress } from "./listLoader";
import { useToast } from "./useToast";
import { UI_BUILD_VERSION } from "./buildVersion";
import { compareSemver } from "./semverCompare";
import type { EpdListItem, UpdateInfoPayload, VersionCatalogItem } from "./types";

const TABLE_HINT =
  "Клик — карточка. Ctrl/Shift — выделение строк. ПКМ — меню. [!] — метка «в фокус» в комментарии.";

const TABLE_COLUMNS = ["Документ", "Грузоотправитель", "Перевозчик", "Грузополучатель", ""] as const;

export default function App() {
  const [moduleVersion, setModuleVersion] = useState("");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoPayload | null>(null);
  const [updateApplying, setUpdateApplying] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(true);
  const [updateOfferOpen, setUpdateOfferOpen] = useState(false);
  const [items, setItems] = useState<EpdListItem[]>([]);
  const [refreshActive, setRefreshActive] = useState(false);
  const [loadProgress, setLoadProgress] = useState<ListLoadProgress | null>(null);
  const [query, setQuery] = useState(loadStoredQuery);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => loadStoredDays());
  const [modalRef, setModalRef] = useState<string>("");
  const [modalDoc, setModalDoc] = useState<EpdListItem | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const { toast, showToast } = useToast();
  const { openAt: openFloatingMenu, portal: floatingMenuPortal } = useFloatingMenu();
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(() => new Set());
  const selectionAnchorRef = useRef("");

  const dataLoadStarted = useRef(false);
  const updatePromptShown = useRef(false);
  const pendingVersionPicker = useRef(false);
  const updateInProgress = useRef(false);

  const listBusy = isLoadActive(loadProgress) || refreshActive;
  const superseded = updateInfo?.uiMode === "superseded" || updateInfo?.phase === "superseded";

  const versionMismatch = useMemo(() => {
    if (!moduleVersion) {
      return false;
    }
    return compareSemver(moduleVersion, UI_BUILD_VERSION) !== 0;
  }, [moduleVersion]);

  const effectiveUpdate = useMemo(() => {
    if (!updateInfo || superseded) {
      return { available: false, target: "" };
    }
    let target =
      updateInfo.targetVersion || updateInfo.remoteLatestVersion || updateInfo.latestVersion || "";
    const uiBehindModule =
      Boolean(moduleVersion) && compareSemver(UI_BUILD_VERSION, moduleVersion) < 0;
    if (!target && uiBehindModule) {
      target = moduleVersion;
    }
    const uiBehindTarget = Boolean(target) && compareSemver(UI_BUILD_VERSION, target) < 0;
    const available = Boolean(updateInfo.updateAvailable) || uiBehindTarget || uiBehindModule;
    return { available, target };
  }, [moduleVersion, superseded, updateInfo]);

  const daysWithData = useMemo(() => daysWithItems(items), [items]);

  const visibleItems = useMemo(
    () => filterItems(items, query, selectedDays),
    [items, query, selectedDays],
  );

  const metaText = useMemo(() => {
    if (isLoadActive(loadProgress) && loadProgress && loadProgress.total > 0) {
      return `${items.length} из ${loadProgress.total}`;
    }
    if (isLoadActive(loadProgress)) {
      return "…";
    }
    return `${visibleItems.length} из ${items.length}`;
  }, [items.length, loadProgress, visibleItems.length]);

  const modalItem = useMemo(() => {
    if (modalDoc?.ref === modalRef) {
      return modalDoc;
    }
    return items.find((item) => item.ref === modalRef) ?? null;
  }, [items, modalDoc, modalRef]);

  const versionCatalog = useMemo((): VersionCatalogItem[] => {
    if (updateInfo?.versionCatalog?.length) {
      return updateInfo.versionCatalog;
    }
    const fallback: VersionCatalogItem[] = [];
    const running = moduleVersion || UI_BUILD_VERSION;
    if (running) {
      fallback.push({
        version: running,
        path: updateInfo?.epfPath,
        kind: "current",
        installed: true,
      });
    }
    for (const rel of updateInfo?.localReleases ?? []) {
      if (rel.version === running) {
        continue;
      }
      fallback.push({ version: rel.version, path: rel.path, kind: "local", installed: true });
    }
    return fallback;
  }, [moduleVersion, updateInfo]);

  const beginDataLoadIfNeeded = useCallback(() => {
    if (dataLoadStarted.current || superseded || updateInProgress.current) {
      return;
    }
    dataLoadStarted.current = true;
    cancelListLoad();
    setItems([]);
    setLoadProgress({
      phase: "fetch",
      loaded: 0,
      total: 0,
      fetchingRow: false,
    });

      void loadRegistryPaginated({
        onVersion: setModuleVersion,
        onProgress: (progress) => {
          setLoadProgress(progress);
          if (progress.phase === "done") {
            setRefreshActive(false);
            if (progress.loaded > 0) {
              showToast(`Загружено документов: ${progress.loaded}`);
            }
          }
        },
        onListLoaded: (payload) => {
          setItems(payload.items ?? []);
        },
      onError: (message) => {
        setLoadProgress(null);
        setRefreshActive(false);
        if (updateInProgress.current) {
          return;
        }
        showToast(message, "error");
      },
    });
  }, [showToast, superseded]);

  const handleUpdateCheckPayload = useCallback(
    (payload: UpdateInfoPayload) => {
      if (payload.phase !== "check") {
        return;
      }
      setUpdateChecking(false);
      const epfVer = payload.currentVersion ?? "";
      if (epfVer) {
        setModuleVersion(epfVer);
      }
      if (pendingVersionPicker.current) {
        pendingVersionPicker.current = false;
        setVersionPickerOpen(true);
      }
      if (dataLoadStarted.current || updatePromptShown.current || updateInProgress.current) {
        return;
      }
      let target =
        payload.targetVersion || payload.remoteLatestVersion || payload.latestVersion || "";
      const uiBehindModule = Boolean(epfVer) && compareSemver(UI_BUILD_VERSION, epfVer) < 0;
      if (!target && uiBehindModule) {
        target = epfVer;
      }
      const uiBehindTarget = Boolean(target) && compareSemver(UI_BUILD_VERSION, target) < 0;
      const shouldOfferUpdate =
        (payload.updateAvailable || uiBehindTarget || uiBehindModule) &&
        Boolean(target) &&
        (payload.epfPath || payload.epfUrl);
      if (shouldOfferUpdate) {
        updatePromptShown.current = true;
        setUpdateOfferOpen(true);
        const label = uiBehindModule
          ? `Интерфейс v${UI_BUILD_VERSION}, в EPF v${epfVer || "?"} — обновление до v${target}`
          : `Доступна новая версия v${target}`;
        showToast(label, "info", 12000);
        return;
      }
      if (uiBehindModule) {
        showToast(
          `Модуль EPF v${epfVer}, интерфейс v${UI_BUILD_VERSION}. Выполните F7 и выгрузите .epf заново.`,
          "error",
          15000,
        );
      }
      if (payload.error) {
        showToast(payload.error, "error", 15000);
      }
      beginDataLoadIfNeeded();
    },
    [beginDataLoadIfNeeded, showToast],
  );

  const startListLoad = useCallback(
    (fromRefresh = false) => {
      if (fromRefresh) {
        dataLoadStarted.current = true;
        cancelListLoad();
        setItems([]);
        setLoadProgress({
          phase: "fetch",
          loaded: 0,
          total: 0,
          fetchingRow: false,
        });
        setRefreshActive(true);
        void loadRegistryPaginated({
          onVersion: setModuleVersion,
          onProgress: (progress) => {
            setLoadProgress(progress);
            if (progress.phase === "done") {
              setRefreshActive(false);
              if (progress.loaded > 0) {
                showToast(`Загружено документов: ${progress.loaded}`);
              }
            }
          },
          onListLoaded: (payload) => setItems(payload.items ?? []),
              onError: (message) => {
            setLoadProgress(null);
            setRefreshActive(false);
            showToast(message, "error");
          },
        });
        return;
      }
      beginDataLoadIfNeeded();
    },
    [beginDataLoadIfNeeded, showToast],
  );

  const handleCopied = useCallback(
    (value: string) => {
      const preview = value.length > 48 ? `${value.slice(0, 48)}…` : value;
      showToast(`Скопировано: ${preview}`);
    },
    [showToast],
  );

  const mergeItem = useCallback((payload: EpdListItem) => {
    setItems((prev) => prev.map((item) => (item.ref === payload.ref ? { ...item, ...payload } : item)));
    setModalDoc(payload);
    setCommentDraft(payload.comment ?? "");
    setDocLoading(false);
  }, []);

  useEffect(() => {
    if (!updateChecking) {
      return;
    }
    const watchdog = window.setTimeout(() => {
      setUpdateChecking(false);
      pendingVersionPicker.current = false;
      if (updateInProgress.current) {
        return;
      }
      showToast("Проверка обновлений заняла слишком долго — продолжаем загрузку реестра.", "error", 15000);
      beginDataLoadIfNeeded();
    }, 25000);
    return () => window.clearTimeout(watchdog);
  }, [updateChecking, beginDataLoadIfNeeded, showToast]);

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(modalRef || aboutOpen || updateOfferOpen || versionPickerOpen));
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [aboutOpen, modalRef, updateOfferOpen, versionPickerOpen]);

  useEffect(() => {
    window.__edoBridgeRegister({
      init: (json: unknown) => {
        const payload = parseInitPayload(json);
        setModuleVersion(payload.version);
        setItems(payload.items ?? []);
        setRefreshActive(false);
        setLoadProgress(null);
        bridgeAsync.resolveListInit(payload);
      },
      setListMeta: (json: unknown) => {
        const { meta, error } = parseListMetaPayload(json);
        if (meta) {
          bridgeAsync.resolveListMeta(meta);
        } else {
          bridgeAsync.rejectListMeta(error || "Ошибка метаданных");
        }
      },
      setListPage: (json: unknown) => {
        const { page, error } = parseListPagePayload(json);
        if (page) {
          bridgeAsync.resolveListPage(page);
        } else {
          bridgeAsync.rejectListPage(error || "Ошибка страницы");
        }
      },
      setEnrichRows: (json: unknown) => {
        const { payload, error } = parseEnrichRowsPayload(json);
        if (payload) {
          bridgeAsync.resolveEnrichRows(payload);
        } else {
          bridgeAsync.rejectEnrichRows(error || "Ошибка обогащения");
        }
      },
      setEdoDiagnostics: (json: unknown) => {
        const { data, error } = parseEdoDiagnosticsPayload(json);
        if (data) {
          bridgeAsync.resolveEdoDiagnostics(data);
        } else {
          bridgeAsync.rejectEdoDiagnostics(error || "Ошибка диагностики ЭДО");
        }
      },
      setEdoOnlineIds: (json: unknown) => {
        const { payload, error } = parseEdoOnlineIdsPayload(json);
        if (payload) {
          bridgeAsync.resolveEdoOnlineIds(payload);
        } else {
          bridgeAsync.rejectEdoOnlineIds(error || "Ошибка загрузки ID из сервиса ЭДО");
        }
      },
      setUpdateInfo: (json: unknown) => {
        const payload = parseUpdateInfoPayload(json);
        if (!payload) {
          setUpdateChecking(false);
          pendingVersionPicker.current = false;
          showToast("Не удалось разобрать ответ проверки обновлений.", "error", 15000);
          beginDataLoadIfNeeded();
          return;
        }
        setUpdateInfo(payload);
        if (payload.phase === "superseded" || payload.uiMode === "superseded") {
          updateInProgress.current = false;
          setUpdateApplying(false);
          setUpdateChecking(false);
          setUpdateOfferOpen(false);
        } else if (payload.phase === "resumeAfterReload") {
          updateInProgress.current = false;
          setUpdateApplying(false);
          setUpdateChecking(false);
          if (payload.currentVersion) {
            setModuleVersion(payload.currentVersion);
          }
          dataLoadStarted.current = false;
          updatePromptShown.current = false;
          cancelListLoad();
          beginDataLoadIfNeeded();
        } else if (payload.phase === "apply") {
          setUpdateApplying(false);
          setUpdateChecking(false);
          if (payload.reloadedInPlace && payload.currentVersion) {
            setModuleVersion(payload.currentVersion);
          } else if (payload.currentVersion && !payload.openedNewWindow) {
            setModuleVersion(payload.currentVersion);
          }
          if (payload.message) {
            const kind =
              payload.success || payload.openedNewWindow || payload.anchorReplaced ? "info" : "error";
            showToast(payload.message, kind, payload.success ? 12000 : 20000);
          }
          if (payload.success && payload.reloadedInPlace) {
            updateInProgress.current = true;
            dataLoadStarted.current = false;
            updatePromptShown.current = false;
            cancelListLoad();
            // Загрузка реестра — после phase=resumeAfterReload (новый ready после HTML).
          } else if (payload.success && payload.openedNewWindow) {
            updateInProgress.current = false;
            dataLoadStarted.current = false;
            cancelListLoad();
          } else if (!payload.success) {
            updateInProgress.current = false;
            updatePromptShown.current = false;
            if (payload.launchedPath) {
              beginDataLoadIfNeeded();
            }
          }
        } else if (payload.phase === "check") {
          handleUpdateCheckPayload(payload);
        } else {
          setUpdateApplying(false);
          if (payload.currentVersion) {
            setModuleVersion(payload.currentVersion);
          }
        }
      },
      setDocumentXml: (json: unknown) => {
        bridgeAsync.resolveDocumentXml(parseDocumentXmlPayload(json));
      },
      setDocument: (json: unknown) => {
        const { item, error } = parseDocumentPayload(json);
        if (!item) {
          setDocLoading(false);
          if (error) {
            showToast(error, "error");
          }
          return;
        }
        mergeItem(item);
      },
      setStatus: (message: string) => {
        if (message === "Подключено") {
          return;
        }
        showToast(message);
      },
      setError: (message: string) => {
        bridgeAsync.rejectListInit(message);
        setUpdateChecking(false);
        setUpdateApplying(false);
        pendingVersionPicker.current = false;
        if (!updateInProgress.current) {
          showToast(message, "error", 15000);
          beginDataLoadIfNeeded();
        }
      },
    });

    notifyReady();
    beginDataLoadIfNeeded();
    requestCheckUpdate();

    return () => {
      cancelListLoad();
      window.__edoBridgeRegister(undefined);
    };
  }, [beginDataLoadIfNeeded, handleUpdateCheckPayload, mergeItem, showToast]);

  const openModal = (ref: string) => {
    const row = visibleItems.find((item) => item.ref === ref) ?? items.find((item) => item.ref === ref);
    if (!row) {
      return;
    }
    setModalRef(ref);
    setModalDoc(row);
    setCommentDraft(row.comment ?? "");
    setDocLoading(true);
    requestDocument(ref, row.docType);
  };


  const selectedItems = useMemo(
    () => itemsByRefs(items, selectedRefs),
    [items, selectedRefs],
  );

  const selectionCount = selectedRefs.size;

  const applyCommentLocal = useCallback((item: EpdListItem, comment: string) => {
    setItems((prev) => prev.map((row) => (row.ref === item.ref ? { ...row, comment } : row)));
    setModalDoc((prev) => (prev?.ref === item.ref ? { ...prev, comment } : prev));
    if (modalRef === item.ref) {
      setCommentDraft(comment);
    }
    saveComment(item.ref, item.docType, comment);
  }, [modalRef]);

  const menuActions = useMemo(
    () => ({
      onCopied: handleCopied,
      onSaveComment: applyCommentLocal,
    }),
    [applyCommentLocal, handleCopied],
  );

  const resolveMenuSelection = useCallback(
    (row: EpdListItem) => {
      if (selectedItems.length > 1 && selectedItems.some((item) => item.ref === row.ref)) {
        return selectedItems;
      }
      return [row];
    },
    [selectedItems],
  );

  const getMenuEntries = useCallback(
    (row: EpdListItem) => buildRowContextMenuEntries(row, resolveMenuSelection(row), menuActions),
    [menuActions, resolveMenuSelection],
  );

  const clearRowSelection = useCallback(() => {
    setSelectedRefs(new Set());
  }, []);
  const closeModal = () => {
    setModalRef("");
    setModalDoc(null);
    setDocLoading(false);
  };


  const handleRowClick = useCallback(
    (row: EpdListItem, event: MouseEvent<HTMLTableRowElement>) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        setSelectedRefs((prev) => {
          const next = new Set(prev);
          if (next.has(row.ref)) {
            next.delete(row.ref);
          } else {
            next.add(row.ref);
          }
          return next;
        });
        selectionAnchorRef.current = row.ref;
        return;
      }
      if (event.shiftKey && selectionAnchorRef.current) {
        event.preventDefault();
        const refs = refsInVisibleRange(visibleItems, selectionAnchorRef.current, row.ref);
        setSelectedRefs(new Set(refs));
        return;
      }
      clearRowSelection();
      selectionAnchorRef.current = row.ref;
      openModal(row.ref);
    },
    [clearRowSelection, visibleItems],
  );

  const copySelectedRows = useCallback(async () => {
    if (selectedItems.length === 0) {
      return;
    }
    const ok = await copyToClipboard(buildRowsCopyText(selectedItems));
    if (ok) {
      handleCopied(buildRowsCopyPreview(selectedItems));
    }
  }, [handleCopied, selectedItems]);

  const setAttentionForSelected = useCallback(
    (enabled: boolean) => {
      for (const row of selectedItems) {
        const next = setCommentWorkTag(row.comment, enabled);
        if (next !== row.comment) {
          applyCommentLocal(row, next);
        }
      }
    },
    [applyCommentLocal, selectedItems],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedRefs.size > 0) {
        clearRowSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearRowSelection, selectedRefs.size]);
  const handleRefresh = () => {
    if (listBusy) {
      return;
    }
    closeModal();
    startListLoad(true);
  };

  const handleApplyUpdate = useCallback(() => {
    updateInProgress.current = true;
    cancelListLoad();
    setUpdateApplying(true);
    setUpdateOfferOpen(false);
    requestApplyUpdate(updateInfo?.epfPath, updateInfo?.targetVersion, updateInfo?.epfUrl);
  }, [updateInfo?.epfPath, updateInfo?.targetVersion, updateInfo?.epfUrl]);

  const handleStayOnVersion = useCallback(() => {
    setUpdateOfferOpen(false);
    beginDataLoadIfNeeded();
  }, [beginDataLoadIfNeeded]);

  const handleRefreshUpdateCheck = useCallback(() => {
    setUpdateChecking(true);
    requestCheckUpdate();
  }, []);

  const handleVersionBadgeClick = useCallback(() => {
    if (superseded) {
      return;
    }
    pendingVersionPicker.current = true;
    setUpdateChecking(true);
    requestCheckUpdate();
  }, [superseded]);

  const handleCatalogSelect = useCallback(
    (item: VersionCatalogItem) => {
      setVersionPickerOpen(false);
      if (item.kind === "current" && item.installed) {
        return;
      }
      const epfUrl = item.epfUrl || (item.kind === "remote" ? updateInfo?.epfUrl : undefined);
      if (item.kind === "remote" && !item.installed && epfUrl) {
        updateInProgress.current = true;
        cancelListLoad();
        setUpdateApplying(true);
        requestApplyUpdate(updateInfo?.epfPath, item.version, epfUrl);
        return;
      }
      requestOpenRelease(item.version, epfUrl);
    },
    [updateInfo?.epfPath, updateInfo?.epfUrl],
  );

  return (
    <div className={`layout layout-full layout-shell ${superseded ? "layout-superseded" : ""}`}>
      {superseded ? (
        <SupersededOverlay
          message={updateInfo?.message ?? "Запущена более новая версия обработки."}
          launchedVersion={updateInfo?.launchedVersion}
          launchedPath={updateInfo?.launchedPath}
          onOpenLaunch={() => requestOpenLaunchEpf(updateInfo?.launchedPath)}
          onPickFile={() => requestPickAndOpenEpf()}
        />
      ) : null}
      <div className="main-card">
        <TableSubhead
          metaText={metaText}
          listLoading={listBusy}
          refreshActive={refreshActive}
          selectedDays={selectedDays}
          daysWithData={daysWithData}
          query={query}
          onQueryChange={setQuery}
          onDaysChange={setSelectedDays}
          onRefresh={handleRefresh}
        />

        <div className="table-scroll">
          <table className="epd-table">
            <thead>
              <tr>
                {TABLE_COLUMNS.map((title, index) => (
                  <th key={index} className={index === 4 ? "col-row-menu" : undefined}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                                <EpdTableRow
                  key={item.ref}
                  item={item}
                  active={item.ref === modalRef}
                  selected={selectedRefs.has(item.ref)}
                  getMenuEntries={getMenuEntries}
                  onRowClick={handleRowClick}
                  onCopied={handleCopied}
                  onOpenMenu={openFloatingMenu}
                />
              ))}
              {!listBusy && !updateChecking && visibleItems.length === 0 && dataLoadStarted.current && (
                <tr>
                  <td colSpan={5} className="muted center">
                    {items.length === 0 ? "В реестре ЭПД нет документов." : "Нет документов за выбранные условия."}
                  </td>
                </tr>
              )}
              {!dataLoadStarted.current && !updateChecking && !updateOfferOpen && (
                <tr>
                  <td colSpan={5} className="muted center">
                    {updateApplying ? "Подготовка обновления…" : "Ожидание…"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StatusBar
        toast={toast}
        hint={TABLE_HINT}
        uiVersion={UI_BUILD_VERSION}
        moduleVersion={moduleVersion}
        versionMismatch={versionMismatch}
        loadProgress={loadProgress}
        docLoadingHint={docLoading ? "Загрузка карточки документа…" : undefined}
        updateChecking={updateChecking}
        updateAvailable={effectiveUpdate.available && !superseded}
        updateTargetVersion={effectiveUpdate.target}
        updateError={updateInfo?.error}
        onAboutOpen={() => setAboutOpen(true)}
        onVersionClick={superseded ? undefined : handleVersionBadgeClick}
      />

      <DocumentModal
        open={Boolean(modalRef && modalItem)}
        item={modalItem}
        commentDraft={commentDraft}
        onCommentChange={setCommentDraft}
        onClose={closeModal}
        onCopied={handleCopied}
      />

      <AboutModal
        open={aboutOpen}
        uiVersion={UI_BUILD_VERSION}
        moduleVersion={moduleVersion}
        onClose={() => setAboutOpen(false)}
      />

      <UpdateOfferModal
        open={updateOfferOpen && !superseded}
        currentVersion={UI_BUILD_VERSION}
        targetVersion={effectiveUpdate.target || updateInfo?.targetVersion || ""}
        notes={updateInfo?.notes}
        applying={updateApplying}
        onUpdate={handleApplyUpdate}
        onStay={handleStayOnVersion}
      />

      <VersionPickerModal
        open={versionPickerOpen && !superseded}
        currentVersion={UI_BUILD_VERSION}
        catalog={versionCatalog}
        checking={updateChecking}
        onSelect={handleCatalogSelect}
        onRefresh={handleRefreshUpdateCheck}
        onClose={() => setVersionPickerOpen(false)}
      />

      {floatingMenuPortal}
    </div>
  );
}
