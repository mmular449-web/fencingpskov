import "@fontsource/golos-text/cyrillic-400.css";
import "@fontsource/golos-text/cyrillic-500.css";
import "@fontsource/golos-text/cyrillic-600.css";
import "@fontsource/golos-text/latin-400.css";
import "@fontsource/golos-text/latin-500.css";
import "@fontsource/golos-text/latin-600.css";
import "./style.css";
import { initMotion } from "./motion";
import { productShowcase, initShowcases } from "./three/showcase";
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
  width: number;
  height: number;
  variants: {src: string; width: number}[];
  licenseUrl: string;
  changes: string;
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
const arrow =
  '<span class="link-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
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
const photo = (id: string, className = "", priority = false, sizes = "100vw") => {
  const m = media.find((item) => item.id === id)!;
  return `<img class="${className}" src="${asset(m.src)}" srcset="${m.variants.map(v => `${asset(v.src)} ${v.width}w`).join(", ")}" sizes="${sizes}" width="${m.width}" height="${m.height}" alt="${esc(m.alt)}" ${priority ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async">`;
};
const credit = (id: string, short = false) => {
  const m = media.find((item) => item.id === id)!;
  return `<figcaption class="photo-credit">${short ? "" : `<span>${esc(m.caption)}</span>`}<span>© ${esc(m.author)} · <a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.license)}</a> · <a href="${esc(m.sourceUrl)}" target="_blank" rel="noopener noreferrer">Оригинал</a>${short ? "" : " · Адаптивный кроп, WebP."}</span></figcaption>`;
};
const photoRibbon = () => `<section class="photo-ribbon"><figure class="media-reveal">${photo("duel")}${credit("duel")}</figure><div class="wrap ribbon-copy"><p class="eyebrow">На дорожке</p><h2>Внимание становится<br><span>движением.</span></h2>${link(path("gallery"), "Смотреть фотогалерею")}</div></section>`;
const visualGallery = () => `<section class="visual-gallery section"><div class="wrap">${sectionHead("В объективе · мировая шпага", "Почувствовать<br><span>момент.</span>", path("gallery"), "Открыть галерею")}<p class="gallery-context">Взрослые международные соревнования. Фотографии о нашем виде спорта; кадры федерации добавим после согласования.</p></div><div class="photo-rail" tabindex="0" role="region" aria-label="Фотолента шпажного фехтования">${["duel", "focus", "equipment", "distance"].map(id => `<figure class="rail-frame">${photo(id, "", false, "(max-width: 760px) 86vw, 65vw")}${credit(id)}</figure>`).join("")}</div><div class="wrap rail-controls"><p class="rail-instruction">Листайте, чтобы увидеть больше</p><div><button type="button" class="rail-button" data-rail="-1" aria-label="Предыдущая фотография">←</button><span class="rail-count" aria-live="polite">1 / 4</span><button type="button" class="rail-button" data-rail="1" aria-label="Следующая фотография">→</button></div></div></section>`;
const navItems = [
  ["federation", "Федерация"],
  ["epee", "О фехтовании"],
  ["children", "Детская секция"],
  ["news", "Новости"],
  ["contacts", "Контакты"],
];
const header = `<a class="skip-link" href="#main">Перейти к содержанию</a>
<header class="site-header"><div class="header-inner wrap"><a class="brand" href="${path()}"><span class="brand-mark">ФФ</span><span>Фехтование<span class="brand-place">Псковская область</span></span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span>Меню</span><span class="menu-lines" aria-hidden="true"></span></button><nav id="primary-nav" aria-label="Основная навигация">${navItems.map(([name, title]) => `<a href="${path(name)}"${page === name ? ' aria-current="page"' : ""}>${title}</a>`).join("")}${link(path("contacts") + "#enroll", "Начать заниматься", "nav-cta")}</nav></div></header>
<div class="review-strip">Версия для согласования <a href="${path("sources")}#approval">Подробнее ${arrow}</a></div>`;
const footer = `<footer class="site-footer"><div class="wrap"><div class="footer-top"><a class="footer-brand" href="${path()}">Точность.<br><span>В движении.</span></a><div class="footer-nav"><div><p>Федерация</p>${[
  ["federation", "О федерации"],
  ["coaches", "Тренеры"],
  ["news", "Новости"],
  ["competitions", "Соревнования"],
]
  .map(([n, t]) => `<a href="${path(n)}">${t}</a>`)
  .join("")}</div><div><p>Фехтование</p>${[
  ["epee", "Почему шпага"],
  ["children", "Детская секция"],
  ["gallery", "Галерея"],
  ["documents", "Документы"],
]
  .map(([n, t]) => `<a href="${path(n)}">${t}</a>`)
  .join(
    "",
  )}</div><div><p>Связаться</p><a href="${path("contacts")}">Адрес и контакты</a><a href="tel:+79113582460">+7 911 358-24-60</a>${link(federation.vk, "Сообщество VK", "footer-vk", true)}<a href="${path("sources")}">Источники и согласование</a></div></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${federation.name}</span><span>Версия для согласования руководством</span><a href="#top">Наверх ↑</a></div></div></footer>`;
const signup = () =>
  `<section class="signup-section"><div class="wrap signup-inner"><p class="eyebrow">Ваш первый шаг</p><h2>Большое начинается<br><span>с одного движения.</span></h2><p>Поговорите с тренером.<br>Остальное начнётся на дорожке.</p>${button(path("contacts") + "#enroll", "Начать заниматься")}<a class="quiet-link" href="${path("children")}">Подробнее о детской секции →</a></div></section>`;
const coaches = (full = false) =>
  `<div class="coaches-list">${federation.coaches.map((c, i) => `<article class="coach"><div class="coach-heading"><p class="eyebrow">0${i + 1} / Тренер · шпага</p><h3>${c.displayName.split(" ")[0]}<br>${c.displayName.split(" ")[1]}<span class="coach-patronymic">${c.name}</span></h3></div><div class="coach-details"><ul class="qualifications">${c.qualifications.map((q) => `<li>${q}</li>`).join("")}</ul>${full ? `<p class="experience">Указанный стаж: ${c.reportedExperience}.</p>` : ""}${link("tel:" + c.phoneHref, c.phone, "text-link coach-phone")}</div></article>`).join("")}</div>`;
const sourceHubs = () =>
  `<div class="source-hubs">${link(federation.vk, "Федерация в VK", "source-hub", true)}${link("https://fencingpskov.nethouse.ru/articles", "Архив публикаций", "source-hub", true)}</div>`;
const newsCards = (items: News[]) =>
  `<div class="news-grid">${items.map((n, i) => `<article class="news-card">${n.image ? `<img src="${asset(n.image)}" alt="${esc(n.imageAlt || n.title)}" loading="lazy" width="1200" height="800">` : ""}<div class="news-card-content"><div class="news-meta"><span>${esc(n.category)}</span><time datetime="${n.date}">${date(n.date)}</time></div><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p>${link(n.sourceUrl, "Читать публикацию", "text-link", true)}</div></article>`).join("")}</div>`;

function home() {
  return `<section class="hero cinema-hero" data-motion-scene="hero"><figure class="hero-media">${photo("precision", "hero-photo", true)}${credit("precision", true)}</figure><div class="hero-shade" aria-hidden="true"></div><div class="hero-inner wrap"><p class="eyebrow hero-enter">Псков · Фехтование на шпагах</p><h1 class="hero-enter">Фехтование.<br><span>Искусство точности.</span></h1><p class="hero-description hero-enter">Федерация фехтования Псковской области</p><div class="hero-bottom"><div class="button-group hero-enter">${button(path("contacts") + "#enroll", "Начать заниматься")}${button(path("federation"), "О федерации", true)}</div><a class="scroll-link" href="#why"><span>В движении — всё</span><span aria-hidden="true">↓</span></a></div><span class="hero-edition" aria-hidden="true">01 / ИСКУССТВО ТОЧНОСТИ</span></div></section>
 <section id="why" class="section wrap opening"><p class="eyebrow reveal">Почему шпага</p><h2 class="display-heading reveal">Доли секунды.<br><span>Одно решение.</span></h2><p class="opening-description reveal">Увидеть возможность. Почувствовать дистанцию.<br class="desktop-only"> Сделать точный укол. Здесь движение<br class="desktop-only"> и мысль становятся одним целым.</p>${link(path("epee"), "Открыть фехтование")}</section>
 <section class="duel-scene" data-motion-scene="duel" aria-label="Скорость и тактика шпажного боя"><div class="duel-pin"><figure class="duel-media">${photo("duel", "duel-photo")}${credit("duel", true)}</figure><div class="duel-shade" aria-hidden="true"></div><div class="duel-content wrap"><p class="eyebrow">02 / Почувствовать дистанцию</p><h2>Быстрее.<br><span>Точнее.</span></h2><div class="duel-notes"><div class="duel-note note-first"><p class="chapter-number">01 / Скорость</p><h3>Увидеть мгновение.</h3><p>Реакция начинается с внимания. Замечать намерение соперника и действовать в нужный момент.</p></div><div class="duel-note note-second"><p class="chapter-number">02 / Тактика</p><h3>Найти свой ответ.</h3><p>Атака, защита, контратака. Каждый шаг меняет дистанцию. Каждое решение — рисунок боя.</p></div></div><div class="scene-progress" aria-hidden="true"><span></span></div></div></div></section>
 ${productShowcase("epee")}
 <section class="beginnings section"><div class="wrap beginnings-layout"><div class="beginnings-copy"><p class="eyebrow reveal">Детская секция · школа «Лидер»</p><h2 class="reveal">Характер начинается<br><span>с первого шага.</span></h2><p class="lead reveal">Внимание к движению.<br>Уверенность в себе.<br>Свой путь в спорте.</p><div class="begin-age reveal"><strong>7–14</strong><span>лет · возраст,<br>указанный в наборе</span></div><p>Фехтование на шпагах в Пскове.<br>Зал на стадионе «Машиностроитель».</p>${button(path("children"), "О занятиях для детей")}<p class="begin-footnote">Актуальность набора и условия занятий уточняйте у тренеров.</p></div><figure class="beginnings-photo media-reveal">${photo("focus", "", false, "(max-width: 760px) 100vw, 50vw")}${credit("focus")}</figure></div></section>
 <section class="section wrap mentors-scene">${sectionHead("Наставники", "За каждым движением —<br><span>человек, который учит.</span>", path("coaches"), "О тренерах")}<div class="mentor-intro"><span class="mentor-word" aria-hidden="true">Опыт.</span><p>Увидеть потенциал.<br>Объяснить точнее.<br>Поддержать вовремя.</p></div>${coaches()}${notice("Звания, стаж и контакты сверены с сайтом федерации. Актуальность данных требует финального подтверждения руководителем.")}</section>
 <section class="heritage-section"><div class="wrap heritage-layout"><p class="eyebrow">Фехтование в Пскове</p><div class="heritage-year">1973<span>Начало истории.</span></div><div class="heritage-copy"><h2>Традиция.<br><span>С продолжением.</span></h2><p>С клуба «Мушкетёр», основанного Сергеем Любимовым, началась история спортивного фехтования на Псковщине. Сегодня её продолжают новые поколения спортсменов.</p>${link(path("federation"), "История федерации")}</div></div></section>
 ${visualGallery()}
 <section class="section wrap federation-news">${sectionHead("Жизнь федерации", "Путь к победам.<br><span>События Пскова.</span>", path("news"), "Все публикации")}${newsCards([...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3))}</section>
 <section class="competition-strip wrap"><p class="eyebrow">Соревнования</p><h2>Встречи, которые<br><span>делают сильнее.</span></h2><div><p>Даты, положения и подтверждённые результаты.<br>Всё важное о стартах — в одном разделе.</p>${link(path("competitions"), "Календарь и результаты")}</div></section>${signup()}`;
}
function about() {
  return `${intro("Федерация · Псковская область", "У спорта есть история.<br><span>У истории — продолжение.</span>", "Фехтование на Псковщине. Люди, которые открывают этот спорт новым поколениям.")}<section class="section wrap editorial"><div><p class="eyebrow">Федерация</p><h2>Точность в движении.<br><span>Уважение в основе.</span></h2></div><div><p class="lead">${federation.legalName}.</p><p>Наше направление — фехтование на шпагах. Основной тренировочный процесс организован на базе отделения фехтования спортивной школы «Лидер».</p><div class="leadership"><p class="eyebrow">Президент федерации</p><h3>${federation.president}</h3><p>Сведения сверены с официальной карточкой Федерации фехтования России.</p></div>${link("https://www.rusfencing.ru/fed_card.php?ID=607", "Карточка федерации на сайте ФФР", "text-link", true)}</div></section><section class="soft-section"><div class="section wrap">${sectionHead("История", "Началось с клуба.<br><span>Стало делом поколений.</span>")}<div class="timeline"><article><span>1973</span><div><h3>«Мушкетёр»</h3><p>Сергей Геннадьевич Любимов создаёт подростковый клуб на базе Псковского завода ТЭСО.</p></div></article><article><span>1985</span><div><h3>Новый этап</h3><p>Клуб получает статус детско-юношеской спортивной школы по фехтованию.</p></div></article><article><span>2010</span><div><h3>Преемственность</h3><p>Федерацию возглавляет Александр Владимирович Муляр — воспитанник школы «Мушкетёр».</p></div></article></div>${link("https://fencingpskov.nethouse.ru/about", "История в первоисточнике", "text-link", true)}</div></section><section class="section wrap editorial"><div><p class="eyebrow">Сегодня</p><h2>На дорожку —<br><span>с интересом.</span></h2></div><div><p class="lead">Занятия в специализированном зале на стадионе «Машиностроитель» в Пскове.</p><p>Для родителей, спортсменов и тренеров мы собрали сведения о секции, правилах шпаги, соревнованиях и способах связи.</p>${link(path("children"), "Познакомиться с секцией", "text-link")}</div></section>${signup()}`;
}
function epee() {
  return `${intro("Почему шпага", "Весь мир сужается<br><span>до одного момента.</span>", "Внимание. Дистанция. Точный укол. Фехтование на шпагах — это спорт, в котором мысль становится движением.")}<figure class="subpage-panorama media-reveal">${photo("distance")}${credit("distance")}</figure><section class="section wrap rules-feature"><div class="rule-primary"><p class="eyebrow">Правило, которое меняет всё</p><h2>Всё тело — цель.<br><span>Каждый момент — выбор.</span></h2></div><div class="rules-list"><article><span>01</span><h3>Только укол.</h3><p>Шпага — колющее оружие. Очко приносит укол, который фиксирует электрическая система.</p></article><article><span>02</span><h3>Без приоритета.</h3><p>В шпаге нет права преимущественной атаки. При одновременных уколах очко может получить каждый спортсмен.</p></article><article><span>03</span><h3>Дистанция решает.</h3><p>Дорожка длиной 14 метров. Умение управлять расстоянием не менее важно, чем скорость руки.</p></article></div></section>${productShowcase("epee")}<section class="dark-section"><div class="section wrap"><p class="eyebrow">Как проходит бой</p><h2 class="display-heading">Думать.<br>Двигаться.<br><span>Действовать.</span></h2><div class="three-columns"><article><h3>Начало</h3><p>Приветствие соперника и судьи. Маска, позиция на дорожке и команда к началу боя.</p></article><article><h3>Поединок</h3><p>В типичном взрослом формате групповые бои идут до 5 уколов, прямое выбывание — до 15. Детский формат зависит от регламента.</p></article><article><h3>Решение</h3><p>Судья следит за временем, счётом и правилами. Аппарат фиксирует уколы; итоговое решение принимает судья.</p></article></div></div></section>${productShowcase("mask")}<section class="section wrap">${sectionHead("Три вида спортивного оружия", "Разница —<br><span>в деталях.</span>")}<div class="table-scroll" tabindex="0" role="region" aria-label="Сравнение шпаги, рапиры и сабли"><table><caption class="sr-only">Основные различия видов оружия</caption><thead><tr><th scope="col">Оружие</th><th scope="col">Засчитывается</th><th scope="col">Поражаемая поверхность</th><th scope="col">Приоритет</th></tr></thead><tbody><tr class="highlight-row"><th scope="row">Шпага · наше направление</th><td>Укол</td><td>Всё тело</td><td>Нет</td></tr><tr><th scope="row">Рапира</th><td>Укол</td><td>Туловище, включая проводящий нагрудник маски</td><td>Есть</td></tr><tr><th scope="row">Сабля</th><td>Укол и удар</td><td>Верхняя часть тела, кроме кистей</td><td>Есть</td></tr></tbody></table></div><p class="content-note">Вводное объяснение не заменяет актуальные правила и регламент соревнования. ${link("https://fie.org/fie/documents/rules", "Правила FIE", "inline-link", true)}</p></section>${signup()}`;
}
function children() {
  return `${intro("Детская секция · школа «Лидер»", "Сегодня — интерес.<br><span>Завтра — свой путь.</span>", "Знакомство со шпагой начинается с простого: шага, внимания и любопытства. Затем — новые движения, первые поединки и собственный спортивный опыт.")}<figure class="subpage-panorama equipment-panorama media-reveal">${photo("equipment")}${credit("equipment")}</figure><section class="section wrap child-details"><div class="age-panel"><p class="eyebrow">Возраст, указанный в наборе</p><div class="age-display">7<span>–</span>14</div><p>лет · актуальность набора уточняйте у тренеров</p></div><div><h2>Точность движений.<br><span>Уверенность в себе.</span></h2><p class="lead">Фехтование на шпагах в специализированном зале на стадионе «Машиностроитель».</p><p>Начальные занятия знакомят со стойкой, передвижениями и безопасной работой с оружием. Распределение по группам и необходимую экипировку объяснит тренер.</p>${button(path("contacts") + "#enroll", "Узнать о наборе")}${notice("Набор 7–14 лет указан в материалах федерации. Текущий набор, расписание, стоимость и условия приёма необходимо уточнить.")}</div></section><section class="soft-section"><div class="section wrap">${sectionHead("С чего начать", "Всего три шага.<br><span>И вы на пути.</span>")}<ol class="steps"><li><span>01</span><h3>Познакомьтесь<br>с тренером.</h3><p>Расскажите возраст ребёнка и спросите, открыт ли набор в подходящую группу.</p></li><li><span>02</span><h3>Уточните<br>главное.</h3><p>Расписание, стоимость, документы для допуска и необходимую экипировку.</p></li><li><span>03</span><h3>Договоритесь<br>о визите.</h3><p>Тренер подскажет, когда прийти и что взять с собой. Оружие подбирают после консультации.</p></li></ol></div></section><section class="section wrap">${sectionHead("Наставники", "Рядом.<br><span>На каждом этапе.</span>", path("coaches"), "О тренерах")}${coaches()}</section><section class="section section-border wrap editorial"><div><p class="eyebrow">Вопросы родителей</p><h2>Перед первым<br><span>занятием.</span></h2></div><div class="faq"><details><summary>Нужна ли специальная подготовка?</summary><p>О предыдущем спортивном опыте и подходящей группе лучше поговорить с тренером. Требования к поступлению и допуску устанавливает школа.</p></details><details><summary>Нужно сразу покупать шпагу и форму?</summary><p>Сначала проконсультируйтесь с тренером. Он объяснит, какая экипировка нужна и как подобрать размер.</p></details><details><summary>Какое расписание и стоимость занятий?</summary><p>Подтверждённых данных пока нет. Уточните актуальные условия по телефону у тренеров.</p></details><details><summary>Где проходят тренировки?</summary><p>${federation.trainingVenue}. Адрес занятий: ${federation.trainingAddress}. Это адрес зала, а не юридический адрес федерации.</p></details></div></section>${signup()}`;
}
function coachesPage() {
  return `${intro("Тренеры", "Мастерство.<br><span>Которым делятся.</span>", "Внимание к технике. Уважение к характеру. Люди, которые помогают сделать следующий шаг.")}<section class="section wrap coaches-page">${coaches(true)}${notice("Звания, категория, телефоны и указанный стаж сверены с сайтом федерации. Даты отсчёта стажа неизвестны; актуальность данных требует финального подтверждения руководителем.")}</section>${signup()}`;
}
function newsPage() {
  const categories = [...new Set(news.map((n) => n.category))];
  return `${intro("Новости", "Жизнь в движении.<br><span>События федерации.</span>", "Старты, тренировки, встречи. Настоящие публикации с датами и ссылками на первоисточники.")}<section class="section wrap">${news.length ? `<div class="filter-bar" role="group" aria-label="Категории новостей"><button class="filter-button active" type="button" data-category="all" aria-pressed="true">Все публикации</button>${categories.map((c) => `<button class="filter-button" type="button" data-category="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("")}</div><div id="news-results" aria-live="polite">${newsCards([...news].sort((a, b) => b.date.localeCompare(a.date)))}</div>` : sourceHubs()}</section>${signup()}`;
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
  const rows = (items: Event[]) =>
    `<div class="event-list">${items.map((e) => `<article class="event-row"><time datetime="${e.date}">${date(e.date)}${e.endDate && e.endDate !== e.date ? ` — ${date(e.endDate)}` : ""}</time><div><p class="eyebrow">${esc(e.location)}</p><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p></div>${link(e.sourceUrl, "Первоисточник", "text-link", true)}</article>`).join("")}</div>`;
  return `${intro("Соревнования", "Выйти на дорожку.<br><span>Открыть новое в себе.</span>", "Календарь стартов, положения и результаты. Подтверждённые события из публикаций федерации.")}<section class="section wrap">${upcoming.length ? `${sectionHead("Впереди", "Следующая<br><span>встреча.</span>")}${rows(upcoming)}` : `<div class="calendar-note"><p class="eyebrow">Ближайшие старты</p><h2>Календарь —<br><span>у вашего тренера.</span></h2><div><p>Подтверждённые предстоящие старты пока не добавлены. Актуальные даты, условия участия и заявки уточняйте у тренеров.</p>${link(path("contacts"), "Связаться с тренером", "text-link")}</div></div>`}</section>${past.length ? `<section class="soft-section"><div class="section wrap">${sectionHead("Архив 2026", "Опыт.<br><span>Который остаётся.</span>")}${rows(past)}</div></section>` : ""}<section class="section wrap editorial"><div><p class="eyebrow">Перед стартом</p><h2>Хорошая подготовка —<br><span>в деталях.</span></h2></div><div><p>Возрастную категорию, формат боя, сроки заявки и требования к экипировке сверяют с положением конкретного турнира. Документы для допуска уточняют у тренера.</p>${link(path("documents"), "Правила и документы", "text-link")}</div></section>${signup()}`;
}
function galleryPage() {
  return `${intro("Галерея", "Моменты спорта.<br><span>Истории людей.</span>", "Шпага в кадре: взрослые международные соревнования и настоящее оборудование. Фотоархив федерации будет добавлен после согласования прав.")}<section class="section wrap">${media.length ? `<div class="gallery-grid">${media.map((m) => `<figure>${m.type === "video" ? `<video controls preload="none"${m.poster ? ` poster="${asset(m.poster)}"` : ""} aria-label="${esc(m.alt)}"><source src="${asset(m.src)}">Ваш браузер не поддерживает видео.</video>` : `<button class="gallery-open" type="button" data-media="${esc(m.id)}" aria-label="Увеличить: ${esc(m.alt)}">${photo(m.id, "", false, "(max-width: 760px) 100vw, 60vw")}</button>`}${credit(m.id)}</figure>`).join("")}</div><dialog id="lightbox"><button type="button" class="lightbox-close" aria-label="Закрыть изображение">×</button><img alt=""><p></p></dialog>` : `<div class="gallery-editorial"><p class="eyebrow">Фотоархив федерации</p><h2>Фотоархив.<br><span>Из первых рук.</span></h2><p>Пока материалы для нового сайта проходят согласование, смотрите фото и публикации на страницах федерации.</p><div class="button-group">${link("https://fencingpskov.nethouse.ru/photoalbums", "Открыть фотоархив", "button", true)}${link(federation.vk, "Сообщество VK", "button button-secondary", true)}</div></div>`}</section>${signup()}`;
}
function documentsPage() {
  const docs = [
    [
      "Правила фехтования",
      "Актуальные международные правила на сайте FIE.",
      "https://fie.org/fie/documents/rules",
    ],
    [
      "Федерация фехтования России",
      "Официальный сайт: документы, календарь и результаты.",
      "https://www.rusfencing.ru/",
    ],
    [
      "Региональная федерация",
      "Официальная карточка Псковской области на сайте ФФР.",
      "https://www.rusfencing.ru/fed_card.php?ID=607",
    ],
    [
      "Спортивная школа «Лидер»",
      "Карточка организации и список тренеров на сайте ФФР.",
      "https://www.rusfencing.ru/org_card.php?ID=202546",
    ],
  ];
  return `${intro("Документы", "Правила понятны.<br><span>Путь открыт.</span>", "Официальные источники и материалы для спортсменов, родителей и организаторов.")}<section class="section wrap"><div class="document-list">${docs.map(([t, d, url], i) => `<article class="document-row"><span class="document-number">0${i + 1}</span><div><h2>${t}</h2><p>${d}</p></div>${link(url, "Открыть", "text-link", true)}</article>`).join("")}</div></section><section class="soft-section"><div class="section wrap editorial"><div><p class="eyebrow">Документы федерации</p><h2>Актуальная редакция.<br><span>Из первых рук.</span></h2></div><div><p>Устав и положения публикуются после проверки актуальности и согласования права на размещение. Для участия в конкретном турнире запросите положение у тренера или организатора.</p>${link(path("contacts"), "Связаться с федерацией", "text-link")}</div></div></section>`;
}
function contactsPage() {
  return `${intro("Контакты", "До встречи<br><span>на дорожке.</span>", "Первый шаг — разговор с тренером. Уточните набор и договоритесь о знакомстве с секцией.")}<section id="enroll" class="section wrap contact-layout"><div><p class="eyebrow">Начать заниматься</p><h2>Один звонок.<br><span>Много возможностей.</span></h2><p>Расскажите возраст ребёнка. Уточните расписание, условия занятий и документы для допуска.</p><div class="contact-phones">${federation.coaches.map((c) => `<article><h3>${c.name}</h3>${link("tel:" + c.phoneHref, c.phone, "phone-link")}</article>`).join("")}</div>${notice("Телефоны сверены с сайтом федерации. Актуальность контактов требует финального подтверждения.")}${link(federation.vk, "Написать в VK", "button button-secondary", true)}</div><aside class="address-panel"><p class="eyebrow">Место занятий</p><h2>Псков.<br>Кузнецкая, 25.</h2><p>Специализированный зал фехтования.<br>Стадион «Машиностроитель».</p><div class="address-divider"></div>${link("https://yandex.ru/maps/?text=" + encodeURIComponent(federation.trainingAddress), "Открыть на карте", "text-link", true)}<p class="address-note">Адрес тренировочного зала.<br>Юридический адрес федерации здесь не указан.</p></aside></section>${signup()}`;
}
function sourcesPage() {
  const labels: Record<string, string> = {
    "owner-provided": "Из задания владельца",
    blocked: "Требует доступа",
    reference: "Ссылка для сверки",
    original: "Авторское оформление",
    licensed: "Открытая лицензия",
    verified: "Проверено",
  };
  return `${intro("Источники и согласование", "Точность —<br><span>в каждом факте.</span>", "Сайт находится на согласовании руководством. Здесь — происхождение материалов и сведения для окончательной проверки.")}<section id="approval" class="section wrap editorial"><div><p class="eyebrow">Руководителю федерации</p><h2>Проверить.<br><span>Подтвердить. Представить.</span></h2></div><div><ul class="approval-list"><li>Актуальность набора детей 7–14 лет, расписание, стоимость и условия приёма.</li><li>Телефоны, звания, категории и стаж тренеров с датой отсчёта.</li><li>Сведения об организации, руководстве и адресе тренировочного зала.</li><li>Исторические сведения и результаты, перенесённые из публикаций федерации.</li><li>Актуальные устав и положения, право на размещение.</li><li>Права на фото и видео, включая необходимые согласия на изображения несовершеннолетних.</li><li>Итоговые тексты, оформление и статус официального сайта.</li></ul><p>Для иллюстрации шпажного спорта используются фотографии взрослых международных соревнований по открытым лицензиям. Авторство, оригиналы и условия использования указаны под кадрами. Материалы самой федерации ожидают согласования.</p></div></section><section class="soft-section"><div class="section wrap">${sectionHead("Реестр материалов", "Проверяемое<br><span>происхождение.</span>")}<div class="source-list">${sources.map((s) => `<article class="source-row"><div><span class="source-status">${labels[s.status] || esc(s.status)}</span><h3>${s.title}</h3><p>${s.notes}</p></div>${s.url ? link(s.url, "Источник", "text-link", true) : '<span class="source-local">Материал проекта</span>'}</article>`).join("")}</div></div></section>`;
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
      dialog.querySelector("p")!.innerHTML = `${esc(m.caption)}<br>© ${esc(m.author)} · <a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.license)}</a> · <a href="${esc(m.sourceUrl)}" target="_blank" rel="noopener noreferrer">Оригинал</a> · ${esc(m.changes)}`;
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
initMotion();
let disposeShowcases = initShowcases();
window.addEventListener("pagehide", () => disposeShowcases());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) disposeShowcases = initShowcases();
});
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!motionQuery.matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.1 },
  );
  document
    .querySelectorAll(
      ".reveal, .section-heading, .coach, .news-card, .timeline article",
    )
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  motionQuery.addEventListener("change", (event) => {
    if (event.matches) {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("is-visible"));
      observer.disconnect();
    }
  });
}
