import type * as Preset from '@docusaurus/preset-classic';
import type {Config} from '@docusaurus/types';
import {themes as prismThemes} from 'prism-react-renderer';

// Runs in Node.js — no browser APIs or JSX here.

// Algolia stays optional: the site must build without credentials so forks, previews and local runs
// work unchanged. Search simply disappears when the variables are absent.
const algoliaAppId = process.env.DOCSEARCH_APP_ID;
const algoliaApiKey = process.env.DOCSEARCH_API_KEY;
const algoliaIndexName = process.env.DOCSEARCH_INDEX_NAME;
const hasAlgolia = Boolean(algoliaAppId && algoliaApiKey && algoliaIndexName);

const config: Config = {
  title: 'МояКарта24',
  tagline: 'Документация МояКарта24',
  // Deliberately not set: the `favicon` field emits a bare <link rel=icon> with no sizes
  // attribute, and sizes is exactly what lets a browser choose between the raster and vector
  // icons. The whole set is declared in headTags below instead.

  url: 'https://docs.mycard24.ru',
  baseUrl: '/',
  trailingSlash: true,

  organizationName: 'mycard24',
  projectName: 'mycard24-docs-site',

  // Paths here are root-absolute and therefore tied to baseUrl staying '/'. Docusaurus does not
  // rewrite headTags hrefs the way it does for the favicon field.
  headTags: [
    // Order matters, and it is the opposite of what the usual recipe suggests. Safari did not
    // support SVG favicons until version 26, and rather than skipping a link it cannot decode it
    // tends to take the last rel=icon in document order — landing on the SVG and drawing nothing.
    // So the vector goes first and a raster is always last. Chrome and Firefox score the
    // candidates by type and sizes instead of position, so they still pick the SVG.
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/svg+xml', href: '/img/favicon.svg'}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png'}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png'}},
    {tagName: 'link', attributes: {rel: 'icon', href: '/favicon.ico', sizes: '32x32'}},
    {tagName: 'link', attributes: {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'}},
    {tagName: 'link', attributes: {rel: 'manifest', href: '/site.webmanifest'}},
    // Tints the mobile browser chrome to match the navbar in each theme.
    {tagName: 'meta', attributes: {name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#ffffff'}},
    {tagName: 'meta', attributes: {name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#242526'}},
  ],

  // Legal pages must not silently rot into 404s.
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  future: {
    v4: true,
    // rspack-based build.
    faster: true,
  },

  i18n: {
    // Russian only for now, and it is the binding version of every legal document. The engine is
    // already wired for more: adding a locale here plus its files in the content repo is the whole
    // change — the navbar dropdown below and the CI check both follow from this list.
    defaultLocale: 'ru',
    locales: ['ru'],
    localeConfigs: {
      ru: {label: 'Русский', htmlLang: 'ru-RU'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          // Docs-only site: serve them at the root rather than under /docs, so the legal pages get
          // short, quotable URLs (docs.mycard24.ru/legal/privacy_policy/).
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // Deliberately no editUrl. What this site publishes is binding legal text — an offer, a
          // consent, a privacy policy — and "edit this page" invites a reader to propose changes to
          // it. The repository links in the footer were removed for the same reason: the audience
          // here is a customer reading the terms, not a contributor.
          // Deliberately no showLastUpdateTime: pages are copied in from the content repo during the
          // build, so git here would report when CI moved the file, not when the text changed. Legal
          // documents carry their own effective date in the body, which is the date that counts.
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'monthly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'МояКарта24',
      // Mark only — the wordmark beside it is the `title` above. The three-colour mark is the same
      // asset the landing uses, and it reads on both the light and the dark navbar, so there is no
      // srcDark variant to keep in sync.
      // alt is empty because "МояКарта24" is already adjacent as real text; naming the logo too
      // would make screen readers announce the brand twice.
      logo: {
        alt: '',
        src: 'img/logo.svg',
        width: 26,
        height: 32,
      },
      items: [
        ...(hasAlgolia ? [{type: 'search' as const, position: 'right' as const}] : []),
        // Last, so it sits at the far right whether or not search is configured. Styled as a
        // button by custom.css: it is the one action on a site that is otherwise all reading.
        {
          href: 'https://mycard24.ru',
          position: 'right',
          label: 'Оформить карту',
          className: 'navbar__item--cta',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Юридические документы',
          items: [
            {label: 'Публичная оферта', to: '/legal/offer/'},
            {label: 'Пользовательское соглашение', to: '/legal/terms/'},
            {label: 'Согласие на обработку ПД', to: '/legal/consent/'},
            {label: 'Политика конфиденциальности', to: '/legal/privacy_policy/'},
          ],
        },
        {
          title: 'Сервис',
          items: [
            {label: 'mycard24.ru', href: 'https://mycard24.ru'},
            {label: 'info@mycard24.ru', href: 'mailto:info@mycard24.ru'},
          ],
        },
      ],
      // The operator must be identifiable from any page carrying legal text.
      copyright: `ИП Искужин Айгиз · ИНН 024803896842 · ОГРНИП 326028000044859 · <a href="https://pd.rkn.gov.ru/operators-registry/operators-list/?id=2-26-056967" target="_blank" rel="noopener noreferrer">Оператор ПД в реестре РКН № 2-26-056967</a><br/>© ${new Date().getFullYear()} МояКарта24`,
    },
    algolia: hasAlgolia
      ? {
          appId: algoliaAppId!,
          apiKey: algoliaApiKey!,
          indexName: algoliaIndexName!,
          contextualSearch: true,
          searchPagePath: 'search',
        }
      : undefined,
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
