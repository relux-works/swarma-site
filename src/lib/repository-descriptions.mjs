// Descriptions use book terms; development state comes exclusively from the status rows.
export const repositoryDescriptions = {
  'curator': {
    ru: 'Swarma Curator: профили, управляемые дома агентов, скиллы, оверлеи и MCP.',
    en: 'Swarma Curator: profiles, managed agent homes, skills, overlays and MCP.',
  },
  'curator-spec': {
    ru: 'Спецификация модуля Swarma Curator: точные форматы, которые книга оставляет спецификации.',
    en: 'The Swarma Curator module specification: exact formats that the book leaves to the specification.',
  },
  'curator-agent-launcher': {
    ru: 'Запуск через `curator run`: настройка окружения, подготовка плана и исполнение среды.',
    en: 'Launch through `curator run`: environment setup, plan preparation and environment execution.',
  },
  'swarma-keymaker': {
    ru: 'Ключник (Swarma Keyholder): хранит мастер-секрет и подписывает за агентов, узнавая собеседника по UID от ядра.',
    en: 'Swarma Keyholder: holds the master secret and signs for agents, learning the peer UID from the kernel.',
  },
  'swarma-registrar': {
    ru: 'Регистратор (Swarma Registrar): допуск агентов к носителю по ключу зарегистрированной машины, без общего секрета.',
    en: 'Swarma Registrar: agent admission to the carrier by a registered machine key, without a shared secret.',
  },
  'swarma-owner-registry': {
    ru: 'Реестр владельца: единственный авторитетный писатель ключей, аттестаций, грантов, отзывов и журналов личностей на узле доверия.',
    en: 'The owner registry: the sole authoritative writer of keys, attestations, grants, revocations and identity journals on a trust node.',
  },
  'swarma-witness': {
    ru: 'Свидетель отката: хранит упорядоченные потоки записей и по свежему запросу с вызовом отвечает, какая голова последняя.',
    en: 'The rollback witness: stores ordered record streams and answers which head is latest on a fresh challenge.',
  },
  'swarma-credential-broker': {
    ru: 'Брокер учётных данных: одна подписка и аренды на разрешённые запуски, служба под отдельной учёткой без сетевого слушателя.',
    en: 'The credential broker: one subscription and leases for permitted launches, a service under a separate account without a network listener.',
  },
  'swarma-user-manager': {
    ru: 'Менеджер пользователей: создаёт и выводит учётки ОС агентов.',
    en: 'The user manager: creates and retires agent OS accounts.',
  },
  'swarma-dispatcher': {
    ru: 'Диспетчер: принимает заявку на запуск, проверяет право и учитывает ёмкость машины.',
    en: 'The dispatcher: accepts a launch request, checks authority and accounts for machine capacity.',
  },
  'swarma-session-host': {
    ru: 'Хост сессий: ведёт жизнь долгих сессий агентов, а раннер удерживает одну среду под учёткой агента.',
    en: 'The session host: manages long agent sessions, while the runner holds one environment under the agent account.',
  },
  'swarma-pool': {
    ru: 'Публичный пул: исполняет пришедший извне код в одноразовом изолированном исполнении на выделенных машинах.',
    en: 'The public pool: runs code from outside in single-use isolated execution on dedicated machines.',
  },
  'swarma-memory': {
    ru: 'Память агентов: называет действующее решение и его точный источник и говорит, где проверка неполна.',
    en: 'Agent memory: names the current decision and its exact source and says where checking is incomplete.',
  },
};
