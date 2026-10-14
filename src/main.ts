import "@fontsource/golos-text/cyrillic-400.css";
import "@fontsource/golos-text/cyrillic-500.css";
import "@fontsource/golos-text/cyrillic-600.css";
import "@fontsource/golos-text/latin-400.css";
import "@fontsource/golos-text/latin-500.css";
import "@fontsource/golos-text/latin-600.css";
import "@fontsource/cormorant-garamond/cyrillic-500-italic.css";
import "@fontsource/cormorant-garamond/latin-500-italic.css";
import "./style.css";
import federation from "./data/federation.json";
import newsData from "./data/news.json";
import eventsData from "./data/events.json";
import mediaData from "./data/media.json";
import sources from "./data/sources.json";

type News = {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  sourceUrl: string;
  image?: string;
  imageAlt?: string;
  mediaId?: string;
};
type Event = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  summary: string;
  sourceUrl: string;
};
type Media = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  sourceUrl: string;
  author: string;
  license: string;
  permissionStatus: "approved";
  minorsPermission: "approved" | "not-applicable";
  type: "image" | "video";
  poster?: string;
};
const news = newsData as News[];
const events = eventsData as Event[];
const media = mediaData as Media[];
const base = import.meta.env.BASE_URL;
const page = document.body.dataset.page || "index";
const esc = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
const path = (name = "") => `${base}${name ? `${name}/` : ""}`;
const asset = (name: string) => `${base}${name.replace(/^\//, "")}`;
const arrow = '<span aria-hidden="true">↗</span>';
const link = (
  href: string,
  label: string,
  className = "text-link",
  external = false,
) =>
  `<a class="${className}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}${external ? '<span class="sr-only"> (откроется в новой вкладке)</span>' : ""}${arrow}</a>`;
const button = (href: string, label: string, secondary = false) =>
  link(href, label, `button${secondary ? " button-secondary" : ""}`);
const date = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(new Date(`${value}T12:00:00+03:00`));
const intro = (eyebrow: string, title: string, text: string) =>
  `<section class="page-intro wrap"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lead">${text}</p></section>`;
const notice = (
  text = "Сведения предоставлены владельцем проекта. Актуальность набора, контактов, должности и стажа требует подтверждения руководителем.",
) =>
  `<aside class="content-note">${text} <a href="${path("sources")}#approval">Что проверяем ${arrow}</a></aside>`;
const sectionHead = (
  eyebrow: string,
  title: string,
  href?: string,
  label?: string,
) =>
  `<div class="section-heading"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>${href && label ? link(href, label) : ""}</div>`;
const navItems = [
  ["federation", "Федерация"],
  ["epee", "О фехтовании"],
  ["children", "Детская секция"],
  ["news", "Новости"],
  ["contacts", "Контакты"],
];
const header = `<a class="skip-link" href="#main">Перейти к содержанию</a>
  <div class="review-strip">Версия для согласования <a href="${path("sources")}#approval">Источники и подтверждение ${arrow}</a></div>
  <header class="site-header"><div class="header-inner wrap">
  <a class="brand" href="${path()}" aria-label="Федерация фехтования Псковской области — главная"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22"/><path d="m34 11-16 23m8 1L15 27m3 7-4 6"/></svg><span>ФЕХТОВАНИЕ<span class="brand-place">ПСКОВСКАЯ ОБЛАСТЬ</span></span></a>
  <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span>Меню</span><span class="menu-lines" aria-hidden="true"></span></button>
  <nav id="primary-nav" aria-label="Основная навигация">${navItems.map(([name, title]) => `<a href="${path(name)}"${page === name ? ' aria-current="page"' : ""}>${title}</a>`).join("")}${link(path("contacts") + "#enroll", "Записаться", "nav-cta")}</nav>
  </div></header>`;
const footer = `<footer class="site-footer"><div class="wrap"><div class="footer-top"><a class="footer-brand" href="${path()}">Точность.<br>Характер.<br><em>Фехтование.</em></a><div class="footer-nav"><div><p>Федерация</p>${[
  ["federation", "О нас"],
  ["coaches", "Тренеры"],
  ["news", "Новости"],
  ["competitions", "Соревнования"],
]
  .map(([n, t]) => `<a href="${path(n)}">${t}</a>`)
  .join("")}</div><div><p>На дорожку</p>${[
  ["epee", "Фехтование на шпагах"],
  ["children", "Детская секция"],
  ["gallery", "Медиагалерея"],
  ["documents", "Документы"],
]
  .map(([n, t]) => `<a href="${path(n)}">${t}</a>`)
  .join(
    "",
  )}</div><div><p>Связаться</p><a href="${path("contacts")}">Контакты и адрес</a><a href="tel:+79113582460">+7 911 358-24-60</a>${link(federation.vk, "Сообщество VK", "footer-vk", true)}<a href="${path("sources")}">Источники и материалы</a></div></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${federation.name}</span><span>Прототип · ожидает согласования руководством</span><a href="#top">Наверх ↑</a></div></div></footer>`;
const signup = () =>
  `<section class="signup-section"><div class="wrap signup-inner"><div><p class="eyebrow">Первый шаг — самый важный</p><h2>Всё начинается<br><em>с первого выпада.</em></h2><p>Познакомьтесь с тренером, задайте вопросы и узнайте, как прийти на первую тренировку.</p></div>${button(path("contacts") + "#enroll", "Связаться с тренером")}</div></section>`;
const coaches = (full = false) =>
  `<div class="coaches-grid">${federation.coaches.map((coach, i) => `<article class="coach"><div class="coach-portrait portrait-${i + 1}">${coach.photo ? `<img src="${asset(coach.photo)}" alt="${esc(coach.name)}" loading="lazy" width="560" height="560">` : `<span class="portrait-monogram" aria-hidden="true">${coach.initials}</span><span class="portrait-note">Портрет после согласования</span>`}<span class="portrait-number">0${i + 1}</span></div><div class="coach-details"><p class="eyebrow">Тренер · шпага</p><h3>${coach.displayName}</h3>${full ? `<p class="full-name">${coach.name}</p>` : ""}<ul class="qualifications">${coach.qualifications.map((q) => `<li>${q}</li>`).join("")}</ul>${full ? `<p class="experience">Указанный стаж: ${coach.reportedExperience}.</p>` : ""}${link("tel:" + coach.phoneHref, coach.phone, "text-link coach-phone")}</div></article>`).join("")}</div>`;
const sourceHubs = () =>
  `<div class="source-hubs"><a class="source-hub" href="${federation.vk}" target="_blank" rel="noopener noreferrer"><span class="hub-icon" aria-hidden="true">VK</span><div><p class="eyebrow">Сообщество</p><h3>Жизнь на дорожке</h3><p>Публикации федерации, тренировки и события — в VK.</p></div><span aria-hidden="true">↗</span><span class="sr-only">Откроется в новой вкладке</span></a><a class="source-hub" href="https://fencingpskov.nethouse.ru/articles" target="_blank" rel="noopener noreferrer"><span class="hub-icon" aria-hidden="true">↗</span><div><p class="eyebrow">Архив федерации</p><h3>Истории и соревнования</h3><p>Перейти к публикациям на существующем сайте.</p></div><span aria-hidden="true">↗</span><span class="sr-only">Откроется в новой вкладке</span></a></div>`;
const newsCards = (items: News[]) =>
  `<div class="news-grid">${items.map((n) => `<article class="news-card">${n.image ? `<img src="${asset(n.image)}" alt="${esc(n.imageAlt || n.title)}" loading="lazy" width="720" height="480">` : '<div class="news-art" aria-hidden="true">ÉPÉE</div>'}<div class="news-card-content"><div class="news-meta"><span>${esc(n.category)}</span><time datetime="${n.date}">${date(n.date)}</time></div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p>${link(n.sourceUrl, "Читать первоисточник", "text-link", true)}</div></article>`).join("")}</div>`;

function home() {
  return `<section class="hero"><div class="wrap hero-inner"><div class="hero-copy"><p class="eyebrow"><span class="live-dot" aria-hidden="true"></span>Псков · фехтование на шпагах</p><h1>Фехтование —<br>искусство<br><em>побеждать.</em></h1><p class="hero-description">Развиваем спорт, воспитываем характер,<br class="desktop-only"> открываем путь к победам.</p><div class="button-group">${button(path("contacts") + "#enroll", "Записаться на фехтование")}${link(path("federation"), "О федерации", "hero-link")}</div></div><div class="hero-art"><img src="${asset("images/epee.svg")}" alt="Авторская иллюстрация спортивной шпаги с чашеобразной гардой" width="1100" height="1100" fetchpriority="high"><span class="art-caption">Шпага · авторская иллюстрация</span></div><div class="hero-bottom"><span>От первого шага —<br>к собственному стилю.</span><a href="#intro" class="scroll-link">Откройте фехтование <span aria-hidden="true">↓</span></a><span class="hero-bottom-place">Псковская область<br>Спортивная школа «Лидер»</span></div></div></section>
 <section id="intro" class="section wrap intro-section"><div><p class="eyebrow">Больше, чем спорт</p><h2>Думать быстро.<br>Действовать точно.<br><em>Оставаться собой.</em></h2></div><div class="intro-text"><p class="lead">Фехтование — это диалог на языке движения. Здесь важны внимание, выдержка и умение принять решение за долю секунды.</p><p>Федерация фехтования Псковской области посвящена развитию фехтования на шпагах. Познакомьтесь с этим видом спорта и узнайте о занятиях в спортивной школе «Лидер».</p>${link(path("federation"), "Познакомиться с федерацией")}</div></section>
 <section class="epee-feature"><div class="wrap feature-inner"><div class="feature-visual"><img src="${asset("images/mask.svg")}" alt="Авторская иллюстрация фехтовальной маски" width="900" height="700" loading="lazy"><span class="figure-label">Экипировка · авторская иллюстрация</span></div><div class="feature-copy"><p class="eyebrow">Одно оружие. Тысячи решений.</p><h2>Шпага.<br><em>Точность в чистом виде.</em></h2><p>Весь корпус — цель. Только укол — результат. А между ними — тактика, дистанция и собственное решение.</p>${link(path("epee"), "Как устроено фехтование")}</div></div></section>
 <section class="section wrap children-feature"><div class="children-title"><p class="eyebrow">Детская секция · школа «Лидер»</p><h2>Большой путь<br>начинается<br><em>с любопытства.</em></h2></div><div class="children-info"><div class="age-display">7<span>—</span>14<span class="age-unit">лет</span></div><p class="lead">Возраст набора, указанный в информации о секции.</p><p>Тренировки учат владеть телом, замечать детали и справляться с волнением. А опытный тренер помогает двигаться в своём темпе.</p>${button(path("children"), "О занятиях для детей")}${notice("Актуальность набора и условия занятий уточняйте у тренеров. Расписание и стоимость на сайте не заявлены.")}</div></section>
 <section class="values-band"><div class="wrap values-grid"><div><span>01</span><h3>Внимание</h3><p>Замечать движение.<br>Читать ситуацию.</p></div><div><span>02</span><h3>Координация</h3><p>Чувствовать дистанцию.<br>Управлять телом.</p></div><div><span>03</span><h3>Характер</h3><p>Учиться на каждом бое.<br>Уважать соперника.</p></div></div></section>
 <section class="section wrap">${sectionHead("Те, кто помогает расти", "На дорожку —<br><em>с наставником.</em>", path("coaches"), "Все сведения о тренерах")}${coaches()}${notice("Имена, звания и телефоны — из задания владельца. Сведения и портреты ожидают финального подтверждения.")}</section>
 <section class="section section-border wrap">${sectionHead("Хроника федерации", "За пределами<br><em>поединка.</em>", path("news"), "Новости и первоисточники")}${news.length ? newsCards([...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)) : `<p class="section-description">Следите за событиями в сообществе федерации и архиве её публикаций. Проверенные новости появятся здесь после сверки первоисточников.</p>${sourceHubs()}`}</section>
 <section class="competition-banner wrap"><div><p class="eyebrow">Соревнования и достижения</p><h2>Каждый бой —<br><em>новый опыт.</em></h2></div><div><p>Календарь стартов, отчёты и результаты собраны в отдельном разделе. Здесь публикуются только подтверждённые события.</p>${link(path("competitions"), "Перейти к соревнованиям")}</div></section>${signup()}`;
}

function about() {
  return `${intro("Федерация · Псковская область", "Объединены<br><em>фехтованием.</em>", "Спорт, в котором точность движений встречается с ясностью мысли. Наш ориентир — помочь детям и взрослым открыть фехтование на шпагах.")}<section class="section wrap editorial"><div><p class="eyebrow">О нас</p><h2>Спорт с характером.<br><em>Люди с целью.</em></h2></div><div><p class="lead">${federation.legalName}.</p><p>Основное направление, указанное в материалах владельца, — фехтование на шпагах. Занятия проходят в специализированном зале в Пскове.</p><div class="leadership"><span class="eyebrow">Президент федерации</span><h3>${federation.president}</h3><p>Должность и актуальность сведений ожидают подтверждения.</p></div>${notice()}</div></section><section class="soft-section"><div class="section wrap">${sectionHead("Наш ориентир", "От знакомства со спортом<br><em>к уверенности в себе.</em>")}<div class="principles"><article><span>01 / Развитие</span><h3>Открывать фехтование</h3><p>Рассказывать о шпаге простым языком и помогать сделать первый шаг к занятиям.</p></article><article><span>02 / Поддержка</span><h3>Ценить путь спортсмена</h3><p>Внимание к технике, тактике и личному прогрессу — основа спортивного роста.</p></article><article><span>03 / Сообщество</span><h3>Быть вместе</h3><p>Создавать пространство для спортсменов, родителей, тренеров и организаторов.</p></article></div></div></section><section class="section wrap editorial"><div><p class="eyebrow">История и официальные сведения</p><h2>История заслуживает<br><em>точности.</em></h2></div><div><p class="lead">Хроника развития фехтования в Псковской области будет перенесена после сверки с архивом федерации.</p><p>Мы не добавляем неподтверждённые даты, достижения и сведения о членстве. До завершения проверки вы можете обратиться к указанным владельцем первоисточникам.</p><div class="link-list">${link("https://fencingpskov.nethouse.ru/about", "История на существующем сайте", "list-link", true)}${link("https://www.rusfencing.ru/fed_card.php?ID=607", "Карточка федерации на сайте ФФР", "list-link", true)}</div></div></section>${signup()}`;
}

function epee() {
  return `${intro("Понятно о спорте", "Искусство<br><em>точного укола.</em>", "Шпага — колющее спортивное оружие. В поединке важно не только попасть в цель, но и выбрать момент, почувствовать дистанцию и понять соперника.")}<section class="epee-explainer wrap"><div class="weapon-display"><img src="${asset("images/epee.svg")}" alt="Иллюстрация шпаги: тонкий клинок, чашеобразная гарда, рукоять" width="1100" height="1100"><span class="figure-label">Авторская иллюстрация · не фотография</span></div><div><p class="eyebrow">Три вещи, которые стоит знать</p><div class="rule-row"><span>01</span><div><h2>Всё тело — цель</h2><p>В шпаге засчитываются уколы в любую часть тела соперника, включая руки и ноги.</p></div></div><div class="rule-row"><span>02</span><div><h2>Только укол</h2><p>Удар лезвием не приносит очка. Укол фиксируется электрической системой.</p></div></div><div class="rule-row"><span>03</span><div><h2>Без приоритета атаки</h2><p>В отличие от рапиры и сабли, в шпаге нет права преимущественной атаки. При одновременных уколах очко может получить каждый.</p></div></div></div></section><section class="soft-section"><div class="section wrap">${sectionHead("На дорожке", "Дистанция, время<br><em>и один точный момент.</em>")}<img class="piste-illustration" src="${asset("images/piste.svg")}" alt="Схема 14-метровой фехтовальной дорожки с линиями начала боя" loading="lazy" width="1200" height="550"><div class="three-columns"><div><h3>Начало</h3><p>Спортсмены приветствуют друг друга и судью, надевают маски и занимают позиции. Бой начинается по команде судьи.</p></div><div><h3>Поединок</h3><p>В типичном взрослом формате бои в группах идут до 5 уколов, в прямом выбывании — до 15. Для детей формат зависит от регламента.</p></div><div><h3>Решение</h3><p>Судья следит за временем, счётом и правилами. Сигнал аппарата помогает определить укол, но решение остаётся за судьёй.</p></div></div></div></section><section class="section wrap">${sectionHead("Три вида спортивного оружия", "В чём<br><em>разница?</em>")}<div class="table-scroll" tabindex="0" role="region" aria-label="Сравнение шпаги, рапиры и сабли"><table><caption class="sr-only">Основные различия видов оружия</caption><thead><tr><th scope="col">Оружие</th><th scope="col">Что засчитывается</th><th scope="col">Поражаемая поверхность</th><th scope="col">Приоритет атаки</th></tr></thead><tbody><tr class="highlight-row"><th scope="row">Шпага · наше направление</th><td>Укол</td><td>Всё тело</td><td>Нет</td></tr><tr><th scope="row">Рапира</th><td>Укол</td><td>Туловище, включая проводящий нагрудник маски</td><td>Есть</td></tr><tr><th scope="row">Сабля</th><td>Укол и удар</td><td>Верхняя часть тела, кроме кистей</td><td>Есть</td></tr></tbody></table></div><p class="content-note">Это вводное объяснение. Для участия в соревнованиях изучите актуальные правила и регламент конкретного старта. ${link("https://fie.org/fie/documents/rules", "Правила FIE", "inline-link", true)}</p></section><section class="section section-border wrap editorial"><div><p class="eyebrow">Для родителей</p><h2>Движение.<br>Внимание.<br><em>Самостоятельность.</em></h2></div><div><p class="lead">Фехтование сочетает физическую активность с решением тактических задач.</p><p>Тренировки направлены на развитие координации, реакции и навыка управлять вниманием. Умение спокойно пережить проигрыш и уважительно встретить победу — тоже часть спортивного опыта.</p><p>Экипировка, техника и соблюдение команд тренера важны на каждом занятии. Допуск и подходящую нагрузку обсуждают с тренером и медицинским специалистом.</p>${link(path("children"), "Узнать о детской секции")}</div></section>${signup()}`;
}

function children() {
  return `${intro("Детская секция · спортивная школа «Лидер»", "Первый выпад.<br><em>Большое начало.</em>", "Знакомство со шпагой начинается с простого: шага, внимания и любопытства. Дальше — новые движения, первые поединки и собственный спортивный путь.")}<section class="section wrap child-details"><div class="age-panel"><p class="eyebrow">Возраст, указанный в наборе</p><div class="age-display">7<span>—</span>14<span class="age-unit">лет</span></div><p>Актуальность набора<br>уточняйте у тренеров.</p></div><div><h2>Место, где растёт<br><em>уверенность.</em></h2><p class="lead">Фехтование на шпагах в специализированном зале на стадионе «Машиностроитель».</p><p>Начальные занятия знакомят с основными движениями, стойкой и безопасной работой с оружием. Условия обучения, распределение по группам и необходимую экипировку расскажет тренер.</p>${button(path("contacts") + "#enroll", "Узнать о наборе")}${notice("Объявление о наборе детей 7–14 лет предоставлено владельцем. Текущий набор, стоимость, расписание и условия приёма ещё не подтверждены.")}</div></section><section class="soft-section"><div class="section wrap">${sectionHead("Как начать", "Три простых шага<br><em>к первой тренировке.</em>")}<ol class="steps"><li><span>01</span><h3>Свяжитесь с тренером</h3><p>Расскажите возраст ребёнка и спросите, открыт ли набор в подходящую группу.</p></li><li><span>02</span><h3>Обсудите условия</h3><p>Уточните расписание, стоимость, медицинские документы и необходимую экипировку.</p></li><li><span>03</span><h3>Договоритесь о визите</h3><p>Тренер подскажет, когда прийти и что взять с собой. Не покупайте оружие до консультации.</p></li></ol></div></section><section class="section wrap">${sectionHead("Наставники", "Рядом на каждом<br><em>этапе.</em>", path("coaches"), "О тренерах")}${coaches()}</section><section class="section section-border wrap editorial"><div><p class="eyebrow">Вопросы родителей</p><h2>Перед первым<br><em>занятием.</em></h2></div><div class="faq"><details><summary>Нужна ли специальная подготовка?</summary><p>О предыдущем спортивном опыте и подходящей группе лучше поговорить с тренером. Требования к поступлению и допуску устанавливает спортивная школа.</p></details><details><summary>Нужно сразу покупать шпагу и форму?</summary><p>Сначала проконсультируйтесь с тренером. Он объяснит, какая экипировка нужна, что используется на начальных занятиях и как подобрать размер.</p></details><details><summary>Какое расписание и стоимость занятий?</summary><p>Подтверждённых данных пока нет. Уточните актуальные условия по телефону у тренеров.</p></details><details><summary>Где проходят тренировки?</summary><p>${federation.trainingVenue}. Адрес занятий: ${federation.trainingAddress}. Это адрес тренировочного зала, а не юридический адрес федерации.</p></details></div></section>${signup()}`;
}

function coachesPage() {
  return `${intro("Тренеры", "Опыт, которым<br><em>делятся.</em>", "За каждым точным движением — работа спортсмена и внимание наставника. Познакомьтесь с тренерами отделения фехтования.")}<section class="wrap section coaches-page">${coaches(true)}${notice("Все сведения ниже основаны на задании владельца. Стаж не пересчитан автоматически: даты его отсчёта неизвестны. Фотографии не опубликованы до получения разрешений.")}</section>${signup()}`;
}

function newsPage() {
  const categories = [...new Set(news.map((n) => n.category))];
  return `${intro("Новости", "Жизнь федерации.<br><em>На дорожке и рядом.</em>", "Тренировки, старты и события сообщества. В этом разделе размещаются публикации с датами и ссылками на первоисточники.")}<section class="section wrap">${news.length ? `<div class="filter-bar" role="group" aria-label="Категории новостей"><button class="filter-button active" type="button" data-category="all" aria-pressed="true">Все публикации</button>${categories.map((c) => `<button class="filter-button" type="button" data-category="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("")}</div><div id="news-results">${newsCards([...news].sort((a, b) => b.date.localeCompare(a.date)))}</div>` : `<div class="honest-state"><span class="state-symbol" aria-hidden="true">↗</span><div><p class="eyebrow">Публикации — в первоисточниках</p><h2>Настоящие истории.<br><em>Проверенные факты.</em></h2><p>Архив ещё не перенесён: источники недоступны из среды разработки. До сверки дат и материалов читайте публикации на страницах федерации.</p></div></div>${sourceHubs()}`}</section><section class="section section-border wrap editorial"><div><p class="eyebrow">Редакционный принцип</p><h2>Сначала источник.<br><em>Потом публикация.</em></h2></div><div><p class="lead">Каждая новость должна иметь проверяемый первоисточник.</p><p>Для фотографий дополнительно проверяются авторство, право на размещение и, при необходимости, согласие на публикацию изображений несовершеннолетних.</p>${link(path("sources"), "Источники и статус материалов")}</div></section>${signup()}`;
}

function competitionsPage() {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
  }).format(new Date());
  const upcoming = events
    .filter((e) => (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => (e.endDate || e.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const rows = (items: Event[], isPast: boolean) =>
    items.length
      ? `<div class="event-list">${items.map((e) => `<article class="event-row"><time datetime="${e.date}">${date(e.date)}${e.endDate && e.endDate !== e.date ? ` — ${date(e.endDate)}` : ""}</time><div><p class="eyebrow">${isPast ? "Прошедшее событие" : "Предстоящий старт"} · ${esc(e.location)}</p><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p></div>${link(e.sourceUrl, isPast ? "Отчёт и результаты" : "Информация о старте", "text-link", true)}</article>`).join("")}</div>`
      : `<p class="empty-line">${isPast ? "Отчёты и результаты появятся после проверки архивных публикаций. Неподтверждённые достижения не размещаются." : "Подтверждённых предстоящих стартов пока не добавлено. Уточняйте календарь у тренера и в сообществе федерации."}</p>`;
  return `${intro("Соревнования и достижения", "Проверять себя.<br><em>Расти с каждым боем.</em>", "Календарь, отчёты и результаты. Прошедшие события отделены от предстоящих; для каждого опубликованного старта указывается источник.")}<section class="section wrap">${sectionHead("Календарь", "Впереди —<br><em>новые встречи.</em>")}${rows(upcoming, false)}</section><section class="soft-section"><div class="section wrap">${sectionHead("Архив", "Опыт, который<br><em>остаётся.</em>")}${rows(past, true)}<div class="link-list">${link("https://fencingpskov.nethouse.ru/articles", "Архив новостей федерации", "list-link", true)}${link(federation.vk, "Публикации и результаты в VK", "list-link", true)}</div></div></section><section class="section wrap editorial"><div><p class="eyebrow">Перед стартом</p><h2>Уточните<br><em>главное.</em></h2></div><div><p>Возрастную категорию, формат соревнования, сроки заявки, документы для допуска и требования к экипировке нужно сверять с положением конкретного турнира и тренером.</p>${link(path("documents"), "Правила и документы")}</div></section>${signup()}`;
}

function galleryPage() {
  return `${intro("Медиагалерея", "Моменты, в которых<br><em>живёт спорт.</em>", "Тренировки, поединки и события сообщества. Фотографии реальных спортсменов размещаются только после проверки авторства и необходимых разрешений.")}<section class="section wrap">${media.length ? `<div class="gallery-grid">${media.map((m) => `<figure>${m.type === "video" ? `<video controls preload="none"${m.poster ? ` poster="${asset(m.poster)}"` : ""} aria-label="${esc(m.alt)}"><source src="${asset(m.src)}">Ваш браузер не поддерживает видео.</video>` : `<button class="gallery-open" type="button" data-media="${esc(m.id)}" aria-label="Увеличить: ${esc(m.alt)}"><img src="${asset(m.src)}" alt="${esc(m.alt)}" loading="lazy" width="1000" height="700"></button>`}<figcaption>${esc(m.caption)}<small>${esc(m.author)} · ${esc(m.license)} · ${link(m.sourceUrl, "Источник", "inline-link", true)}</small></figcaption></figure>`).join("")}</div><dialog id="lightbox"><button type="button" class="lightbox-close" aria-label="Закрыть изображение">×</button><img alt=""><p></p></dialog>` : `<div class="honest-state"><span class="state-symbol" aria-hidden="true">◯</span><div><p class="eyebrow">Фотоархив ожидает согласования</p><h2>Люди важнее<br><em>случайного кадра.</em></h2><p>Публичная фотография не означает разрешение на повторную публикацию. Пока собственные материалы не согласованы, мы не выдаём изображения других клубов за фотографии федерации.</p>${link(federation.vk, "Посмотреть материалы в VK", "text-link", true)}</div></div>`}</section><section class="soft-section"><div class="section wrap">${sectionHead("Визуальный словарь", "Познакомьтесь<br><em>с деталями.</em>")}<p class="section-description">Оригинальные иллюстрации созданы для этого сайта. Они не изображают реальных спортсменов и не заменяют фотоархив федерации.</p><div class="illustration-gallery"><figure><div class="dark-figure"><img src="${asset("images/epee.svg")}" alt="Авторская иллюстрация спортивной шпаги" width="1100" height="1100" loading="lazy"></div><figcaption><span>01 / Шпага</span>Клинок, гарда и рукоять.</figcaption></figure><figure><div class="light-figure"><img src="${asset("images/mask.svg")}" alt="Авторская иллюстрация защитной маски" width="900" height="700" loading="lazy"></div><figcaption><span>02 / Маска</span>Часть защитной экипировки.</figcaption></figure></div></div></section>${signup()}`;
}

function documentsPage() {
  return `${intro("Документы", "Правила.<br><em>Порядок. Уважение.</em>", "Официальные источники и материалы, которые помогают ориентироваться в спортивной жизни.")}<section class="section wrap"><div class="document-list">${[
    [
      "01",
      "Международные правила фехтования",
      "Правила FIE. Проверяйте актуальную редакцию и применимый регламент.",
      "https://fie.org/fie/documents/rules",
    ],
    [
      "02",
      "Федерация фехтования России",
      "Официальный сайт: документы, соревнования и информация о фехтовании.",
      "https://www.rusfencing.ru/",
    ],
    [
      "03",
      "Карточка региональной федерации",
      "Официальная карточка, указанная владельцем проекта.",
      "https://www.rusfencing.ru/fed_card.php?ID=607",
    ],
    [
      "04",
      "Спортивная школа «Лидер»",
      "Карточка организации на сайте Федерации фехтования России.",
      "https://www.rusfencing.ru/org_card.php?ID=202546",
    ],
  ]
    .map(
      ([number, title, text, url]) =>
        `<article class="document-row"><span class="document-number">${number}</span><div><h2>${title}</h2><p>${text}</p></div>${link(url, "Открыть источник", "text-link", true)}</article>`,
    )
    .join(
      "",
    )}</div>${notice("Ссылки ведут на внешние официальные ресурсы. Содержимое этих страниц ещё не проверено из среды разработки.")}</section><section class="soft-section"><div class="section wrap editorial"><div><p class="eyebrow">Материалы федерации</p><h2>Устав и положения —<br><em>после проверки.</em></h2></div><div><p class="lead">Локальные копии устава и положений пока не опубликованы.</p><p>Для размещения нужны актуальные редакции, подтверждение руководства и разрешение на распространение. По конкретному соревнованию запросите положение у организатора или тренера.</p>${link(path("contacts"), "Связаться с федерацией")}</div></div></section>`;
}

function contactsPage() {
  return `${intro("Контакты", "До встречи<br><em>на дорожке.</em>", "Первый шаг — разговор с тренером. Уточните актуальный набор и договоритесь о знакомстве с секцией.")}<section id="enroll" class="section wrap contact-layout"><div><p class="eyebrow">Записаться на фехтование</p><h2>Выберите тренера.<br><em>Задайте вопросы.</em></h2><p>Расскажите возраст ребёнка и опыт занятий. Уточните набор, расписание, стоимость и список необходимых документов.</p><div class="contact-phones">${federation.coaches.map((c) => `<article><h3>${c.name}</h3>${link("tel:" + c.phoneHref, c.phone, "phone-link")}</article>`).join("")}</div>${notice("Телефоны предоставлены владельцем и ожидают подтверждения актуальности. Если звонок не проходит, используйте сообщество VK.")}${link(federation.vk, "Написать в сообщество VK", "button button-secondary", true)}</div><aside class="address-panel"><p class="eyebrow">Адрес занятий</p><h2>Псков.<br>Кузнецкая, 25.</h2><p>${federation.trainingVenue}.</p><div class="address-graphic" aria-hidden="true"><div class="street street-a"></div><div class="street street-b"></div><div class="map-pin"><span>25</span></div><span class="map-label">Схема · не карта местности</span></div>${link("https://yandex.ru/maps/?text=" + encodeURIComponent(federation.trainingAddress), "Найти адрес на карте", "text-link", true)}<p class="address-note">Это адрес тренировочного зала. Юридический адрес федерации здесь не указан.</p></aside></section><section class="soft-section"><div class="section wrap editorial"><div><p class="eyebrow">Остаёмся на связи</p><h2>Больше информации —<br><em>в первоисточниках.</em></h2></div><div class="link-list">${link(federation.vk, "Сообщество федерации в VK", "list-link", true)}${link(federation.oldWebsite, "Существующий сайт федерации", "list-link", true)}${link("https://www.rusfencing.ru/fed_card.php?ID=607", "Карточка на сайте ФФР", "list-link", true)}</div></div></section>`;
}

function sourcesPage() {
  const statusLabels: Record<string, string> = {
    "owner-provided": "Из задания владельца",
    blocked: "Проверка заблокирована",
    reference: "Ссылка для сверки",
    original: "Авторская работа",
    licensed: "Открытая лицензия",
    verified: "Проверено",
  };
  return `${intro("Прозрачность материалов", "У каждого факта —<br><em>свой источник.</em>", "Сайт находится на согласовании. Здесь указаны происхождение информации, ограничения проверки и материалы, необходимые для завершения официальной версии.")}<section id="approval" class="section wrap editorial"><div><p class="eyebrow">На подтверждение руководителю</p><h2>До официального<br><em>представления.</em></h2></div><div><ul class="approval-list"><li>Актуальность набора детей 7–14 лет, условия приёма, расписание и стоимость.</li><li>Имена, звания, категории, телефоны и стаж тренеров с датой отсчёта.</li><li>Название организации, президент и адрес тренировочного зала.</li><li>История, достижения, даты и результаты соревнований.</li><li>Актуальные редакции устава и положений, право на размещение.</li><li>Фотографии и видео: авторство, разрешение на повторную публикацию, согласия на изображения несовершеннолетних.</li><li>Окончательное утверждение текстов, оформления и статуса официального сайта.</li></ul><p>Материалы владельца использованы как исходные данные, а не как результат независимой проверки. Неподтверждённые новости и достижения не добавлены.</p></div></section><section class="soft-section"><div class="section wrap">${sectionHead("Реестр", "Источники<br><em>и права.</em>")}<div class="source-list">${sources.map((s) => `<article class="source-row"><div><span class="source-status">${statusLabels[s.status] || esc(s.status)}</span><h3>${s.title}</h3><p>${s.notes}</p></div>${s.url ? link(s.url, "Первоисточник", "text-link", true) : '<span class="source-local">Локальный материал</span>'}</article>`).join("")}</div></div></section>`;
}

const renderers: Record<string, () => string> = {
  index: home,
  federation: about,
  epee,
  children,
  coaches: coachesPage,
  news: newsPage,
  competitions: competitionsPage,
  gallery: galleryPage,
  documents: documentsPage,
  contacts: contactsPage,
  sources: sourcesPage,
};
document.querySelector<HTMLDivElement>("#app")!.innerHTML =
  `${header}<main id="main" tabindex="-1">${(renderers[page] || home)()}</main>${footer}`;

const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle")!;
const nav = document.querySelector<HTMLElement>("#primary-nav")!;
const setMenu = (open: boolean) => {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
};
toggle.addEventListener("click", () =>
  setMenu(toggle.getAttribute("aria-expanded") !== "true"),
);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    toggle.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (
    !nav.contains(event.target as Node) &&
    !toggle.contains(event.target as Node)
  )
    setMenu(false);
});
nav
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", () => setMenu(false)));
window.matchMedia("(min-width: 1051px)").addEventListener("change", (e) => {
  if (e.matches) setMenu(false);
});

document.querySelectorAll<HTMLButtonElement>("[data-category]").forEach((b) =>
  b.addEventListener("click", () => {
    document
      .querySelectorAll<HTMLButtonElement>("[data-category]")
      .forEach((other) => {
        const active = other === b;
        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", String(active));
      });
    const filtered =
      b.dataset.category === "all"
        ? news
        : news.filter((n) => n.category === b.dataset.category);
    document.querySelector("#news-results")!.innerHTML = newsCards(
      [...filtered].sort((a, c) => c.date.localeCompare(a.date)),
    );
  }),
);
const dialog = document.querySelector<HTMLDialogElement>("#lightbox");
if (dialog) {
  document.querySelectorAll<HTMLButtonElement>("[data-media]").forEach((b) =>
    b.addEventListener("click", () => {
      const m = media.find((item) => item.id === b.dataset.media)!;
      const img = dialog.querySelector("img")!;
      img.src = asset(m.src);
      img.alt = m.alt;
      dialog.querySelector("p")!.textContent = m.caption;
      dialog.showModal();
    }),
  );
  dialog
    .querySelector("button")!
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}
if (
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  "IntersectionObserver" in window
) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.07 },
  );
  document
    .querySelectorAll(
      ".section-heading, .intro-section, .principles, .values-grid, .signup-inner",
    )
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
}
