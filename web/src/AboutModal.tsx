import { ModalPortal } from "./ModalPortal";

import type { UpdateInfoPayload } from "./types";

type AboutModalProps = {
  open: boolean;
  version: string;
  updateInfo: UpdateInfoPayload | null;
  updateApplying: boolean;
  onRefreshUpdateCheck: () => void;
  onApplyUpdate: (targetPath?: string) => void;
  onClose: () => void;
};

export function AboutModal({
  open,
  version,
  updateInfo,
  updateApplying,
  onRefreshUpdateCheck,
  onApplyUpdate,
  onClose,
}: AboutModalProps) {
  return (
    <ModalPortal open={open} onClose={onClose} cardClassName="about-card" ariaLabelledBy="about-title">
      <header className="modal-header">
        <div>
          <p className="modal-kicker">О программе</p>
          <h2 id="about-title">Помощник для ЭДО</h2>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </header>

      <section className="about-product">
        <p>
          Внешняя обработка для просмотра и аудита электронных перевозочных документов (ЭПД) в 1С: типовой
          реестр, стороны сделки, обмен ЭДО, карточка документа и комментарии.
        </p>
        <p className="about-types muted">ЭТрН · ЭСВ · ЭЗЗ · ЭЗН · ЭПЛ · ЭДФ</p>
        <p className="about-credit">
          Авторская разработка: <strong>Шолохов Иван</strong>
        </p>
      </section>

      <section className="about-section about-license">
        <h3 className="about-section-title">Лицензия и обновления</h3>
        <dl className="about-dl">
          <dt>Текущая версия</dt>
          <dd>v{version}</dd>
          <dt>Обновления</dt>
          <dd>
            {!updateInfo?.manifestConfigured ? (
              <span className="muted">URL манифеста не задан в ObjectModule.URLМанифестаОбновлений</span>
            ) : updateInfo.error ? (
              <span className="about-update-error">{updateInfo.error}</span>
            ) : updateInfo.updateAvailable ? (
              <span>Доступна v{updateInfo.latestVersion}</span>
            ) : (
              <span className="muted">Актуальная версия</span>
            )}
          </dd>
          {updateInfo?.epfPath ? (
            <>
              <dt>Файл .epf</dt>
              <dd className="about-epf-path">{updateInfo.epfPath}</dd>
            </>
          ) : null}
          <dt>Лицензия</dt>
          <dd className="muted">Не активирована</dd>
        </dl>
        {updateInfo?.manifestConfigured ? (
          <div className="about-update-actions">
            {updateInfo.updateAvailable ? (
              <button
                type="button"
                className="button-ghost update-btn-primary"
                disabled={updateApplying}
                onClick={() => onApplyUpdate(updateInfo.epfPath)}
              >
                {updateApplying ? "Загрузка…" : "Обновить файл .epf"}
              </button>
            ) : null}
            <button type="button" className="button-ghost" onClick={onRefreshUpdateCheck}>
              Проверить обновления
            </button>
          </div>
        ) : null}
      </section>

      <section className="about-author">
        <h3 className="about-section-title">Контакт разработчика</h3>
        <div className="about-author-card">
          <div className="about-author-text">
            <p className="about-author-name">Шолохов Иван</p>
            <p className="about-author-role">Специалист технической поддержки 1С</p>
            <p className="about-contact">
              <a href="tel:+74957773349,138">+7 495 777 33 49 доб. 138</a>
            </p>
            <p className="about-contact">
              <a href="tel:+74951504463,138">+7 495 150 44 63 доб. 138</a>
            </p>
            <p className="about-contact">
              <a href="mailto:isholohov@grandproject.ru">
                isholohov@<strong>grandproject.ru</strong>
              </a>
            </p>
          </div>
          <a className="about-photo-link" href="https://grandproject.ru/" target="_blank" rel="noreferrer">
            <img
              className="about-photo"
              src="https://grandproject.ru/signatures/table/isholohov.jpg"
              alt="Гранд Проект — grandproject.ru"
              width={300}
              height={188}
            />
          </a>
        </div>
        <p className="about-legal muted">
          Коммерческая тайна · ООО «Гранд Проект» · 117449, г. Москва, ул. Большая Черемушкинская, д.2, кор. 4
        </p>
      </section>
    </ModalPortal>
  );
}
