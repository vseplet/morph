// deno-lint-ignore-file
import { type Context, Hono } from "@hono/hono";

import type {
  Layout,
  LayoutOptions,
  MetaOptions,
  MorphAsyncTemplate,
  MorphCSS,
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
      await template.generate({ ...template.props, ...pageProps }),
      pageProps,
    );
  }

  if (!template?.str || !Array.isArray(template.args)) {
    return { html: String(template ?? ""), css: "", js: "", meta };
  }

  meta = { ...template.meta };

  const html = await template.str.reduce(
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

  if (!arg) return { html: "", css, js, meta };

  if (arg.isMeta) return { html: "", css, js, meta: arg.meta };
  if (arg.isCSS) return { html: arg.name, css: arg.str, js, meta };
  if (arg.isJS) return { html: "", css, js: arg.str, meta };

  if (arg.isTemplate) {
    return render(arg, pageProps);
  }

  if (arg.isAsyncTemplateGenerator || arg.isTemplateGenerator) {
    return render(
      await arg.generate({ ...arg.props, ...pageProps }),
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

export class Morph {
  private morphLayout: Layout;
  private pages: Record<string, any> = {};
  private rpcHandlers: Record<string, RpcHandlers<any>> = {};
  private honoRouter: Hono | null = null;

  constructor(
    private options: {
      layout: Layout;
    },
  ) {
    this.morphLayout = options.layout;
  }

  layout(layout: Layout) {
    this.morphLayout = layout;
    return this;
  }

  page(route: string, generate: any) {
    this.pages[route] = async (c: Context) => {
      const pageProps = {
        request: c.req.raw,
        route,
        params: c.req.param(),
        query: c.req.query(),
        headers: c.req.header(),
      };

      const template = generate(pageProps);

      const pageObject = this.morphLayout.wrapper
        ? await render(
          this.morphLayout?.wrapper({ child: template, ...pageProps }),
          pageProps,
        )
        : await render(template, pageProps);

      const { text, meta } = this.morphLayout.layout(
        pageObject.html,
        pageObject.css,
        pageObject.js,
        pageObject.meta,
      );

      return new Response(text, {
        headers: {
          "Content-Type": "text/html",
          ...meta.headers,
        },
        status: meta?.statusCode,
        statusText: meta?.statusText,
      });
    };

    return this;
  }

  rpc(obj: { name: string; handlers: RpcHandlers<any> }) {
    this.rpcHandlers[obj.name] = obj.handlers;
    return this;
  }

  build() {
    if (this.honoRouter == null) {
      const router = new Hono();

      for (const [route, handler] of Object.entries(this.pages)) {
        router.get(route, handler);
      }

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
            });

            return new Response(
              `${result.html}<style>${result.css}</style><script>${result.js}</script>`,
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

      this.honoRouter = router;
      return router;
    } else {
      return this.honoRouter;
    }
  }

  async fetch(req: Request) {
    return this.honoRouter
      ? await this.honoRouter.fetch(req)
      : this.build().fetch(req);
  }
}

export const html = (
  str: TemplateStringsArray,
  ...args: any[]
): MorphTemplate => ({
  isTemplate: true,
  type: "html",
  str,
  args,
});

export const styled = (str: TemplateStringsArray, ...args: any[]): MorphCSS => {
  const name = "s" + crypto.randomUUID();
  return {
    isCSS: true,
    type: "css",
    name,
    str: `.${name}{${buildString(str, args)}}`,
  };
};

// TODO: добавить куки, статус код
export const meta = (data: MetaOptions): MorphMeta => ({
  isMeta: true,
  type: "meta",
  meta: data,
});

export const js = (str: TemplateStringsArray, ...args: any[]): MorphJS => ({
  isJS: true,
  type: "js",
  str: `(function() {${buildString(str, args)}})();`,
});

export const fn = (f: Function): MorphJS => ({
  isJS: true,
  type: "js",
  str: `(${f.toString()})();`,
});

export const onclick = (fn: Function) => {
  return `onclick='(${fn.toString()})()'`;
};

export const script = (fn: Function) => {
  return `<script>(${fn.toString()})()</script>`;
};

export const style = (str: TemplateStringsArray, ...args: any[]) =>
  `class="${styled(str, args)}"`;

export const morph = new Morph({
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
            <script src="https://unpkg.com/htmx.org@2.0.4"></script>
            <script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/json-enc.js"></script>
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

export const layout = <C>(cb: (layoutOptions: C & LayoutOptions) => Layout) =>
  cb;

/** */
export const component = <T = {}>(
  generate: T extends void
    ? (props: MorphPageProps) => Promise<MorphTemplate> | MorphTemplate
    : (props: T & MorphPageProps) => Promise<MorphTemplate> | MorphTemplate,
) => {
  if (generate.constructor.name === "AsyncFunction") {
    return (props: T) => {
      return {
        isAsyncTemplateGenerator: true,
        generate,
        props
      };
    };
  } else {
    return (props: T) => {
      return {
        isTemplateGenerator: true,
        generate,
        props
      };
    };
  }
};

// deno-fmt-ignore
export const basic = layout<{
  hyperscript?: boolean;
  alpine?: boolean;
  bootstrap?: boolean;
  bootstrapIcons?: boolean;
  htmx?: boolean;
  jsonEnc?: boolean;
  bluma?: boolean;
  wrapper?: MorphTemplateGenerator<{ child: MorphTemplate } & MorphPageProps>;
}>((options) => {
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
                  ? `<script src="https://unpkg.com/htmx.org@2.0.4"></script>`
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
                  ? `<script src="https://unpkg.com/htmx-ext-json-enc@2.0.4/json-enc.js"></script>`
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
