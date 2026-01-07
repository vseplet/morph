// deno-lint-ignore-file
import { type Context, Hono } from "@hono/hono";

import type {
  Layout,
  LayoutOptions,
  MetaOptions,
  MorphAsyncTemplate,
  MorphComponent,
  MorphCSS,
  MorphGenerate,
  MorphJS,
  MorphMeta,
  MorphPageProps,
  MorphTemplate,
  MorphTemplateAsyncGenerator,
  MorphTemplateGenerator,
  RpcHandlers,
} from "./types.ts";
import { buildString } from "./helpers.ts";

export * from "./types.ts";

let counter = 0;

/**
 * Renders a Morph template to HTML string with collected CSS and JS.
 * Handles nested templates, arrays, async generators, and component composition.
 *
 * @param template - The template to render (can be MorphTemplate, array, or generator)
 * @param pageProps - Page props containing request information
 * @returns Object with rendered HTML, collected CSS, JS, and meta options
 *
 * @example
 * ```ts
 * const result = await render(html`<div>Hello</div>`, pageProps);
 * console.log(result.html); // "<div>Hello</div>"
 * ```
 */
export const render = async (
  template:
    | MorphTemplate
    | MorphAsyncTemplate<any>
    | Array<MorphTemplate | MorphAsyncTemplate<any>>
    | MorphTemplateGenerator<any>
    | MorphTemplateAsyncGenerator<any>
    | Array<MorphTemplateGenerator<any> | MorphTemplateAsyncGenerator<any>>
    | any,
  pageProps: MorphPageProps,
): Promise<{ html: string; css: string; js: string; meta: MetaOptions }> => {
  let meta: MetaOptions = {};
  let css = "";
  let js = "";

  if (Array.isArray(template)) {
    const results = await Promise.all(
      template.map((item) => render(item, pageProps)),
    );
    return {
      html: results.map((r) => r.html).join(""),
      css: results.map((r) => r.css).join(""),
      js: results.map((r) => r.js).join(""),
      meta: Object.assign({}, ...results.map((r) => r.meta)),
    };
  }

  if (template?.isAsyncTemplateGenerator || template?.isTemplateGenerator) {
    return render(
      await template.generate({
        ...template.props,
        ...pageProps,
        name: template.name,
      }),
      pageProps,
    );
  }

  if (!template?.str || !Array.isArray(template.args)) {
    return { html: String(template ?? ""), css: "", js: "", meta };
  }

  meta = { ...template.meta };

  let html = await template.str.reduce(
    async (accPromise: any, part: any, i: any) => {
      const acc = await accPromise;
      const { html: renderedArg, css: argCss, js: argJs, meta: argMeta } =
        await renderArgument(template.args[i], pageProps);
      Object.assign(meta, argMeta);
      css += argCss;
      js += argJs;
      return acc + part + renderedArg;
    },
    Promise.resolve(""),
  );

  return { html, css, js, meta };
};

const renderArgument = async (
  arg: MorphTemplate | MorphMeta | MorphCSS | MorphJS | any,
  pageProps: MorphPageProps,
): Promise<{ html: string; css: string; js: string; meta: MetaOptions }> => {
  const meta: MetaOptions = {};
  const css = "";
  const js = "";

  if (arg === undefined || arg === null) return { html: "", css, js, meta };
  if (arg === false) return { html: "", css, js, meta };

  if (arg.isMeta) return { html: "", css, js, meta: arg.meta };
  if (arg.isCSS) return { html: arg.name, css: arg.str, js, meta };
  if (arg.isJS) return { html: "", css, js: arg.str, meta };

  if (arg.isTemplate) {
    return render(arg, pageProps);
  }

  if (arg.isAsyncTemplateGenerator || arg.isTemplateGenerator) {
    return render(
      await arg.generate({ ...arg.props, ...pageProps, hx: arg.hx }),
      pageProps,
    );
  }

  if (typeof arg === "function") {
    const result = await (arg.constructor.name === "AsyncFunction"
      ? arg(pageProps)
      : Promise.resolve(arg(pageProps)));
    return renderArgument(result, pageProps);
  }

  if (Array.isArray(arg)) {
    const results = await Promise.all(
      arg.map((item) => render(item, pageProps)),
    );
    return {
      html: results.map((r) => r.html).join(""),
      css: results.map((r) => r.css).join(""),
      js: results.map((r) => r.js).join(""),
      meta: Object.assign({}, ...results.map((r) => r.meta)),
    };
  }

  return { html: String(arg), css, js, meta };
};

/**
 * Main Morph application class for building server-rendered web applications.
 * Manages routes, layouts, partials, and RPC handlers.
 *
 * @example
 * ```ts
 * const app = new Morph({ layout: basic({ htmx: true }) })
 *   .page("/", homePage)
 *   .page("/users/:id", userPage)
 *   .partial(counterComponent)
 *   .build();
 *
 * Deno.serve(app.fetch);
 * ```
 */
export class Morph {
  private morphLayout: Layout;
  private pages: Record<string, any> = {};
  private rpcHandlers: Record<string, RpcHandlers<any>> = {};
  private partials: Record<string, MorphComponent<any>> = {};
  private honoRouter: Hono | null = null;

  /**
   * Creates a new Morph application instance.
   *
   * @param options - Configuration options including the layout
   */
  constructor(
    private options: {
      layout: Layout;
    },
  ) {
    this.morphLayout = options.layout;
  }

  /**
   * Sets the layout for the application.
   *
   * @param layout - The layout configuration
   * @returns The Morph instance for chaining
   */
  layout(layout: Layout): this {
    this.morphLayout = layout;
    return this;
  }

  /**
   * Registers a component as a partial for HTMX updates.
   * Creates a `/draw/{componentName}` endpoint.
   *
   * @param cmp - The component to register as a partial
   * @returns The Morph instance for chaining
   *
   * @example
   * ```ts
   * const counter = component((props) => html`
   *   <div ${props.hx()} hx-trigger="click" hx-swap="outerHTML">
   *     Count: ${props.query?.count ?? 0}
   *   </div>
   * `);
   *
   * morph.partial(counter);
   * ```
   */
  partial<T>(cmp: MorphComponent<T>): this {
    this.partials[cmp.name] = cmp;
    return this;
  }

  /**
   * Registers a page route with a component.
   *
   * @param route - The URL pattern (supports :param syntax)
   * @param component - The component to render for this route
   * @returns The Morph instance for chaining
   *
   * @example
   * ```ts
   * morph
   *   .page("/", homePage)
   *   .page("/users/:id", userPage);
   * ```
   */
  // deno-lint-ignore no-explicit-any
  page(route: string, component: MorphComponent<any>): this {
    this.pages[route] = async (c: Context): Promise<Response> => {
      const pageProps: MorphPageProps = {
        request: c.req.raw,
        route,
        params: c.req.param(),
        query: c.req.query(),
        headers: c.req.header(),
        hx: () => `hx-get='/api/${route}'`,
      };

      const template = component(pageProps);

      const pageObject = this.morphLayout.wrapper
        ? await render(
          // TODO: fix template type
          this.morphLayout?.wrapper({ child: template as any, ...pageProps }),
          pageProps,
        )
        : await render(template, pageProps);

      const { text, meta } = this.morphLayout.layout(
        pageObject.html,
        pageObject.css,
        pageObject.js,
        pageObject.meta,
      );

      return new Response(
        text, /*await minify(text, {
          collapseWhitespace: true,
          removeComments: true,
          removeAttributeQuotes: true,
          removeEmptyAttributes: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          removeTagWhitespace: true,
        })*/
        {
          headers: {
            "Content-Type": "text/html",
            ...meta.headers,
          },
          status: meta?.statusCode,
          statusText: meta?.statusText,
        },
      );
    };

    return this;
  }

  /**
   * Registers RPC handlers for typed server calls.
   *
   * @param obj - Object containing handler name and functions
   * @returns The Morph instance for chaining
   *
   * @example
   * ```ts
   * const api = rpc({
   *   createUser: async (req, args: { name: string }) =>
   *     html`<div>Created ${args.name}</div>`,
   * });
   *
   * morph.rpc(api);
   * ```
   */
  rpc(obj: { name: string; handlers: RpcHandlers<unknown> }): this {
    this.rpcHandlers[obj.name] = obj.handlers;
    return this;
  }

  /**
   * Builds and returns the Hono router with all registered routes.
   * Call this once after registering all pages, partials, and RPC handlers.
   *
   * @returns The configured Hono router
   *
   * @example
   * ```ts
   * const router = morph.build();
   * Deno.serve(router.fetch);
   * ```
   */
  build(): Hono {
    if (this.honoRouter == null) {
      const router = new Hono();

      // create rpc routes
      for (const [name, handlers] of Object.entries(this.rpcHandlers)) {
        for (const [key, handler] of Object.entries(handlers)) {
          const route = `/rpc/${name}/${key}`;

          router.post(route, async (c: Context) => {
            const args = await c.req.json();
            const response = await handler({
              raw: c.req.raw,
              route,
              params: c.req.param(),
              query: c.req.query(),
              headers: c.req.header(),
            }, args);

            const result = await render(response, {
              request: c.req.raw,
              route,
              params: c.req.param(),
              query: c.req.query(),
              headers: c.req.header(),
              hx: () => `hx-get='/api/${route}'`,
            });

            return new Response(
              `${result.html}${
                result.css ? `<style>${result.css}</style>` : ""
              }${result.js ? `<script>${result.js}</script>` : ""}`,
              {
                headers: {
                  "Content-Type": "text/html",
                  ...result.meta.headers,
                },
                status: result.meta?.statusCode,
                statusText: result.meta?.statusText,
              },
            );
          });
        }
      }

      // create partials routes
      for (const [name, cmp] of Object.entries(this.partials)) {
        router.get(`/draw/${name}`, async (c: Context) => {
          const pageProps: MorphPageProps = {
            request: c.req.raw,
            route: `/draw/${name}`,
            params: c.req.param(),
            query: c.req.query(),
            headers: c.req.header(),
            hx: () => `hx-get='/draw/${name}'`,
          };

          const template = cmp(pageProps);
          const pageObject = await render(template, pageProps);
          return new Response(
            `${pageObject.html}${
              pageObject.css ? `<style>${pageObject.css}</style>` : ""
            }${pageObject.js ? `<script>${pageObject.js}</script>` : ""}`,
            {
              headers: {
                "Content-Type": "text/html",
              },
            },
          );
        });
      }

      // create pages routes
      for (const [route, handler] of Object.entries(this.pages)) {
        router.get(route, handler);
      }

      this.honoRouter = router;
      return router;
    } else {
      return this.honoRouter;
    }
  }

  /**
   * Handles an HTTP request using the built router.
   * Automatically builds the router if not already built.
   *
   * @param req - The incoming HTTP Request
   * @returns The HTTP Response
   *
   * @example
   * ```ts
   * const response = await morph.fetch(request);
   * ```
   */
  async fetch(req: Request): Promise<Response> {
    return this.honoRouter
      ? await this.honoRouter.fetch(req)
      : this.build().fetch(req);
  }
}

/**
 * Tagged template literal for creating HTML templates.
 * Supports interpolation of strings, numbers, other templates, arrays, and components.
 *
 * @param str - Template string parts
 * @param args - Interpolated values
 * @returns A MorphTemplate object
 *
 * @example
 * ```ts
 * // Basic usage
 * html`<div>Hello, ${name}!</div>`
 *
 * // Nested templates
 * html`<div>${html`<span>nested</span>`}</div>`
 *
 * // Arrays
 * html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`
 *
 * // Conditionals
 * html`<div>${isAdmin ? html`<button>Delete</button>` : ""}</div>`
 * ```
 */
export const html = (
  str: TemplateStringsArray,
  ...args: any[]
): MorphTemplate => ({
  isTemplate: true,
  type: "html",
  str,
  args,
});

/**
 * Tagged template literal for creating scoped CSS styles.
 * Generates a unique class name and collects CSS in the document head.
 *
 * @param str - CSS template string parts
 * @param args - Interpolated values
 * @returns A MorphCSS object with unique class name
 *
 * @example
 * ```ts
 * const buttonClass = styled`
 *   padding: 8px 16px;
 *   background: blue;
 *   color: white;
 *
 *   &:hover {
 *     background: darkblue;
 *   }
 * `;
 *
 * html`<button class="${buttonClass}">Click me</button>`
 * ```
 */
export const styled = (str: TemplateStringsArray, ...args: any[]): MorphCSS => {
  const name = "s" + crypto.randomUUID();
  return {
    isCSS: true,
    type: "css",
    name,
    str: `.${name}{${buildString(str, args)}}`,
  };
};

/**
 * Sets page metadata including title, HTTP status, headers, and injected content.
 *
 * @param data - Metadata options
 * @returns A MorphMeta object
 *
 * @example
 * ```ts
 * const page = component(() => html`
 *   ${meta({
 *     title: "My Page",
 *     statusCode: 200,
 *     headers: { "Cache-Control": "no-cache" },
 *     head: '<link rel="icon" href="/favicon.ico">',
 *   })}
 *   <h1>Content</h1>
 * `);
 * ```
 */
export const meta = (data: MetaOptions): MorphMeta => ({
  isMeta: true,
  type: "meta",
  meta: data,
});

/**
 * Tagged template literal for injecting client-side JavaScript.
 * The code is wrapped in an IIFE and added to the end of the document body.
 *
 * @param str - JavaScript template string parts
 * @param args - Interpolated values
 * @returns A MorphJS object
 *
 * @example
 * ```ts
 * html`
 *   <div id="app"></div>
 *   ${js`
 *     document.getElementById("app").textContent = "Hello from JS!";
 *   `}
 * `
 * ```
 */
export const js = (str: TemplateStringsArray, ...args: any[]): MorphJS => ({
  isJS: true,
  type: "js",
  str: `(function() {${buildString(str, args)}})();`,
});

/**
 * Converts a function to client-side JavaScript.
 * The function is serialized and executed as an IIFE on the client.
 *
 * @param f - The function to convert
 * @returns A MorphJS object
 *
 * @example
 * ```ts
 * html`
 *   ${fn(() => {
 *     console.log("Page loaded!");
 *     document.body.style.background = "lightblue";
 *   })}
 * `
 * ```
 */
export const fn = (f: Function): MorphJS => ({
  isJS: true,
  type: "js",
  str: `(${f.toString()})();`,
});

/**
 * Creates an onclick attribute with inline JavaScript.
 *
 * @param fn - The function to execute on click
 * @returns An onclick attribute string
 *
 * @example
 * ```ts
 * html`<button ${onclick(() => alert("Clicked!"))}>Click me</button>`
 * ```
 */
export const onclick = (fn: Function): string => {
  return `onclick='(${fn.toString()})()'`;
};

/**
 * Creates an inline script tag with the given function.
 *
 * @param fn - The function to execute
 * @returns A script tag string
 *
 * @example
 * ```ts
 * html`
 *   <div>Content</div>
 *   ${script(() => console.log("Inline script executed"))}
 * `
 * ```
 */
export const script = (fn: Function): string => {
  return `<script>(${fn.toString()})()</script>`;
};

/**
 * Creates a class attribute with scoped CSS styles.
 * Shorthand for `class="${styled`...`}"`.
 *
 * @param str - CSS template string parts
 * @param args - Interpolated values
 * @returns A class attribute string
 *
 * @example
 * ```ts
 * html`<div ${style`padding: 16px; color: blue;`}>Styled div</div>`
 * ```
 */
export const style = (
  str: TemplateStringsArray,
  ...args: unknown[]
): string => {
  const s = styled(str, ...args);
  return `class="${s.name}"`;
};

/**
 * Default Morph instance with a basic layout including HTMX.
 * Use for quick prototyping or simple applications.
 *
 * @example
 * ```ts
 * import { morph, component, html } from "@vseplet/morph";
 *
 * const page = component(() => html`<h1>Hello!</h1>`);
 *
 * const app = morph.page("/", page).build();
 * Deno.serve(app.fetch);
 * ```
 */
export const morph: Morph = new Morph({
  layout: {
    layout: (
      page: string,
      css: string,
      js: string,
      meta: Partial<LayoutOptions>,
    ) => ({
      text: `
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${meta.title || "Morph Default"}</title>
            ${meta.head || ""}
            <script src="https://unpkg.com/htmx.org@2.0.8"></script>
            <script src="https://unpkg.com/htmx-ext-json-enc@2.0.1/json-enc.js"></script>
            <style>${css}</style>
          </head>
          <body>
            ${meta.bodyStart || ""}
            ${page}
            ${meta.bodyEnd || ""}
            <script>${js}</script>
          </body>
        </html>
      `,
      meta,
    }),
  },
});

/**
 * Helper for creating custom layout configurations.
 * Provides type inference for layout options.
 *
 * @param cb - Callback that receives layout options and returns a Layout
 * @returns The callback for use with Morph
 *
 * @example
 * ```ts
 * const myLayout = layout<{ darkMode?: boolean }>((options) => ({
 *   layout: (page, css, js, meta) => ({
 *     text: `<html class="${options.darkMode ? 'dark' : ''}">${page}</html>`,
 *     meta,
 *   }),
 * }));
 * ```
 */
export const layout = <C>(
  cb: (layoutOptions: C & LayoutOptions) => Layout,
): (layoutOptions: C & LayoutOptions) => Layout => cb;

/**
 * Creates a reusable component with optional typed props.
 * Components can be sync or async and receive page props automatically.
 *
 * @param generate - Function that generates the component's HTML template
 * @returns A MorphComponent that can be used in pages and partials
 *
 * @example
 * ```ts
 * // Simple component
 * const header = component(() => html`<header><h1>My App</h1></header>`);
 *
 * // Component with typed props
 * const userCard = component<{ name: string; email: string }>((props) => html`
 *   <div class="user-card">
 *     <h3>${props.name}</h3>
 *     <p>${props.email}</p>
 *   </div>
 * `);
 *
 * // Async component
 * const userList = component(async (props) => {
 *   const users = await fetchUsers();
 *   return html`<ul>${users.map(u => userCard(u))}</ul>`;
 * });
 *
 * // Using page props
 * const page = component((props) => html`
 *   <p>Route: ${props.route}</p>
 *   <p>User ID: ${props.params.id}</p>
 * `);
 * ```
 */
export const component = <T = {}>(
  generate: MorphGenerate<T>,
): MorphComponent<T> => {
  const name = `cmp-${counter++}`;

  const cmp =
    (generate.constructor.name === "AsyncFunction"
      ? function (props: T) {
        return {
          isAsyncTemplateGenerator: true,
          type: "async-template-generator",
          hx: () => `hx-get='/draw/${name}'`,
          generate,
          props,
        };
      }
      : function (props: T) {
        return {
          isTemplateGenerator: true,
          type: "template-generator",
          hx: () => `hx-get='/draw/${name}'`,
          generate,
          props,
        };
      }) as MorphComponent<T>;

  Object.defineProperty(cmp, "name", {
    value: name,
    writable: false,
  });

  return cmp;
};

/**
 * Pre-configured layout with popular CSS/JS library integrations.
 * Supports HTMX, Alpine.js, Bootstrap, Bulma, Hyperscript, and more.
 *
 * @example
 * ```ts
 * const app = new Morph({
 *   layout: basic({
 *     htmx: true,          // Include HTMX
 *     alpine: true,        // Include Alpine.js
 *     bootstrap: true,     // Include Bootstrap CSS
 *     bootstrapIcons: true,// Include Bootstrap Icons
 *     bluma: true,         // Include Bulma CSS
 *     hyperscript: true,   // Include Hyperscript
 *     jsonEnc: true,       // Include HTMX json-enc extension
 *     sse: true,           // Include HTMX SSE extension for Server-Sent Events
 *     title: "My App",     // Default page title
 *     wrapper: layoutComponent, // Wrapper component
 *   }),
 * });
 * ```
 */
/** Options for the basic layout helper */
export type BasicLayoutOptions = {
  /** Include Hyperscript library */
  hyperscript?: boolean;
  /** Include Alpine.js library */
  alpine?: boolean;
  /** Include Bootstrap CSS */
  bootstrap?: boolean;
  /** Include Bootstrap Icons */
  bootstrapIcons?: boolean;
  /** Include HTMX library */
  htmx?: boolean;
  /** Include HTMX json-enc extension */
  jsonEnc?: boolean;
  /** Include HTMX SSE (Server-Sent Events) extension */
  sse?: boolean;
  /** Include Bulma CSS */
  bluma?: boolean;
  /** Wrapper component for all pages */
  wrapper?: MorphComponent<object>;
};

// deno-fmt-ignore
export const basic: (options: BasicLayoutOptions & LayoutOptions) => Layout = layout<BasicLayoutOptions>((options) => {
  return {
    wrapper: options?.wrapper,
    layout: (page: string, css: string, js: string, meta: Partial<LayoutOptions>) => {
      return {
        text: `
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              ${
                options.htmx
                  ? `<script src="https://unpkg.com/htmx.org@2.0.8"></script>`
                  : ""
              }
              ${
                options.alpine
                  ? `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
                  : ""
              }
              ${
                options.bootstrap
                  ? `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
              integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">`
                  : ""
              }
              ${
                options.bootstrapIcons
                  ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">`
                  : ""
              }
              ${
                options.jsonEnc
                  ? `<script src="https://unpkg.com/htmx-ext-json-enc@2.0.1/json-enc.js"></script>`
                  : ""
              }
              ${
                options.sse
                  ? `<script src="https://unpkg.com/htmx-ext-sse@2.2.4/sse.js"></script>`
                  : ""
              }
              ${
                options.bluma
                  ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">`
                  : ""
              }
              ${
                options.hyperscript
                  ? `<script src="https://unpkg.com/hyperscript.org@0.9.12"></script>`
                  : ""
              }
              <title>${meta.title || options.title || "Reface Clean"}</title>
              ${options.head || ""}
              ${meta.head || ""}
              <style>
                ${css}
              </style>
            </head>
            <body>
              ${options.bodyStart || ""}
              ${meta.bodyStart || ""}
              ${page}
              ${options.bodyEnd || ""}
              ${meta.bodyEnd || ""}
              <script>${js}</script>
            </body>
          </html>
        `,
        meta
      };
    },
  };
});

/**
 * Creates typed RPC (Remote Procedure Call) handlers for server-client communication.
 * Generates HTMX attributes for calling server functions with JSON arguments.
 *
 * @param handlers - Object mapping handler names to async functions
 * @returns Object with rpc attribute generators, handlers, and unique name
 *
 * @example
 * ```ts
 * // Define RPC handlers
 * const api = rpc({
 *   createUser: async (req, args: { name: string; email: string }) => {
 *     const user = await db.users.create(args);
 *     return html`<div>Created: ${user.name}</div>`;
 *   },
 *   deleteUser: async (req, args: { id: number }) => {
 *     await db.users.delete(args.id);
 *     return html`<div>Deleted</div>`;
 *   },
 * });
 *
 * // Use in component
 * const form = component(() => html`
 *   <button ${api.rpc.createUser({ name: "Alice", email: "alice@example.com" })}
 *           hx-target="#result">
 *     Create User
 *   </button>
 *   <div id="result"></div>
 * `);
 *
 * // Register with Morph
 * morph.rpc(api).page("/", form);
 * ```
 */
export const rpc = <A>(handlers: RpcHandlers<A>): {
  rpc: { [key in keyof A]: (args?: A[key]) => string };
  handlers: RpcHandlers<A>;
  name: string;
} => {
  const name = `rpc-${counter++}`;

  const rpc: {
    [key in keyof A]: (args?: A[key]) => string;
  } = {} as any;

  Object.keys(handlers).forEach((key) => {
    rpc[key as keyof A] = (args?: A[keyof A]) =>
      `hx-ext='json-enc' hx-post='/rpc/${name}/${key}'` +
      (args ? ` hx-vals='${JSON.stringify(args)}'` : "");
  });

  return {
    rpc,
    handlers,
    name,
  };
};
