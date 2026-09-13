import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notifyReady, requestApplyUpdate, requestCheckUpdate, requestDocument, requestOpenRelease } from "./bridge";
import { bridgeAsync } from "./bridgeAsync";
import { AboutModal } from "./AboutModal";
import { DocumentModal } from "./DocumentModal";
import { EpdTableRow } from "./EpdTableRow";
import { useFloatingMenu } from "./FloatingMenu";
import { LoadingPlaceholderRow } from "./LoadingPlaceholderRow";
import { StatusBar } from "./StatusBar";
import { TableSubhead } from "./TableSubhead";
import { UpdateOfferModal } from "./UpdateOfferModal";
import { daysWithItems, filterItems, loadStoredDays, loadStoredQuery } from "./epdSearch";
import {
  parseDocumentPayload,
  parseEdoDiagnosticsPayload,
  parseEdoOnlineIdsPayload,
  parseEnrichRowsPayload,
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
import type { EpdListItem, UpdateInfoPayload, VersionCatalogItem } from "./types";

const TABLE_HINT =
  "Клик по строке — карточка. Клик по тексту — копирование. ПКМ — меню. ⋮ — действия строки. М — наша организация.";

const TABLE_COLUMNS = ["Документ", "Грузоотправитель", "Перевозчик", "Грузополучатель", ""] as const;

export default function App() {
  const [version, setVersion] = useState("0.8.4");
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

  const dataLoadStarted = useRef(false);
  const updatePromptShown = useRef(false);
  const pendingVersionPicker = useRef(false);

  const listBusy = isLoadActive(loadProgress) || refreshActive;
  const enrichingRef = loadProgress?.enrichingRef ?? null;
  const superseded = updateInfo?.uiMode === "superseded" || updateInfo?.phase === "superseded";

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
    if (version) {
      fallback.push({
        version,
        path: updateInfo?.epfPath,
        kind: "current",
        installed: true,
      });
    }
    for (const rel of updateInfo?.localReleases ?? []) {
      if (rel.version === version) {
        continue;
      }
      fallback.push({ version: rel.version, path: rel.path, kind: "local", installed: true });
    }
    return fallback;
  }, [updateInfo, version]);

  const beginDataLoadIfNeeded = useCallback(() => {
    if (dataLoadStarted.current || superseded) {
      return;
    }
    dataLoadStarted.current = true;
    cancelListLoad();
    setItems([]);
    setLoadProgress({
      phase: "meta",
      loaded: 0,
      total: 0,
      enriched: 0,
      fetchingRow: false,
      enrichingRef: null,
    });

    void loadRegistryPaginated({
      onVersion: setVersion,
      onProgress: (progress) => {
        setLoadProgress(progress);
        if (progress.phase === "done") {
          setRefreshActive(false);
          if (progress.loaded > 0) {
            showToast(`Загружено документов: ${progress.loaded}`);
          }
        }
      },
      onAppendPage: (pageItems) => {
        setItems((prev) => [...prev, ...pageItems]);
      },
      onEnrichBatch: (updates) => {
        setItems((prev) =>
          prev.map((item) => {
            const update = updates.find((row) => row.ref === item.ref);
            if (!update) {
              return item;
            }
            return {
              ...item,
              shipper: update.shipper,
              carrier: update.carrier,
              consignee: update.consignee,
              partiesPending: false,
            };
          }),
        );
      },
      onError: (message) => {
        setLoadProgress(null);
        setRefreshActive(false);
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
      if (payload.currentVersion) {
        setVersion(payload.currentVersion);
      }
      if (pendingVersionPicker.current) {
        pendingVersionPicker.current = false;
        setVersionPickerOpen(true);
      }
      if (dataLoadStarted.current || updatePromptShown.current) {
        return;
      }
      if (payload.updateAvailable && payload.targetVersion && (payload.epfPath || payload.epfUrl)) {
        updatePromptShown.current = true;
        setUpdateOfferOpen(true);
        showToast(`Доступна новая версия v${payload.targetVersion}`, "info");
        return;
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
          phase: "meta",
          loaded: 0,
          total: 0,
          enriched: 0,
          fetchingRow: false,
          enrichingRef: null,
        });
        setRefreshActive(true);
        void loadRegistryPaginated({
          onVersion: setVersion,
          onProgress: (progress) => {
            setLoadProgress(progress);
            if (progress.phase === "done") {
              setRefreshActive(false);
              if (progress.loaded > 0) {
                showToast(`Загружено документов: ${progress.loaded}`);
              }
            }
          },
          onAppendPage: (pageItems) => setItems((prev) => [...prev, ...pageItems]),
          onEnrichBatch: (updates) => {
            setItems((prev) =>
              prev.map((item) => {
                const update = updates.find((row) => row.ref === item.ref);
                if (!update) {
                  return item;
                }
                return {
                  ...item,
                  shipper: update.shipper,
                  carrier: update.carrier,
                  consignee: update.consignee,
                  partiesPending: false,
                };
              }),
            );
          },
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
        setVersion(payload.version);
        setItems(payload.items ?? []);
        setRefreshActive(false);
        setLoadProgress(null);
        showToast(`Загружено документов: ${payload.items?.length ?? 0}`);
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
          setUpdateApplying(false);
          setUpdateChecking(false);
          setUpdateOfferOpen(false);
        } else if (payload.phase === "apply") {
          setUpdateApplying(false);
          setUpdateChecking(false);
          if (payload.success && payload.latestVersion) {
            setVersion(payload.latestVersion);
          }
          if (payload.message) {
            showToast(payload.message, payload.success ? "info" : "error");
          }
        } else if (payload.phase === "check") {
          handleUpdateCheckPayload(payload);
        } else {
          setUpdateApplying(false);
          if (payload.currentVersion) {
            setVersion(payload.currentVersion);
          }
        }
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
        setUpdateChecking(false);
        setUpdateApplying(false);
        pendingVersionPicker.current = false;
        showToast(message, "error", 15000);
        beginDataLoadIfNeeded();
      },
    });

    notifyReady();

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

  const closeModal = () => {
    setModalRef("");
    setModalDoc(null);
    setDocLoading(false);
  };

  const handleRefresh = () => {
    if (listBusy) {
      return;
    }
    closeModal();
    startListLoad(true);
  };

  const handleApplyUpdate = useCallback(() => {
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
        setUpdateApplying(true);
        requestApplyUpdate(updateInfo?.epfPath, item.version, epfUrl);
        return;
      }
      requestOpenRelease(item.version, epfUrl);
    },
    [updateInfo?.epfPath, updateInfo?.epfUrl],
  );

  const showInitialSkeleton =
    loadProgress?.phase === "meta" || (Boolean(loadProgress?.fetchingRow) && items.length === 0);
  const showNextRowSkeleton = Boolean(loadProgress?.fetchingRow) && items.length > 0;

  return (
    <div className={`layout layout-full layout-shell ${superseded ? "layout-superseded" : ""}`}>
      {superseded ? (
        <SupersededOverlay
          message={updateInfo?.message ?? "Запущена более новая версия обработки."}
          launchedVersion={updateInfo?.launchedVersion}
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
              {showInitialSkeleton ? <LoadingPlaceholderRow /> : null}
              {visibleItems.map((item) => (
                <EpdTableRow
                  key={item.ref}
                  item={item}
                  active={item.ref === modalRef}
                  enrichingEdo={enrichingRef === item.ref}
                  onOpen={openModal}
                  onCopied={handleCopied}
                  onOpenMenu={openFloatingMenu}
                />
              ))}
              {showNextRowSkeleton ? <LoadingPlaceholderRow /> : null}
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
        version={version}
        loadProgress={loadProgress}
        updateChecking={updateChecking}
        updateAvailable={Boolean(updateInfo?.updateAvailable && !superseded)}
        updateTargetVersion={updateInfo?.targetVersion}
        updateError={updateInfo?.error}
        onAboutOpen={() => setAboutOpen(true)}
        onVersionClick={superseded ? undefined : handleVersionBadgeClick}
      />

      <DocumentModal
        open={Boolean(modalRef && modalItem)}
        item={modalItem}
        loading={docLoading}
        commentDraft={commentDraft}
        onCommentChange={setCommentDraft}
        onClose={closeModal}
        onCopied={handleCopied}
      />

      <AboutModal open={aboutOpen} version={version} onClose={() => setAboutOpen(false)} />

      <UpdateOfferModal
        open={updateOfferOpen && !superseded}
        currentVersion={version}
        targetVersion={updateInfo?.targetVersion ?? ""}
        notes={updateInfo?.notes}
        applying={updateApplying}
        onUpdate={handleApplyUpdate}
        onStay={handleStayOnVersion}
      />

      <VersionPickerModal
        open={versionPickerOpen && !superseded}
        currentVersion={version}
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
