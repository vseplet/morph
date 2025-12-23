/**
 * Represents a rendered HTML template with interpolated values.
 * Created by the `html` tagged template literal.
 *
 * @example
 * ```ts
 * const template: MorphTemplate = html`<div>${value}</div>`;
 * ```
 */
export type MorphTemplate = {
  isTemplate: boolean;
  type: string;
  str: TemplateStringsArray;
  args: Array<any | MorphTemplate>;
  meta?: {};
};

/**
 * Represents an async template that generates HTML content.
 * Used internally for async component rendering.
 *
 * @typeParam P - The props type for the template generator
 */
export type MorphAsyncTemplate<P> = {
  isAsyncTemplate: boolean;
  type: string;
  generator: (props: P & MorphPageProps) => MorphTemplate;
  props: P & MorphPageProps;
};

/**
 * Function signature for component generation.
 * Can be sync or async, and receives props merged with page props.
 *
 * @typeParam T - The custom props type (void if no custom props)
 */
export type MorphGenerate<T> = T extends void
  ? (props: MorphPageProps) => Promise<MorphTemplate> | MorphTemplate
  : (props: T & MorphPageProps) => Promise<MorphTemplate> | MorphTemplate;

/**
 * A synchronous template generator function.
 * Used internally by the `component` function.
 *
 * @typeParam T - The props type for the generator
 */
export type MorphTemplateGenerator<T> = (props: T) => {
  isTemplateGenerator: true;
  type: string;
  hx?: () => string;
  generate: MorphGenerate<T>;
  props: T;
};

/**
 * An asynchronous template generator function.
 * Used internally by the `component` function for async components.
 *
 * @typeParam T - The props type for the generator
 */
export type MorphTemplateAsyncGenerator<T> = (props: T) => {
  isAsyncTemplateGenerator: true;
  type: string;
  hx?: () => string;
  generate: MorphGenerate<T>;
  props: T;
};

/**
 * A Morph component - either sync or async template generator.
 * Components are created using the `component()` function.
 *
 * @typeParam T - The props type for the component
 *
 * @example
 * ```ts
 * const myComponent: MorphComponent<{ name: string }> = component((props) =>
 *   html`<h1>Hello, ${props.name}!</h1>`
 * );
 * ```
 */
export type MorphComponent<T> =
  | MorphTemplateGenerator<T>
  | MorphTemplateAsyncGenerator<T>;

/**
 * Represents page metadata like title, headers, and status code.
 * Created by the `meta()` function.
 *
 * @example
 * ```ts
 * const pageMeta: MorphMeta = meta({ title: "My Page", statusCode: 200 });
 * ```
 */
export type MorphMeta = {
  isMeta: true;
  type: "meta";
  meta: MetaOptions;
};

/**
 * Represents scoped CSS styles with a unique class name.
 * Created by the `styled` tagged template literal.
 *
 * @example
 * ```ts
 * const buttonClass: MorphCSS = styled`
 *   padding: 8px 16px;
 *   background: blue;
 * `;
 * ```
 */
export type MorphCSS = {
  isCSS: true;
  type: "css";
  /** The generated unique class name */
  name: string;
  /** The full CSS rule including the class selector */
  str: string;
};

/**
 * Represents client-side JavaScript to be injected into the page.
 * Created by the `js` tagged template literal or `fn()` function.
 */
export type MorphJS = {
  isJS: true;
  type: "js";
  /** The JavaScript code wrapped in an IIFE */
  str: string;
};

/**
 * Base props available to all components.
 */
export type MorphBaseProps = {
  /** Returns an hx-get attribute for HTMX partial updates */
  hx: () => string;
  /** Child template when used as a wrapper */
  child?: MorphTemplate;
};

/**
 * Props automatically injected into page components.
 * Contains request information and HTMX helpers.
 *
 * @example
 * ```ts
 * const page = component((props: MorphPageProps) => html`
 *   <p>URL: ${props.request.url}</p>
 *   <p>User ID: ${props.params.id}</p>
 *   <p>Search: ${props.query.q}</p>
 * `);
 * ```
 */
export type MorphPageProps = MorphBaseProps & {
  /** The raw HTTP Request object */
  request: Request;
  /** The matched route pattern */
  route: string;
  /** URL path parameters (e.g., /users/:id -> params.id) */
  params: {
    [x: string]: string;
  };
  /** Request headers as key-value pairs */
  headers: Record<string, string>;
  /** URL query parameters (e.g., ?foo=bar -> query.foo) */
  query: Record<string, string>;
};

/**
 * Defines how pages are wrapped in an HTML document.
 * Used by Morph to generate complete HTML responses.
 */
export type Layout = {
  /** Function that wraps page content in HTML document structure */
  layout: (
    page: string,
    css: string,
    js: string,
    meta: MetaOptions,
  ) => { text: string; meta: MetaOptions };
  /** Optional component that wraps all page content */
  wrapper?: MorphComponent<any>;
};

/**
 * Options for page metadata and response configuration.
 * Used with the `meta()` function.
 *
 * @example
 * ```ts
 * meta({
 *   title: "My Page",
 *   statusCode: 200,
 *   headers: { "Cache-Control": "no-cache" },
 *   head: '<link rel="icon" href="/favicon.ico">',
 * });
 * ```
 */
export type MetaOptions = {} & {
  /** Page title (appears in <title> tag) */
  title?: string;
  /** Additional content to inject into <head> */
  head?: string;
  /** Content to inject at the start of <body> */
  bodyStart?: string;
  /** Content to inject at the end of <body> */
  bodyEnd?: string;
  /** HTTP response headers */
  headers?: { [name: string]: string };
  /** HTTP status text */
  statusText?: string;
  /** HTTP status code */
  statusCode?: number;
};

/**
 * Configuration options for the `basic()` layout helper.
 * Includes options for popular CSS/JS libraries.
 */
export type LayoutOptions = {
  /** Default page title */
  title?: string;
  /** External scripts to include */
  scripts?: {
    src: string;
    integrity?: string;
    defer?: boolean;
    async?: boolean;
    crossorigin?: string;
  }[];
  /** External stylesheets to include */
  styles?: {
    href: string;
    integrity?: string;
    defer?: boolean;
    async?: boolean;
    crossorigin?: string;
  }[];
  /** Additional content for <head> */
  head?: string;
  /** Content at start of <body> */
  bodyStart?: string;
  /** Content at end of <body> */
  bodyEnd?: string;
};

/**
 * Request object passed to RPC handlers.
 * Contains parsed request information.
 */
export type MorphRequest = {
  /** The raw HTTP Request object */
  raw: Request;
  /** The matched route pattern */
  route: string;
  /** URL path parameters */
  params: {
    [x: string]: string;
  };
  /** Request headers */
  headers: Record<string, string>;
  /** URL query parameters */
  query: Record<string, string>;
};

/**
 * Type definition for RPC handler functions.
 * Maps handler names to their argument types.
 *
 * @typeParam R - Record mapping handler names to argument types
 *
 * @example
 * ```ts
 * const handlers: RpcHandlers<{ createUser: { name: string } }> = {
 *   createUser: async (req, args) => html`<div>Created ${args.name}</div>`,
 * };
 * ```
 */
export type RpcHandlers<R> = {
  [key in keyof R]: (
    req: MorphRequest,
    args: R[key],
  ) => Promise<MorphTemplate>;
};
