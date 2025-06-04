export type MorphTemplate = {
  isTemplate: boolean;
  type: string;
  str: TemplateStringsArray;
  args: Array<any | MorphTemplate>;
  meta?: {};
};

export type MorphAsyncTemplate<P> = {
  isAsyncTemplate: boolean;
  type: string;
  generator: (props: P & MorphPageProps) => MorphTemplate;
  props: P & MorphPageProps;
};

export type MorphGenerate<T> = T extends void
  ? (props: MorphPageProps) => Promise<MorphTemplate> | MorphTemplate
  : (props: T & MorphPageProps) => Promise<MorphTemplate> | MorphTemplate;

export type MorphTemplateGenerator<T> = (props: T) => {
  isTemplateGenerator: true;
  type: string;
  hx?: () => string;
  generate: MorphGenerate<T>;
  props: T;
};

export type MorphTemplateAsyncGenerator<T> = (props: T) => {
  isAsyncTemplateGenerator: true;
  type: string;
  hx?: () => string;
  generate: MorphGenerate<T>;
  props: T;
};

export type MorphComponent<T> =
  | MorphTemplateGenerator<T>
  | MorphTemplateAsyncGenerator<T>;

export type MorphMeta = {
  isMeta: true;
  type: "meta";
  meta: MetaOptions;
};

export type MorphCSS = {
  isCSS: true;
  type: "css";
  name: string;
  str: string;
};

export type MorphJS = {
  isJS: true;
  type: "js";
  str: string;
};

export type MorphBaseProps = {
  hx: () => string;
  child?: MorphTemplate;
};

export type MorphPageProps = MorphBaseProps & {
  request: Request;
  route: string;
  params: {
    [x: string]: string;
  };
  headers: Record<string, string>;
  query: Record<string, string>;
};

export type Layout = {
  layout: (
    page: string,
    css: string,
    js: string,
    meta: MetaOptions,
  ) => { text: string; meta: MetaOptions };
  wrapper?: MorphComponent<any>;
};

export type MetaOptions = {} & {
  // to layout
  title?: string;
  head?: string;
  bodyStart?: string;
  bodyEnd?: string;
  //
  headers?: { [name: string]: string };
  statusText?: string;
  statusCode?: number;
};

export type LayoutOptions = {
  title?: string;
  scripts?: {
    src: string;
    integrity?: string;
    defer?: boolean;
    async?: boolean;
    crossorigin?: string;
  }[];
  styles?: {
    href: string;
    integrity?: string;
    defer?: boolean;
    async?: boolean;
    crossorigin?: string;
  }[];
  head?: string;
  bodyStart?: string;
  bodyEnd?: string;
};

export type MorphRequest = {
  raw: Request;
  route: string;
  params: {
    [x: string]: string;
  };
  headers: Record<string, string>;
  query: Record<string, string>;
};

export type RpcHandlers<R> = {
  [key in keyof R]: (
    req: MorphRequest,
    args: R[key],
  ) => Promise<MorphTemplate>;
};
