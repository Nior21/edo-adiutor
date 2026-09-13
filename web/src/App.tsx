import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchLatestGithubRelease, type GithubReleaseInfo } from "./githubReleases";
import { mergeGithubIntoUpdateInfo } from "./mergeUpdateInfo";
import { notifyReady, requestApplyUpdate, requestCheckUpdate, requestDocument, requestOpenRelease } from "./bridge";
import { bridgeAsync } from "./bridgeAsync";
import { AboutModal } from "./AboutModal";
import { DocumentModal } from "./DocumentModal";
import { EpdTableRow } from "./EpdTableRow";
import { useFloatingMenu } from "./FloatingMenu";
import { LoadingAnimationLab } from "./LoadingAnimationLab";
import { LoadingPlaceholderRow } from "./LoadingPlaceholderRow";
import { StatusBar } from "./StatusBar";
import { TableSubhead } from "./TableSubhead";
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
import { UpdatePanel } from "./UpdatePanel";
import { VersionPickerModal } from "./VersionPickerModal";
import { isLoadActive } from "./loadProgressUi";
import { cancelListLoad, loadRegistryPaginated, type ListLoadProgress } from "./listLoader";
import { useToast } from "./useToast";
import type { EpdListItem, UpdateInfoPayload } from "./types";

const TABLE_HINT =
  "Клик по строке — карточка. Клик по тексту — копирование. ПКМ — меню. ⋮ — действия строки. М — наша организация.";

const TABLE_COLUMNS = ["Документ", "Грузоотправитель", "Перевозчик", "Грузополучатель", ""] as const;

const ANIM_TEST_MS = 8000;

export default function App() {
  const [version, setVersion] = useState("0.7.0");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfoPayload | null>(null);
  const [updateBaseFrom1c, setUpdateBaseFrom1c] = useState<UpdateInfoPayload | null>(null);
  const [githubRelease, setGithubRelease] = useState<GithubReleaseInfo | null>(null);
  const [githubError, setGithubError] = useState("");
  const autoUpdateTriggered = useRef(false);
  const [updateApplying, setUpdateApplying] = useState(false);
  const [items, setItems] = useState<EpdListItem[]>([]);
  const [refreshActive, setRefreshActive] = useState(false);
  const [loadProgress, setLoadProgress] = useState<ListLoadProgress | null>({
    phase: "meta",
    loaded: 0,
    total: 0,
    enriched: 0,
    fetchingRow: false,
    enrichingRef: null,
  });
  const [query, setQuery] = useState(loadStoredQuery);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => loadStoredDays());
  const [modalRef, setModalRef] = useState<string>("");
  const [modalDoc, setModalDoc] = useState<EpdListItem | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [versionPickerOpen, setVersionPickerOpen] = useState(false);
  const [animTestUntil, setAnimTestUntil] = useState(0);
  const { toast, showToast } = useToast();
  const { openAt: openFloatingMenu, portal: floatingMenuPortal } = useFloatingMenu();

  const animTestActive = Date.now() < animTestUntil;
  const listBusy = isLoadActive(loadProgress) || refreshActive;
  const enrichingRef = loadProgress?.enrichingRef ?? null;

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

  const startListLoad = useCallback(
    (fromRefresh = false) => {
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
      if (fromRefresh) {
        setRefreshActive(true);
      }

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
    },
    [showToast],
  );

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(modalRef || aboutOpen));
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [aboutOpen, modalRef]);

  useEffect(() => {
    if (!animTestActive) {
      return;
    }
    const delay = animTestUntil - Date.now();
    const id = window.setTimeout(() => setAnimTestUntil(0), Math.max(delay, 0));
    return () => window.clearTimeout(id);
  }, [animTestActive, animTestUntil]);

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
          return;
        }
        if (payload.phase === "check") {
          setUpdateBaseFrom1c(payload);
        } else {
          setUpdateInfo(payload);
        }
        if (payload.phase === "superseded" || payload.uiMode === "superseded") {
          setUpdateApplying(false);
        } else if (payload.phase === "apply") {
          setUpdateApplying(false);
          if (payload.success && payload.latestVersion) {
            setVersion(payload.latestVersion);
          }
          if (payload.message) {
            showToast(payload.message, payload.success ? "info" : "error");
          }
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
        showToast(message);
      },
      setError: (message: string) => {
        showToast(message, "error");
      },
    });

    notifyReady();
    startListLoad();

    return () => {
      cancelListLoad();
      window.__edoBridgeRegister(undefined);
    };
  }, [mergeItem, showToast, startListLoad]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const latest = await fetchLatestGithubRelease();
        if (!cancelled) {
          setGithubRelease(latest);
          setGithubError(latest ? "" : "На GitHub пока нет опубликованного Release с .epf.");
        }
      } catch (error) {
        if (!cancelled) {
          setGithubRelease(null);
          setGithubError(error instanceof Error ? error.message : "Не удалось запросить GitHub Releases.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (updateInfo?.phase === "superseded" || updateInfo?.uiMode === "superseded") {
      return;
    }
    const merged = mergeGithubIntoUpdateInfo(updateBaseFrom1c, version, githubRelease, githubError);
    setUpdateInfo(merged);
  }, [updateBaseFrom1c, version, githubRelease, githubError, updateInfo?.phase, updateInfo?.uiMode]);

  useEffect(() => {
    const isSuperseded = updateInfo?.uiMode === "superseded" || updateInfo?.phase === "superseded";
    if (autoUpdateTriggered.current || isSuperseded) {
      return;
    }
    if (!updateInfo?.autoSwitchRecommended || !updateInfo.updateAvailable) {
      return;
    }
    if (!updateInfo.epfPath || !updateInfo.targetVersion || !updateInfo.epfUrl) {
      return;
    }
    autoUpdateTriggered.current = true;
    setUpdateApplying(true);
    window.setTimeout(() => {
      requestApplyUpdate(updateInfo.epfPath, updateInfo.targetVersion, updateInfo.epfUrl);
    }, 400);
  }, [updateInfo]);

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

  const runAnimTest = () => {
    setAnimTestUntil(Date.now() + ANIM_TEST_MS);
    showToast(`Тест анимаций: ${ANIM_TEST_MS / 1000} сек.`);
  };

  const handleApplyUpdate = useCallback(
    (targetPath?: string) => {
      setUpdateApplying(true);
      requestApplyUpdate(targetPath, updateInfo?.targetVersion, updateInfo?.epfUrl);
    },
    [updateInfo?.targetVersion, updateInfo?.epfUrl],
  );

  const handleRefreshUpdateCheck = useCallback(() => {
    requestCheckUpdate();
  }, []);

  const showInitialSkeleton =
    loadProgress?.phase === "meta" || (Boolean(loadProgress?.fetchingRow) && items.length === 0);
  const showNextRowSkeleton = Boolean(loadProgress?.fetchingRow) && items.length > 0;
  const superseded = updateInfo?.uiMode === "superseded" || updateInfo?.phase === "superseded";
  const localReleases = updateInfo?.localReleases ?? [];

  return (
    <div className={`layout layout-full layout-shell ${superseded ? "layout-superseded" : ""}`}>
      {superseded ? (
        <SupersededOverlay
          message={updateInfo?.message ?? "Запущена более новая версия обработки."}
          launchedVersion={updateInfo?.launchedVersion}
        />
      ) : null}
      <div className="main-card">
        <UpdatePanel
          info={updateInfo}
          applying={updateApplying}
          onRefreshCheck={handleRefreshUpdateCheck}
          onApply={handleApplyUpdate}
        />

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
          onAnimTest={runAnimTest}
          animTestActive={animTestActive}
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
              {animTestActive ? <LoadingAnimationLab /> : null}
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
              {!listBusy && visibleItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted center">
                    {items.length === 0 ? "В реестре ЭПД нет документов." : "Нет документов за выбранные условия."}
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
        onAboutOpen={() => setAboutOpen(true)}
        versionClickable={!superseded && Boolean(updateInfo?.epfPath)}
        onVersionClick={() => setVersionPickerOpen(true)}
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

      <AboutModal
        open={aboutOpen}
        version={version}
        updateInfo={updateInfo}
        updateApplying={updateApplying}
        onRefreshUpdateCheck={handleRefreshUpdateCheck}
        onApplyUpdate={handleApplyUpdate}
        onClose={() => setAboutOpen(false)}
      />

      <VersionPickerModal
        open={versionPickerOpen && !superseded}
        currentVersion={version}
        releases={localReleases}
        onSelect={(releaseVer) => {
          setVersionPickerOpen(false);
          requestOpenRelease(releaseVer);
        }}
        onClose={() => setVersionPickerOpen(false)}
      />

      {floatingMenuPortal}
    </div>
  );
}
