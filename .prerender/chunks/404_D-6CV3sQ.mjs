import { t as typeHandlers, a as types, A as AstroError, N as NoImageMetadata, F as FailedToFetchRemoteImageDimensions, R as RemoteImageNotAllowed, I as InvalidComponentArgs, c as createRenderInstruction, r as renderTemplate, b as renderComponent, m as maybeRenderHead, d as createVNode, e as Fragment, _ as __astro_tag_component__, E as ExpectedImage, L as LocalImageUsedWrongly, M as MissingImageDimension, U as UnsupportedImageFormat, f as IncompatibleDescriptorOptions, g as UnsupportedImageConversion, h as ExpectedImageOptions, i as ExpectedNotESMImage, j as InvalidImageService, k as ImageMissingAlt, l as addAttribute, s as spreadAttributes, n as FontFamilyNotFound, u as unescapeHTML, o as renderSlot, p as renderHead } from './prerender_tc-KpDLI.mjs';
import { createComponent as createComponent$1, Dynamic, ssr, ssrHydrationKey, escape, ssrAttribute, ssrStyle } from 'solid-js/web';
import 'clsx';
import 'piccolore';
import { mergeProps, Show, onMount, createSignal, For, Switch, Match } from 'solid-js';
import { createStore } from 'solid-js/store';
import * as z from 'zod/v4';
import { Temporal, Intl } from '@js-temporal/polyfill';
import { joinPaths, isRemotePath } from '@astrojs/internal-helpers/path';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import * as mime from 'mrmime';

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get Content () { return Content; },
  get default () { return Content; },
  get file () { return file; },
  get frontmatter () { return frontmatter; },
  get getHeadings () { return getHeadings; },
  get url () { return url; }
}, Symbol.toStringTag, { value: 'Module' }));

function isESMImportedImage(src) {
  return typeof src === "object" || typeof src === "function" && "src" in src;
}
function isRemoteImage(src) {
  return typeof src === "string";
}
async function resolveSrc(src) {
  if (typeof src === "object" && "then" in src) {
    const resource = await src;
    return resource.default ?? resource;
  }
  return src;
}

const firstBytes = /* @__PURE__ */ new Map([
  [0, "heif"],
  [56, "psd"],
  [66, "bmp"],
  [68, "dds"],
  [71, "gif"],
  [73, "tiff"],
  [77, "tiff"],
  [82, "webp"],
  [105, "icns"],
  [137, "png"],
  [255, "jpg"]
]);
function detector(input) {
  const byte = input[0];
  const type = firstBytes.get(byte);
  if (type && typeHandlers.get(type).validate(input)) {
    return type;
  }
  return types.find((imageType) => typeHandlers.get(imageType).validate(input));
}

function lookup(input) {
  const type = detector(input);
  if (typeof type !== "undefined") {
    const size = typeHandlers.get(type).calculate(input);
    if (size !== void 0) {
      size.type = size.type ?? type;
      return size;
    }
  }
  throw new TypeError("unsupported file type: " + type);
}

async function imageMetadata(data, src) {
  let result;
  try {
    result = lookup(data);
  } catch {
    throw new AstroError({
      ...NoImageMetadata,
      message: NoImageMetadata.message(src)
    });
  }
  if (!result.height || !result.width || !result.type) {
    throw new AstroError({
      ...NoImageMetadata,
      message: NoImageMetadata.message(src)
    });
  }
  const { width, height, type, orientation } = result;
  const isPortrait = (orientation || 0) >= 5;
  return {
    width: isPortrait ? height : width,
    height: isPortrait ? width : height,
    format: type,
    orientation
  };
}

async function inferRemoteSize(url, imageConfig) {
  if (!URL.canParse(url)) {
    throw new AstroError({
      ...FailedToFetchRemoteImageDimensions,
      message: FailedToFetchRemoteImageDimensions.message(url)
    });
  }
  const allowlistConfig = imageConfig ? {
    domains: imageConfig.domains ?? [],
    remotePatterns: imageConfig.remotePatterns ?? []
  } : void 0;
  if (!allowlistConfig) {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new AstroError({
        ...FailedToFetchRemoteImageDimensions,
        message: FailedToFetchRemoteImageDimensions.message(url)
      });
    }
  }
  if (allowlistConfig && !isRemoteAllowed(url, allowlistConfig)) {
    throw new AstroError({
      ...RemoteImageNotAllowed,
      message: RemoteImageNotAllowed.message(url)
    });
  }
  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    throw new AstroError({
      ...FailedToFetchRemoteImageDimensions,
      message: FailedToFetchRemoteImageDimensions.message(url)
    });
  }
  if (!response.body || !response.ok) {
    throw new AstroError({
      ...FailedToFetchRemoteImageDimensions,
      message: FailedToFetchRemoteImageDimensions.message(url)
    });
  }
  const reader = response.body.getReader();
  let done, value;
  let accumulatedChunks = new Uint8Array();
  while (!done) {
    const readResult = await reader.read();
    done = readResult.done;
    if (done) break;
    if (readResult.value) {
      value = readResult.value;
      let tmp = new Uint8Array(accumulatedChunks.length + value.length);
      tmp.set(accumulatedChunks, 0);
      tmp.set(value, accumulatedChunks.length);
      accumulatedChunks = tmp;
      try {
        const dimensions = await imageMetadata(accumulatedChunks, url);
        if (dimensions) {
          await reader.cancel();
          return dimensions;
        }
      } catch {
      }
    }
  }
  throw new AstroError({
    ...NoImageMetadata,
    message: NoImageMetadata.message(url)
  });
}

function validateArgs(args) {
  if (args.length !== 3) return false;
  if (!args[0] || typeof args[0] !== "object") return false;
  return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
  const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
  const fn = (...args) => {
    if (!validateArgs(args)) {
      throw new AstroError({
        ...InvalidComponentArgs,
        message: InvalidComponentArgs.message(name)
      });
    }
    return cb(...args);
  };
  Object.defineProperty(fn, "name", { value: name, writable: false });
  fn.isAstroComponentFactory = true;
  fn.moduleId = moduleId;
  fn.propagation = propagation;
  return fn;
}
function createComponentWithOptions(opts) {
  const cb = baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
  return cb;
}
function createComponent(arg1, moduleId, propagation) {
  if (typeof arg1 === "function") {
    return baseCreateComponent(arg1, moduleId, propagation);
  } else {
    return createComponentWithOptions(arg1);
  }
}

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

var _tmpl$$f = ["<a", ' href="', '" class="header-anchor">', "</a>"];
function toKebabCase(str) {
  return encodeURIComponent(str.replaceAll(/\s/g, "-").replaceAll("&", "").replaceAll(/-{1,}/g, "-").toLocaleLowerCase());
}
function Heading(props) {
  const id = toKebabCase("title" in props ? props.id ?? props.title : props.id);
  return createComponent$1(Dynamic, {
    get component() {
      return `h${props.level}`;
    },
    id,
    get children() {
      return ssr(_tmpl$$f, ssrHydrationKey(), `#${escape(id, true)}`, "title" in props ? escape(props.title) : escape(props.children));
    }
  });
}

var _tmpl$$e = ["<i", ' style="', '"></i>'];
function Icon(props) {
  const classes = (props.classes ?? []).concat(["fa-duotone", `fa-${props.icon}`]);
  return ssr(_tmpl$$e, ssrHydrationKey() + ssrAttribute("class", escape(classes.join(" "), true), false), ssrStyle(props.style));
}

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1, _b;
const frontmatter$e = {
  navigation: {
    group: "secondary",
    label: "Anreise",
    order: 1
  }
};
const $$Adresse = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_b || (_b = __template$1(['<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""><\/script><link rel="stylesheet" href="//unpkg.com/leaflet-gesture-handling/dist/leaflet-gesture-handling.min.css" integrity="sha256-LhJiGL8zdnwmqQgxK45GXouxZnYhMrDdor4wyLxKxSg=" crossorigin=""><script src="//unpkg.com/leaflet-gesture-handling" integrity="sha256-Z27Vo2NYi3eklYwgKkhgysoiRMJNOaBP+o4eF586vZ8=" crossorigin=""><\/script>', ""])), renderComponent($$result, "Layout", $$Layout, { "title": "Adresse", "metaTitle": "Adresse", "data-astro-cid-vwdpnl7m": true }, { "default": ($$result2) => renderTemplate(_a$1 || (_a$1 = __template$1(["", '<div class="content" data-astro-cid-vwdpnl7m><p data-astro-cid-vwdpnl7m>\nDie Luzerner Spieltage finden in den Räumlichkeiten der\n<a href="https://www.kathluzern.ch/meine-kirche/pfarreien-standorte/st-johannes" data-astro-cid-vwdpnl7m>\nPfarrei St. Johannes, Luzern\n</a>\nstatt. Die Lokalität ist in 10-15 Minuten bequem vom Luzerner Stadtzentrum\n      mit <strong data-astro-cid-vwdpnl7m>öffentlichen Verkehrsmitteln</strong> zu erreichen.\n</p><ul class="cluster" role="list" data-astro-cid-vwdpnl7m><li class="tag inverted" data-astro-cid-vwdpnl7m><a href="#anreise" data-astro-cid-vwdpnl7m>\nAnreise\n', '</a></li><li class="tag inverted" data-astro-cid-vwdpnl7m><a href="#raumaufteilung" data-astro-cid-vwdpnl7m>\nRaumaufteilung\n', '</a></li></ul></div><div id="map-big" class="full-width map" style="height: 60svh;" data-astro-cid-vwdpnl7m></div>', '<div class="dynamic-columns" data-astro-cid-vwdpnl7m><div class="content" data-astro-cid-vwdpnl7m>', "<p data-astro-cid-vwdpnl7m>Vom Bahnhof Luzern hast du viele Möglichkeiten zu uns zu gelangen:</p>", "<ul data-astro-cid-vwdpnl7m><li data-astro-cid-vwdpnl7m><strong data-astro-cid-vwdpnl7m>Bus 14 bis Schlösslihalde</strong> (Richtung Brüelstrasse)\n</li><li data-astro-cid-vwdpnl7m><strong data-astro-cid-vwdpnl7m>Bus 73 bis Schlösslihalde</strong> (Richtung Adligenswil)\n</li><li data-astro-cid-vwdpnl7m><strong data-astro-cid-vwdpnl7m>Bus 8 bis Würzenbachmatte</strong> (Richtung Würzenbach)\n</li><li data-astro-cid-vwdpnl7m><strong data-astro-cid-vwdpnl7m>Bus 6 bis Giseli</strong> (Richtung Büttenenhalde)\n</li></ul>", '<ul data-astro-cid-vwdpnl7m><li data-astro-cid-vwdpnl7m><strong data-astro-cid-vwdpnl7m>Bahnhof: Luzern Verkehrshaus</strong><br data-astro-cid-vwdpnl7m>\nDanach ca. 15 Minuten zu Fuss oder mit Bus 6 oder 8 zwei Haltestellen.\n</li></ul></div><div class="content" data-astro-cid-vwdpnl7m>', "<p data-astro-cid-vwdpnl7m>\nEs hat <strong data-astro-cid-vwdpnl7m>wenige und gebührenpflichtige Parkplätze</strong> in der Nähe.\n        Wir können nicht garantieren, dass diese frei sind. Deshalb empfehlen wir\n        grundsätzlich mit dem öffentlichen Verkehr anzureisen.\n</p>", '<a href="https://osm.org/go/0Cb8_hd9R?m=&way=586412904" style="border: none; padding: 0;" class="cluster" data-astro-cid-vwdpnl7m>', '<address data-astro-cid-vwdpnl7m>\nSchädrütistrasse 26<br data-astro-cid-vwdpnl7m>\n6006 Luzern\n</address></a></div></div><div id="map-small" class="full-width map" style="height: 70svh;" data-astro-cid-vwdpnl7m></div>', '<p data-astro-cid-vwdpnl7m>Die Luzerner Spieltage finden in zwei Räumen statt.</p><div class="dynamic-columns" data-astro-cid-vwdpnl7m><div class="content" data-astro-cid-vwdpnl7m>', '<p data-astro-cid-vwdpnl7m>\nDer grössere der beiden Räume. Hier findest du den Hauptteil unseres\n        Programms:\n<a href="/programm/freies-spielen" data-astro-cid-vwdpnl7m>\ndie Spielbibliothek, die Erklärbären, viel Platz zum Spielen\n</a> und der <a href="/#verpflegung" data-astro-cid-vwdpnl7m>Kiosk</a>.\n</p></div><div class="content" data-astro-cid-vwdpnl7m>', `<p data-astro-cid-vwdpnl7m>
Hier findest du den <a href="/flohmarkt" data-astro-cid-vwdpnl7m>Flohmarkt</a>,
<a href="/programm/spieldesigner" data-astro-cid-vwdpnl7m>Schweizer Spieldesigner</a>,
<a href="/programm/familien" data-astro-cid-vwdpnl7m>die Ludothek</a>
und diverses
<a href="/programm/organisiert" data-astro-cid-vwdpnl7m>Spezialprogramm</a>.
</p></div></div><script type="module">
    // Big

    const colorTiles = new L.TileLayer(
      "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
      {
        attribution: '<a href="https://map.geo.admin.ch">geo.admin.ch</a>',
      },
    );

    const mapBig = new L.Map("map-big", {
      center: [47.05042, 8.32674],
      zoom: 15,
      gestureHandling: true,
      layers: [colorTiles],
    });

    const markerBig = new L.Marker([47.055781, 8.344615]).addTo(mapBig);
    markerBig
      .bindPopup(
        "<b>Luzerner Spieltage</b><br>Pfarrei St. Johannes, Würzenbachsaal<br>Schädrütistrasse 22, Luzern",
      )
      .openPopup();

    // Small

    const grayTiles = new L.TileLayer(
      "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg",
      {
        attribution: '<a href="https://map.geo.admin.ch">geo.admin.ch</a>',
      },
    );
    const transportTiles = new L.TileLayer(
      "https://wmts.geo.admin.ch/1.0.0/ch.bav.haltestellen-oev/default/current/3857/{z}/{x}/{y}.png",
    );

    const mapSmall = new L.Map("map-small", {
      center: [47.055098, 8.344566],
      zoom: 18,
      gestureHandling: true,
      layers: [grayTiles, transportTiles],
    });

    const grayIcon = new L.Icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    new L.Marker([47.055781, 8.344615], {
      icon: grayIcon,
    })
      .addTo(mapSmall)
      .bindPopup("<b>Würzenbachsaal</b>", {
        closeOnClick: false,
        autoClose: false,
      })
      .openPopup();

    new L.Marker([47.055321, 8.345031], {
      icon: grayIcon,
    })
      .addTo(mapSmall)
      .bindPopup("<b>Unterkirche</b>", {
        closeOnClick: false,
        autoClose: false,
      })
      .openPopup();

    const schloesslihalde = new L.Marker([47.056089, 8.344255])
      .addTo(mapSmall)
      .bindPopup(
        "<b>Luzern, Schlösslihalde</b><br>Bus 14, Richtung <em>Brüelstrasse</em><br>Bus 73, Richtung <em>Adligenswil</em>",
        {
          closeOnClick: false,
          autoClose: false,
        },
      )
      .openPopup();

    const wuerzenbachmatte = new L.Marker([47.054777, 8.344067])
      .addTo(mapSmall)
      .bindPopup(
        "<b>Luzern, Würzenbachmatte</b><br>Bus 8, Richtung <em>Würzenbach</em>",
        {
          closeOnClick: false,
          autoClose: false,
        },
      )
      .openPopup();

    const giseli = new L.Marker([47.053649, 8.344588])
      .addTo(mapSmall)
      .bindPopup(
        "<b>Luzern, Giseli</b><br>Bus 6, Richtung <em>Büttenenhalde</em>",
        {
          closeOnClick: false,
          autoClose: false,
        },
      )
      .openPopup();
  <\/script>`])), maybeRenderHead(), renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 2, "title": "Anreise", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Öffentlicher Verkehr", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 4, "title": "Bus", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 4, "title": "Zug", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Auto", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 4, "title": "Adresse", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Icon", Icon, { "icon": "location-dot", "style": "font-size: 2em; align-self: center;", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 2, "title": "Raumaufteilung", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Würzenbachsaal (oben)", "data-astro-cid-vwdpnl7m": true }), renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Unterkirche (unten)", "data-astro-cid-vwdpnl7m": true })) }));
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/adresse.astro", void 0);

const $$file$5 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/adresse.astro";
const $$url$5 = "/adresse";

const _page$g = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Adresse,
  file: $$file$5,
  frontmatter: frontmatter$e,
  url: $$url$5
}, Symbol.toStringTag, { value: 'Module' }));

var _tmpl$$d = ["<label", "><!--$-->", "<!--/--><input", "", "", "></label>"];
function Input(props) {
  const propsWithDefaults = mergeProps({
    type: "text",
    required: true,
    isHoneypot: false
  }, props);
  return ssr(_tmpl$$d, ssrHydrationKey() + ssrAttribute("class", propsWithDefaults.isHoneypot ? "honey" : "", false), escape(propsWithDefaults.label), ssrAttribute("type", escape(propsWithDefaults.type, true), false) + ssrAttribute("name", escape(propsWithDefaults.name, true), false) + ssrAttribute("placeholder", escape(propsWithDefaults.label, true), false), ssrAttribute("required", propsWithDefaults.required, true) + ssrAttribute("value", escape(propsWithDefaults.value, true), false), ssrAttribute("disabled", props.disabled === true, true));
}
function InputWithRef(props) {
  const propsWithDefaults = mergeProps({
    type: "text",
    required: true,
    isHoneypot: false
  }, props);
  return ssr(_tmpl$$d, ssrHydrationKey() + ssrAttribute("class", propsWithDefaults.isHoneypot ? "honey" : "", false), escape(propsWithDefaults.label), ssrAttribute("type", escape(propsWithDefaults.type, true), false) + ssrAttribute("name", escape(propsWithDefaults.name, true), false) + ssrAttribute("placeholder", escape(propsWithDefaults.label, true), false), ssrAttribute("required", propsWithDefaults.required, true) + ssrAttribute("value", escape(propsWithDefaults.value, true), false), ssrAttribute("disabled", props.disabled === true, true));
}

var _tmpl$$c = ["<button", "", ">", "</button>"];
function Button(props) {
  const classes = () => {
    const cls = [];
    if (props.kind !== void 0) {
      cls.push(`button-${props.kind}`);
    } else if (props.disabled) {
      cls.push("button-gray");
    } else {
      cls.push("button-accent");
    }
    if (props.onClick === void 0 && props.type !== "submit") {
      cls.push("button-no-event");
    }
    if (props.kind === "ghost-danger") {
      cls.push("button-ghost");
      cls.push("button-danger");
    }
    return cls;
  };
  return ssr(_tmpl$$c, ssrHydrationKey() + ssrAttribute("type", escape(props.type, true) ?? "button", false) + ssrAttribute("class", escape(classes().join(" "), true), false), ssrAttribute("disabled", props.disabled === true, true) + ssrAttribute("title", escape(props.title, true), false), escape(props.label));
}
function IconOnlyButton(props) {
  const classes = () => {
    const cls = ["button-icon"];
    if (props.kind !== void 0) {
      cls.push(`button-${props.kind}`);
    } else if (props.disabled) {
      cls.push("button-gray");
    } else {
      cls.push("button-accent");
    }
    if (props.onClick === void 0) {
      cls.push("button-no-event");
    }
    if (props.kind === "ghost-danger") {
      cls.push("button-ghost");
      cls.push("button-danger");
    }
    return cls;
  };
  return ssr(_tmpl$$c, ssrHydrationKey() + ssrAttribute("type", escape(props.type, true) ?? "button", false) + ssrAttribute("class", escape(classes().join(" "), true), false), ssrAttribute("disabled", props.disabled === true, true) + ssrAttribute("title", escape(props.title, true), false), escape(createComponent$1(Icon, {
    get icon() {
      return props.icon;
    }
  })));
}

var _tmpl$$b = ["<a", ' class="', '"><!--$-->', "<!--/--><span> <!--$-->", "<!--/--></span></a>"], _tmpl$2$7 = ["<div", ' class="', '"><!--$-->', "<!--/--><span>", "</span><!--$-->", "<!--/--></div>"];
function Box(props) {
  return ssr(_tmpl$2$7, ssrHydrationKey(), `box-${escape(props.type, true) ?? "gray"} ${props.onClose !== void 0 ? "box-with-close" : ""}`, escape(createComponent$1(Show, {
    get when() {
      return props.onClose;
    },
    children: (cb) => createComponent$1(IconOnlyButton, {
      get onClick() {
        return cb();
      },
      icon: "circle-xmark",
      kind: "gray"
    })
  })), escape(props.children), escape(createComponent$1(Show, {
    get when() {
      return props.link !== void 0 && props.linkLabel !== void 0;
    },
    get children() {
      return ssr(_tmpl$$b, ssrHydrationKey() + ssrAttribute("href", escape(props.link, true) ?? "", false), `button button-small button-${escape(props.type, true) ?? "gray"}`, escape(createComponent$1(Icon, {
        icon: "arrow-turn-down-right",
        classes: ["event-icon"]
      })), escape(props.linkLabel));
    }
  })));
}

const locationSchema = z.object({
  label: z.string(),
  labelLong: z.nullable(z.string()),
  virtual: z.boolean(),
  url: z.nullable(z.url()),
  comment: z.nullable(z.string())
});
const organizerSchema = z.object({
  name: z.string(),
  url: z.nullable(z.string())
});
const eventDateTimeSchema = z.object({
  startDate: z.string(),
  endDate: z.string()
}).transform((val, ctx) => {
  const parsedStartDate = parsePlainDateOrTime(val.startDate);
  if (parsedStartDate.kind === "ERROR") {
    ctx.addIssue({
      code: "custom",
      message: parsedStartDate.message
    });
  }
  const parsedEndDate = parsePlainDateOrTime(val.endDate);
  if (parsedEndDate.kind === "ERROR") {
    ctx.addIssue({
      code: "custom",
      message: parsedEndDate.message
    });
  }
  if (parsedStartDate.kind === "ERROR" || parsedEndDate.kind === "ERROR") {
    return z.NEVER;
  }
  if (parsedStartDate.kind === "DATE" && parsedEndDate.kind === "DATE") {
    return {
      startDate: parsedStartDate.value,
      endDate: parsedEndDate.value
    };
  } else if (parsedStartDate.kind === "DATETIME" && parsedEndDate.kind === "DATETIME") {
    return {
      startDate: parsedStartDate.value,
      endDate: parsedEndDate.value
    };
  }
  ctx.addIssue({
    code: "custom",
    message: `Both dates must be either of type PlainDate or PlainDateTime but not mixed. "startDate": '${val.startDate}'; "endDate": '${val.endDate}'`
  });
  return z.NEVER;
});
function parsePlainDateOrTime(input) {
  const [date, time] = input.split("T");
  if (date === void 0) {
    return { kind: "ERROR", message: "Empty string" };
  }
  const [yearStr, monthStr, dayStr] = date.split("-");
  if (yearStr === void 0 || yearStr.length !== 4) {
    return {
      kind: "ERROR",
      message: `Invalid year '${yearStr}' in '${input}'`
    };
  }
  if (monthStr === void 0 || monthStr.length !== 2) {
    return {
      kind: "ERROR",
      message: `Invalid month '${monthStr}' in '${input}'`
    };
  }
  if (dayStr === void 0 || dayStr.length !== 2) {
    return { kind: "ERROR", message: `Invalid day '${dayStr}' in '${input}'` };
  }
  const [year, month, day] = [
    Number.parseInt(yearStr),
    Number.parseInt(monthStr),
    Number.parseInt(dayStr)
  ];
  if (time === void 0) {
    return {
      kind: "DATE",
      value: Temporal.PlainDate.from({
        year,
        month,
        day
      })
    };
  }
  const [hourStr, minuteStr, _secondStr] = time.split(":");
  if (hourStr === void 0 || hourStr.length !== 2) {
    return {
      kind: "ERROR",
      message: `Invalid hour '${hourStr}' in '${input}'`
    };
  }
  if (minuteStr === void 0 || minuteStr.length !== 2) {
    return {
      kind: "ERROR",
      message: `Invalid minute '${minuteStr}' in '${input}'`
    };
  }
  const [hour, minute] = [Number.parseInt(hourStr), Number.parseInt(minuteStr)];
  return {
    kind: "DATETIME",
    value: Temporal.PlainDateTime.from({
      year,
      month,
      day,
      hour,
      minute
    })
  };
}
function parsePlainTime(input) {
  const [hourStr, minuteStr, _secondStr] = input.split(":");
  if (hourStr === void 0 || hourStr.length !== 2) {
    return {
      kind: "ERROR",
      message: `Invalid hour '${hourStr}' in '${input}'`
    };
  }
  if (minuteStr === void 0 || minuteStr.length !== 2) {
    return {
      kind: "ERROR",
      message: `Invalid minute '${minuteStr}' in '${input}'`
    };
  }
  const [hour, minute] = [Number.parseInt(hourStr), Number.parseInt(minuteStr)];
  return {
    kind: "TIME",
    value: Temporal.PlainTime.from({
      hour,
      minute
    })
  };
}
z.object({
  uuid: z.uuid(),
  title: z.string(),
  description: z.nullable(z.string()),
  tags: z.array(z.string()),
  links: z.array(z.object({ label: z.string(), url: z.url() })),
  type: z.string(),
  location: locationSchema,
  organizer: organizerSchema,
  date: eventDateTimeSchema
});

new Intl.DateTimeFormat("de-CH", {
  dateStyle: "long"
});
new Intl.DateTimeFormat("de-CH", {
  timeStyle: "short",
  dateStyle: "long",
  timeZone: "Europe/Zurich"
});
function elysium(path) {
  return new URL(
    path,
    "https://elysium.gildedernacht.ch"
  );
}
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}

var _tmpl$$a = ["<a", ' href="/kontakt">Kontaktformular</a>'], _tmpl$2$6 = ["<a", ' href="/chat">Chat</a>'], _tmpl$3$5 = ["<form", " novalidate><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--><!--$-->", "<!--/--></form>"], _tmpl$4$3 = ["<a", ' href="/kontakt">kontaktiere uns direkt</a>'], _tmpl$5$2 = ["<div", ' style="margin-block-start:1rem;">', "</div>"];
function Anmeldung() {
  const [store, setStore] = createStore({
    form: {
      name: "",
      email: "",
      mobile: ""
    },
    showErrors: {
      nameMissing: false,
      emailMissing: false,
      emailInvalid: false,
      emailDuplicate: false,
      general: false
    },
    state: "IDLE"
  });
  return [ssr(_tmpl$3$5, ssrHydrationKey(), escape(createComponent$1(Input, {
    label: "Name",
    name: "name",
    get value() {
      return store.form.name;
    },
    onValueUpdate: (newValue) => {
      setStore("form", "name", newValue);
      setStore("showErrors", "nameMissing", false);
    }
  })), escape(createComponent$1(Show, {
    get when() {
      return store.showErrors.nameMissing;
    },
    get children() {
      return createComponent$1(Box, {
        type: "danger",
        children: "Dies ist ein Pflichtfeld."
      });
    }
  })), escape(createComponent$1(InputWithRef, {
    label: "E-Mail",
    name: "email",
    type: "email",
    get value() {
      return store.form.email;
    },
    onValueUpdate: (newValue) => {
      setStore("form", "email", newValue);
      setStore("showErrors", "emailMissing", false);
      setStore("showErrors", "emailInvalid", false);
    }
  })), escape(createComponent$1(Show, {
    get when() {
      return store.showErrors.emailMissing;
    },
    get children() {
      return createComponent$1(Box, {
        type: "danger",
        children: "Dies ist ein Pflichtfeld."
      });
    }
  })), escape(createComponent$1(Show, {
    get when() {
      return store.showErrors.emailInvalid;
    },
    get children() {
      return createComponent$1(Box, {
        type: "danger",
        children: "Die Eingabe scheint keine gültige E-Mail-Adresse zu sein."
      });
    }
  })), escape(createComponent$1(Show, {
    get when() {
      return store.showErrors.emailDuplicate;
    },
    get children() {
      return createComponent$1(Box, {
        type: "danger",
        get children() {
          return ["Diese E-Mail wird bereits verwendet. Du solltest einen persönlichen Link erhalten haben, um deine fortzusetzen. Benötigst du Hilfe, dann kontaktiere uns bitte über das", " ", ssr(_tmpl$$a, ssrHydrationKey()), " oder unseren", " ", ssr(_tmpl$2$6, ssrHydrationKey()), "."];
        }
      });
    }
  })), escape(createComponent$1(Input, {
    label: "Handynummer (optional)",
    name: "mobile",
    type: "tel",
    get value() {
      return store.form.mobile;
    },
    required: false,
    onValueUpdate: (newValue) => setStore("form", "mobile", newValue)
  })), escape(createComponent$1(Button, {
    type: "submit",
    get kind() {
      return store.state === "IDLE" ? "success" : "gray";
    },
    get label() {
      return store.state === "IDLE" ? "Anmeldung starten" : "Anmeldung wird gestartet";
    },
    get disabled() {
      return store.state === "LOADING";
    }
  }))), createComponent$1(Show, {
    get when() {
      return store.showErrors.general;
    },
    get children() {
      return ssr(_tmpl$5$2, ssrHydrationKey(), escape(createComponent$1(Box, {
        type: "danger",
        get children() {
          return ["Es gab ein Problem, das wir nicht erwartet haben. Bitte versuche es erneut oder ", ssr(_tmpl$4$3, ssrHydrationKey()), "."];
        }
      })));
    }
  })];
}

const frontmatter$d = {
  navigation: {
    group: "main",
    label: "Anmeldung",
    order: 6
  }
};
const $$Anmeldung = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "metaTitle": "Anmeldung" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 style="margin: 0;">Anmeldung</h1> <h2 style="margin: 0;">für organisierte Spielrunden</h2> <h2 style="margin: 0; margin-block-end: 1rem;">& zum Helfen</h2> <p>
Wir veranstalten diverse Spielrunden, die für Action und Spannung stehen.
    Komplexe oder tumultreiche Spiele, so wie Spiele mit hoher Spieleranzahl
    finden so ihren Platz. Das ist auch eine gute Gelegenheit, andere
    Mitspieler:innen zu finden, wenn du alleine anreist.
</p> <p>Du kannst dir hier bereits im Vorfeld einen Platz sichern!</p> <p> <i>
Hast du selbst ein Spiel, welches du für eine Gruppe anbiten möchtest?
      Dann kontaktiere uns via Kontaktformular.
</i> </p> <div style="margin-block: 2.5rem;"> <a href="/programm/organisiert" style="border: none;"> ${renderComponent($$result2, "Button", Button, { "label": "Zur Spielrunden-Übersicht", "onClick": (() => {
  }) })} </a> </div> ${renderComponent($$result2, "Box", Box, {}, { "default": ($$result3) => renderTemplate` <p>
Falls du bereits eine Anmeldung begonnen hast, dann solltest du eine
      E-Mail mit einem persönlichen Link erhalten haben. Dieser erlaubt es dir
      deine Anmeldung anzupassen.
</p> ` })} ${renderComponent($$result2, "A", Anmeldung, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@lst/components/anmeldung/pages/Anmeldung.tsx", "client:component-export": "Anmeldung" })} <div style="margin-block: 2.5rem;"> ${renderComponent($$result2, "Box", Box, { "type": "special" }, { "default": ($$result3) => renderTemplate` <p>
Deine persönlichen Daten werden ausschliesslich für die Luzerner
        Spieltage 2026 verwendet.
</p> <p>
Möchtest du auch nach dem Event über Anlässe von uns informiert werden,
        dann empfehlen wir dir, unseren <a href="/newsletter">Newsletter zu abonnieren</a>.
</p> ` })} </div> ` })}`;
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/anmeldung.astro", void 0);

const $$file$4 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/anmeldung.astro";
const $$url$4 = "/anmeldung";

const _page$f = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Anmeldung,
  file: $$file$4,
  frontmatter: frontmatter$d,
  url: $$url$4
}, Symbol.toStringTag, { value: 'Module' }));

var _tmpl$$9 = ["<a", ' class="', '"><!--$-->', "<!--/--><span> <!--$-->", "<!--/--></span></a>"];
function ButtonLink(props) {
  return ssr(_tmpl$$9, ssrHydrationKey() + ssrAttribute("href", escape(props.link, true), false), `button button-small button-${escape(props.kind, true) ?? "special"}`, escape(createComponent$1(Icon, {
    icon: "arrow-turn-down-right",
    classes: ["event-icon"]
  })), escape(props.label));
}

const MDXLayout$a = function ({children}) {
  const {layout, ...content} = frontmatter$c;
  content.file = file$a;
  content.url = url$a;
  return createVNode($$Layout, {
    file: file$a,
    url: url$a,
    content,
    frontmatter: content,
    headings: getHeadings$a(),
    'server:root': true,
    children
  });
};
const frontmatter$c = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Chat",
  "navigation": {
    "group": "secondary",
    "label": "Chat",
    "order": 1
  }
};
function getHeadings$a() {
  return [{
    "depth": 1,
    "slug": "chat",
    "text": "Chat"
  }, {
    "depth": 2,
    "slug": "probleme--unterstützung",
    "text": "Probleme / Unterstützung"
  }];
}
function _createMdxContent$a(props) {
  const _components = {
    a: "a",
    h1: "h1",
    h2: "h2",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "chat",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#chat",
        children: "Chat"
      })
    }), "\n", createVNode(_components.p, {
      children: ["Diskutiere direkt mit den Organisatoren und anderen Spielinteressierten auf ", createVNode(_components.strong, {
        children: "Discord"
      }), "."]
    }), "\n", createVNode(Box, {
      type: "success",
      children: createVNode(_components.p, {
        children: [createVNode(_components.a, {
          href: "https://discord.com/",
          children: createVNode(_components.strong, {
            children: "Discord"
          })
        }), " ist ein kostenloses Chatprogramm, das im Browser läuft aber auch als App installiert werden kann (Windows, macOS, Android, iOS etc.)."]
      })
    }), "\n", createVNode(_components.p, {
      children: "Auf Discord unterhalten wir uns zu den verschiedensten Themen: Rollenspiele, Brettspiele, Tabletop und viel Klatsch und Tratsch."
    }), "\n", createVNode(_components.p, {
      children: "Dieses Programm bietet uns sowohl Text- als auch Sprachchats."
    }), "\n", createVNode(ButtonLink, {
      link: "//chat.gildedernacht.ch",
      label: "trete unserem Discord-Server bei"
    }), "\n", createVNode(_components.h2, {
      id: "probleme--unterstützung",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#probleme--unterstützung",
        children: "Probleme / Unterstützung"
      })
    }), "\n", createVNode(_components.p, {
      children: ["Hast du Probleme mit Discord, kontaktiere uns bitte über das ", createVNode(_components.a, {
        href: "/kontakt",
        children: "Kontaktformular"
      }), " damit wir dich dabei unterstützen können."]
    })]
  });
}
function MDXContent$a(props = {}) {
  return createVNode(MDXLayout$a, {
    ...props,
    children: createVNode(_createMdxContent$a, {
      ...props
    })
  });
}

const url$a = "/chat";
const file$a = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/chat.mdx";
const Content$a = (props = {}) => MDXContent$a({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content$a[Symbol.for('mdx-component')] = true;
Content$a[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$c.layout);
Content$a.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/chat.mdx";
__astro_tag_component__(Content$a, 'astro:jsx');

const _page$e = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$a,
  default: Content$a,
  file: file$a,
  frontmatter: frontmatter$c,
  getHeadings: getHeadings$a,
  url: url$a
}, Symbol.toStringTag, { value: 'Module' }));

var _tmpl$$8 = ["<form", ' method="post"><!--$-->', "<!--/--><!--$-->", "<!--/--></form>"];
function Form(props) {
  const propsWithDefaults = mergeProps({
    language: "de",
    submitLabel: props.language === "en" ? "Submit" : "Absenden"
  }, props);
  let formElement;
  onMount(() => {
    formElement.setAttribute("novalidate", "");
    const redirects = formElement.querySelectorAll('input[name^="redirect"][type="hidden"]');
    [...redirects].forEach((redirect) => redirect.remove());
  });
  return ssr(_tmpl$$8, ssrHydrationKey() + ssrAttribute("action", escape(propsWithDefaults.actionUrl.href, true), false), escape(propsWithDefaults.children), escape(createComponent$1(Button, {
    type: "submit",
    get label() {
      return propsWithDefaults.submitLabel;
    }
  })));
}

var _tmpl$$7 = ["<label", "><!--$-->", "<!--/--><textarea", "", "", "></textarea></label>"];
function Textarea(props) {
  const propsWithDefaults = mergeProps({
    required: true
  }, props);
  return ssr(_tmpl$$7, ssrHydrationKey(), escape(propsWithDefaults.label), ssrAttribute("class", props.size === "small" ? "small" : "", false) + ssrAttribute("name", escape(propsWithDefaults.name, true), false) + ssrAttribute("placeholder", escape(propsWithDefaults.label, true), false), ssrAttribute("required", propsWithDefaults.required, true) + ssrAttribute("value", escape(propsWithDefaults.value, true), false), ssrAttribute("disabled", props.disabled === true, true));
}

var _tmpl$$6 = ["<input", ' type="hidden"', ">"];
function HiddenInput(props) {
  return ssr(_tmpl$$6, ssrHydrationKey(), ssrAttribute("name", escape(props.name, true), false) + ssrAttribute("value", escape(props.value, true), false));
}

var _tmpl$$5 = ["<br", ">"], _tmpl$2$5 = ["<p", ">", "</p>"];
function resetFormData$1() {
  return {
    name: "",
    email: "",
    captcha: "",
    message: ""
  };
}
function resetFieldErrors$1() {
  return {
    name: [],
    email: [],
    captcha: [],
    message: []
  };
}
const actionUrl$1 = elysium("/forms");
function ContactFormImpl(props) {
  const nameLabel = "Name";
  const emailLabel = props.language !== "en" ? "E-Mail" : "Email";
  const captchaLabel = props.language !== "en" ? "Bitte leer lassen" : "leave this field empty";
  const messageLabel = props.language !== "en" ? "Nachricht" : "Message";
  const [formData, setFormData] = createSignal(resetFormData$1());
  let emailInput;
  const [isSuccess, setSuccess] = createSignal(false);
  const [isErrorGeneral, setErrorGeneral] = createSignal(false);
  function onSuccess() {
    setErrorGeneral(false);
    setFormData(resetFormData$1());
    setSuccess(true);
  }
  function onError(err) {
    setSuccess(false);
    setErrorGeneral(true);
    console.error(err);
  }
  const [fieldErrors, setFieldErrors] = createSignal(resetFieldErrors$1());
  function updateField(fieldName) {
    return (newValue) => {
      setErrorGeneral(false);
      setFieldErrors(resetFieldErrors$1());
      setFormData((prev) => ({
        ...prev,
        [fieldName]: newValue
      }));
    };
  }
  function isValid(_formData) {
    setFieldErrors(resetFieldErrors$1());
    const isEnglish = props.language === "en";
    if (formData().name.trim().length === 0) {
      const msg = isEnglish ? "This is a mandatory field." : "Dies ist ein Pflichtfeld.";
      setFieldErrors((prev) => ({
        ...prev,
        name: [...prev.name, msg]
      }));
    }
    if (formData().email.trim().length === 0) {
      const msg = isEnglish ? "This is a mandatory field." : "Dies ist ein Pflichtfeld.";
      setFieldErrors((prev) => ({
        ...prev,
        email: [...prev.email, msg]
      }));
    }
    if (emailInput.validity.typeMismatch) {
      const msg = isEnglish ? "The input does not seem to be a valid email address." : "Die Eingabe scheint keine gültige E-Mail-Adresse zu sein.";
      setFieldErrors((prev) => ({
        ...prev,
        email: [...prev.email, msg]
      }));
    }
    if (formData().captcha.trim().length > 0) {
      const msg = isEnglish ? "This is field must be empty." : "Dieses Feld muss leer bleiben.";
      setFieldErrors((prev) => ({
        ...prev,
        captcha: [...prev.captcha, msg]
      }));
    }
    if (formData().message.trim().length === 0) {
      const msg = isEnglish ? "This is a mandatory field." : "Dies ist ein Pflichtfeld.";
      setFieldErrors((prev) => ({
        ...prev,
        message: [...prev.message, msg]
      }));
    }
    return fieldErrors().name.length === 0 && fieldErrors().email.length === 0 && fieldErrors().captcha.length === 0 && fieldErrors().message.length === 0;
  }
  return [createComponent$1(Form, {
    actionUrl: actionUrl$1,
    get language() {
      return props.language ?? "de";
    },
    isValid,
    onSuccess,
    onError,
    get children() {
      return [createComponent$1(Input, {
        label: nameLabel,
        name: "private-name",
        get value() {
          return formData().name;
        },
        get onValueUpdate() {
          return updateField("name");
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().name.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().name;
                },
                children: (error) => ssr(_tmpl$2$5, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), createComponent$1(InputWithRef, {
        label: emailLabel,
        name: "private-email",
        type: "email",
        get value() {
          return formData().email;
        },
        get onValueUpdate() {
          return updateField("email");
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().email.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().email;
                },
                children: (error) => ssr(_tmpl$2$5, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), createComponent$1(Input, {
        label: captchaLabel,
        name: "private-captcha",
        type: "email",
        required: false,
        isHoneypot: true,
        get value() {
          return formData().captcha;
        },
        get onValueUpdate() {
          return updateField("captcha");
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().captcha.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().captcha;
                },
                children: (error) => ssr(_tmpl$2$5, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), createComponent$1(Textarea, {
        label: messageLabel,
        name: "private-message",
        get value() {
          return formData().message;
        },
        get onValueUpdate() {
          return updateField("message");
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().message.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().message;
                },
                children: (error) => ssr(_tmpl$2$5, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), createComponent$1(Show, {
        get when() {
          return props.language;
        },
        children: (language) => createComponent$1(HiddenInput, {
          name: "language",
          get value() {
            return language();
          }
        })
      }), createComponent$1(Show, {
        get when() {
          return props.category;
        },
        children: (category) => createComponent$1(HiddenInput, {
          name: "category",
          get value() {
            return category();
          }
        })
      }), createComponent$1(Show, {
        get when() {
          return props.referer;
        },
        children: (referer) => createComponent$1(HiddenInput, {
          name: "referer",
          get value() {
            return referer().href;
          }
        })
      }), createComponent$1(Show, {
        get when() {
          return props.redirectOnSuccess;
        },
        children: (redirectOnSuccess) => createComponent$1(HiddenInput, {
          name: "redirect-on-success",
          get value() {
            return redirectOnSuccess().href;
          }
        })
      }), createComponent$1(Show, {
        get when() {
          return props.redirectOnFailure;
        },
        children: (redirectOnFailure) => createComponent$1(HiddenInput, {
          name: "redirect-on-failure",
          get value() {
            return redirectOnFailure().href;
          }
        })
      }), createComponent$1(Show, {
        get when() {
          return props.redirectOnSpam;
        },
        children: (redirectOnSpam) => createComponent$1(HiddenInput, {
          name: "redirect-on-spam",
          get value() {
            return redirectOnSpam().href;
          }
        })
      })];
    }
  }), createComponent$1(Show, {
    get when() {
      return isErrorGeneral();
    },
    get children() {
      return [ssr(_tmpl$$5, ssrHydrationKey()), createComponent$1(Box, {
        type: "danger",
        get children() {
          return createComponent$1(Switch, {
            fallback: "Leider konnten wir die Nachricht nicht absenden. Bitte versuche es erneut.",
            get children() {
              return createComponent$1(Match, {
                get when() {
                  return props.language === "en";
                },
                children: "There was a problem sending your message. Please try again."
              });
            }
          });
        }
      })];
    }
  }), createComponent$1(Show, {
    get when() {
      return isSuccess();
    },
    get children() {
      return [ssr(_tmpl$$5, ssrHydrationKey()), createComponent$1(Box, {
        type: "success",
        get children() {
          return createComponent$1(Switch, {
            fallback: "Nachricht wurde erfolgreich gesendet.",
            get children() {
              return createComponent$1(Match, {
                get when() {
                  return props.language === "en";
                },
                children: "Message successfully sent."
              });
            }
          });
        }
      })];
    }
  })];
}

const $$ContactForm = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ContactForm;
  const { language, category } = Astro2.props;
  const currentPage = Astro2.url;
  const redirectOnSuccess = new URL(currentPage);
  redirectOnSuccess.hash = "success";
  const redirectOnFailure = new URL(currentPage);
  redirectOnFailure.hash = "failure";
  const redirectOnSpam = new URL(currentPage);
  redirectOnSpam.hash = "spam";
  return renderTemplate`${renderComponent($$result, "ContactFormImpl", ContactFormImpl, { "language": language, "category": category, "referer": currentPage, "redirectOnSuccess": redirectOnSuccess, "redirectOnFailure": redirectOnFailure, "redirectOnSpam": redirectOnSpam, "client:load": true, "client:component-hydration": "load", "client:component-path": "@common/components/ContactFormImpl.tsx", "client:component-export": "ContactFormImpl" })} ${maybeRenderHead()}<div id="success" class="show-on-target" style="margin-block-start: 1rem;"> ${renderComponent($$result, "Box", Box, { "type": "success" }, { "default": ($$result2) => renderTemplate`${language === "en" ? "Message successfully sent." : "Nachricht wurde erfolgreich gesendet."}` })} </div> <div id="failure" class="show-on-target" style="margin-block-start: 1rem;"> ${renderComponent($$result, "Box", Box, { "type": "danger" }, { "default": ($$result2) => renderTemplate`${language === "en" ? "There was a problem sending your message. Please try again." : "Leider konnten wir die Nachricht nicht absenden. Bitte versuche es erneut."}` })} </div> <div id="spam" class="show-on-target" style="margin-block-start: 1rem;"> ${renderComponent($$result, "Box", Box, { "type": "danger" }, { "default": ($$result2) => renderTemplate`${language === "en" ? "Your message has been marked as spam and has not been sent. If this is a misunderstanding, please reload the page and try sending your message again." : "Deine Nachricht wurde als Spam markiert und nicht gesendet. Sollte dies ein Missverständnis sein, lade bitte die Seite neu und versuche es erneut, deine Nachricht zu senden."}` })} </div>`;
}, "/home/lvl8/Projects/gilde-website/common/components/ContactForm.astro", void 0);

const MDXLayout$9 = function ({children}) {
  const {layout, ...content} = frontmatter$b;
  content.file = file$9;
  content.url = url$9;
  return createVNode($$Layout, {
    file: file$9,
    url: url$9,
    content,
    frontmatter: content,
    headings: getHeadings$9(),
    'server:root': true,
    children
  });
};
const frontmatter$b = {
  "layout": "@lst/layouts/Layout.astro",
  "locale": "en"
};
function getHeadings$9() {
  return [{
    "depth": 1,
    "slug": "welcome",
    "text": "Welcome"
  }, {
    "depth": 3,
    "slug": "program",
    "text": "Program"
  }, {
    "depth": 3,
    "slug": "the-most-important-information-at-a-glance",
    "text": "The most important information at a glance"
  }, {
    "depth": 4,
    "slug": "opening-hours",
    "text": "Opening hours"
  }, {
    "depth": 4,
    "slug": "admission--registration",
    "text": "Admission & Registration"
  }, {
    "depth": 4,
    "slug": "arrival",
    "text": "Arrival"
  }, {
    "depth": 4,
    "slug": "food--beverages",
    "text": "Food & Beverages"
  }, {
    "depth": 2,
    "slug": "contact",
    "text": "Contact"
  }];
}
function _createMdxContent$9(props) {
  const _components = {
    a: "a",
    br: "br",
    em: "em",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(Box, {
      type: "success",
      link: "/",
      linkLabel: "go back to the German website",
      children: createVNode(_components.p, {
        children: "Looking for the German version?"
      })
    }), "\n", createVNode(_components.h1, {
      id: "welcome",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#welcome",
        children: "Welcome"
      })
    }), "\n", createVNode(_components.p, {
      children: ["On ", createVNode(_components.strong, {
        children: "Saturday and Sunday, March 14 and 15, 2026"
      }), " we will transform the ", createVNode(_components.a, {
        href: "/adresse",
        children: "Pfarreisaal St. Johannes"
      }), " into an oasis for players. Whether young or old, whether strategist or team player, whether hobbyist or enthusiasts, we have something for everyone on the menu. Apropos menu: a tasty meal will be provided."]
    }), "\n", createVNode(_components.h3, {
      id: "program",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#program",
        children: "Program"
      })
    }), "\n", createVNode(_components.p, {
      children: ["Come by and have one of the ", createVNode(_components.strong, {
        children: "numerous board games"
      }), " explained by us."]
    }), "\n", createVNode(_components.p, {
      children: ["Never tried a ", createVNode(_components.strong, {
        children: "roleplaying"
      }), " game before? At the event you get the opportunity to try it out."]
    }), "\n", createVNode(_components.p, {
      children: ["At our ", createVNode(_components.strong, {
        children: "flea market"
      }), " you will surely find a great game for your collection. Or bring your games that are looking for a new home."]
    }), "\n", createVNode(_components.p, {
      children: ["You can find more details on our ", createVNode(_components.a, {
        href: "/programm",
        children: "program page"
      }), "."]
    }), "\n", createVNode(_components.h3, {
      id: "the-most-important-information-at-a-glance",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#the-most-important-information-at-a-glance",
        children: "The most important information at a glance"
      })
    }), "\n", createVNode(_components.h4, {
      id: "opening-hours",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#opening-hours",
        children: "Opening hours"
      })
    }), "\n", createVNode(_components.p, {
      children: ["Saturday, 14 March 2026, 10 am to midnight.", createVNode(_components.br, {}), "\nSunday, 15 March 2026, 10 am to 6 pm", createVNode("sup", {
        children: "*"
      }), "."]
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.em, {
        children: "*The flea market closes at 5 p.m. on Sunday."
      })
    }), "\n", createVNode(_components.h4, {
      id: "admission--registration",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#admission--registration",
        children: "Admission & Registration"
      })
    }), "\n", createVNode(_components.p, {
      children: "Admission is free of charge and registration is not required."
    }), "\n", createVNode(_components.h4, {
      id: "arrival",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#arrival",
        children: "Arrival"
      })
    }), "\n", createVNode(_components.p, {
      children: ["The address is: ", createVNode(_components.a, {
        href: "/adresse",
        children: "Pfarrei St. Johannes, Schädrütistrasse 26, 6006 Luzern"
      })]
    }), "\n", createVNode(_components.p, {
      children: ["From the Lucerne train station, the premises are easily accessible in 15 minutes by ", createVNode(_components.strong, {
        children: "bus 8"
      }), " (get off at the ", createVNode(_components.em, {
        children: "Würzenbachmatte"
      }), " stop) or ", createVNode(_components.strong, {
        children: "bus 14"
      }), " (get off at the ", createVNode(_components.em, {
        children: "Schlösslihalde"
      }), " stop)."]
    }), "\n", createVNode(_components.p, {
      children: ["A (paid) parking garage is located a 5-minute walk away. Belongs to Migros at the address ", createVNode(_components.a, {
        href: "/adresse",
        children: "Würzenbachstrasse 19, Lucerne"
      }), "."]
    }), "\n", createVNode(_components.h4, {
      id: "food--beverages",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#food--beverages",
        children: "Food & Beverages"
      })
    }), "\n", createVNode(_components.p, {
      children: ["A kiosk will be available during opening hours and ", createVNode(_components.strong, {
        children: "at lunch and in the evening"
      }), " we will cook something delicious for you. We take orders until 11 a.m. (for lunch) and 5 p.m. (for dinner)."]
    }), "\n", createVNode(_components.h2, {
      id: "contact",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#contact",
        children: "Contact"
      })
    }), "\n", createVNode(_components.p, {
      children: "As only some parts of our website have been translated, there is a good chance you›ll have some questions. Don›t hesitate to contact us:"
    }), "\n", createVNode($$ContactForm, {
      category: "spieltage",
      language: "en"
    })]
  });
}
function MDXContent$9(props = {}) {
  return createVNode(MDXLayout$9, {
    ...props,
    children: createVNode(_createMdxContent$9, {
      ...props
    })
  });
}

const url$9 = "/en";
const file$9 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/en.mdx";
const Content$9 = (props = {}) => MDXContent$9({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content$9[Symbol.for('mdx-component')] = true;
Content$9[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$b.layout);
Content$9.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/en.mdx";
__astro_tag_component__(Content$9, 'astro:jsx');

const _page$d = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$9,
  default: Content$9,
  file: file$9,
  frontmatter: frontmatter$b,
  getHeadings: getHeadings$9,
  url: url$9
}, Symbol.toStringTag, { value: 'Module' }));

const VALID_SUPPORTED_FORMATS = [
  "jpeg",
  "jpg",
  "png",
  "tiff",
  "webp",
  "gif",
  "svg",
  "avif"
];
const DEFAULT_OUTPUT_FORMAT = "webp";
const DEFAULT_HASH_PROPS = [
  "src",
  "width",
  "height",
  "format",
  "quality",
  "fit",
  "position",
  "background"
];

const DEFAULT_RESOLUTIONS = [
  640,
  // older and lower-end phones
  750,
  // iPhone 6-8
  828,
  // iPhone XR/11
  960,
  // older horizontal phones
  1080,
  // iPhone 6-8 Plus
  1280,
  // 720p
  1668,
  // Various iPads
  1920,
  // 1080p
  2048,
  // QXGA
  2560,
  // WQXGA
  3200,
  // QHD+
  3840,
  // 4K
  4480,
  // 4.5K
  5120,
  // 5K
  6016
  // 6K
];
const LIMITED_RESOLUTIONS = [
  640,
  // older and lower-end phones
  750,
  // iPhone 6-8
  828,
  // iPhone XR/11
  1080,
  // iPhone 6-8 Plus
  1280,
  // 720p
  1668,
  // Various iPads
  2048,
  // QXGA
  2560
  // WQXGA
];
const getWidths = ({
  width,
  layout,
  breakpoints = DEFAULT_RESOLUTIONS,
  originalWidth
}) => {
  const smallerThanOriginal = (w) => !originalWidth || w <= originalWidth;
  if (layout === "full-width") {
    return breakpoints.filter(smallerThanOriginal);
  }
  if (!width) {
    return [];
  }
  const doubleWidth = width * 2;
  const maxSize = originalWidth ? Math.min(doubleWidth, originalWidth) : doubleWidth;
  if (layout === "fixed") {
    return originalWidth && width > originalWidth ? [originalWidth] : [width, maxSize];
  }
  if (layout === "constrained") {
    return [
      // Always include the image at 1x and 2x the specified width
      width,
      doubleWidth,
      ...breakpoints
    ].filter((w) => w <= maxSize).sort((a, b) => a - b);
  }
  return [];
};
const getSizesAttribute = ({
  width,
  layout
}) => {
  if (!width || !layout) {
    return void 0;
  }
  switch (layout) {
    // If screen is wider than the max size then image width is the max size,
    // otherwise it's the width of the screen
    case "constrained":
      return `(min-width: ${width}px) ${width}px, 100vw`;
    // Image is always the same width, whatever the size of the screen
    case "fixed":
      return `${width}px`;
    // Image is always the width of the screen
    case "full-width":
      return `100vw`;
    case "none":
    default:
      return void 0;
  }
};

function isLocalService(service) {
  if (!service) {
    return false;
  }
  return "transform" in service;
}
function parseQuality(quality) {
  let result = Number.parseInt(quality);
  if (Number.isNaN(result)) {
    return quality;
  }
  return result;
}
const sortNumeric = (a, b) => a - b;
function verifyOptions(options) {
  if (!options.src || !isRemoteImage(options.src) && !isESMImportedImage(options.src)) {
    throw new AstroError({
      ...ExpectedImage,
      message: ExpectedImage.message(
        JSON.stringify(options.src),
        typeof options.src,
        JSON.stringify(options, (_, v) => v === void 0 ? null : v)
      )
    });
  }
  if (!isESMImportedImage(options.src)) {
    if (options.src.startsWith("/@fs/") || !isRemotePath(options.src) && !options.src.startsWith("/")) {
      throw new AstroError({
        ...LocalImageUsedWrongly,
        message: LocalImageUsedWrongly.message(options.src)
      });
    }
    let missingDimension;
    if (!options.width && !options.height) {
      missingDimension = "both";
    } else if (!options.width && options.height) {
      missingDimension = "width";
    } else if (options.width && !options.height) {
      missingDimension = "height";
    }
    if (missingDimension) {
      throw new AstroError({
        ...MissingImageDimension,
        message: MissingImageDimension.message(missingDimension, options.src)
      });
    }
  } else {
    if (!VALID_SUPPORTED_FORMATS.includes(options.src.format)) {
      throw new AstroError({
        ...UnsupportedImageFormat,
        message: UnsupportedImageFormat.message(
          options.src.format,
          options.src.src,
          VALID_SUPPORTED_FORMATS
        )
      });
    }
    if (options.widths && options.densities) {
      throw new AstroError(IncompatibleDescriptorOptions);
    }
    if (options.src.format !== "svg" && options.format === "svg") {
      throw new AstroError(UnsupportedImageConversion);
    }
  }
}
const baseService = {
  validateOptions(options) {
    verifyOptions(options);
    if (!options.format) {
      if (isESMImportedImage(options.src) && options.src.format === "svg") {
        options.format = "svg";
      } else {
        options.format = DEFAULT_OUTPUT_FORMAT;
      }
    }
    if (options.width) options.width = Math.round(options.width);
    if (options.height) options.height = Math.round(options.height);
    if (options.layout) {
      delete options.layout;
    }
    if (options.fit === "none") {
      delete options.fit;
    }
    return options;
  },
  getHTMLAttributes(options) {
    const { targetWidth, targetHeight } = getTargetDimensions(options);
    const {
      src,
      width,
      height,
      format,
      quality,
      densities,
      widths,
      formats,
      layout,
      priority,
      fit,
      position,
      background,
      ...attributes
    } = options;
    return {
      ...attributes,
      width: targetWidth,
      height: targetHeight,
      loading: attributes.loading ?? "lazy",
      decoding: attributes.decoding ?? "async"
    };
  },
  getSrcSet(options) {
    const { targetWidth, targetHeight } = getTargetDimensions(options);
    const aspectRatio = targetWidth / targetHeight;
    const { widths, densities } = options;
    const targetFormat = options.format ?? DEFAULT_OUTPUT_FORMAT;
    let transformedWidths = (widths ?? []).sort(sortNumeric);
    let imageWidth = options.width;
    let maxWidth = Number.POSITIVE_INFINITY;
    if (isESMImportedImage(options.src)) {
      imageWidth = options.src.width;
      maxWidth = imageWidth;
      if (transformedWidths.length > 0 && transformedWidths.at(-1) > maxWidth) {
        transformedWidths = transformedWidths.filter((width) => width <= maxWidth);
        transformedWidths.push(maxWidth);
      }
    }
    transformedWidths = Array.from(new Set(transformedWidths));
    const {
      width: transformWidth,
      height: transformHeight,
      ...transformWithoutDimensions
    } = options;
    let allWidths = [];
    if (densities) {
      const densityValues = densities.map((density) => {
        if (typeof density === "number") {
          return density;
        } else {
          return Number.parseFloat(density);
        }
      });
      const densityWidths = densityValues.sort(sortNumeric).map((density) => Math.round(targetWidth * density));
      allWidths = densityWidths.map((width, index) => ({
        width,
        descriptor: `${densityValues[index]}x`
      }));
    } else if (transformedWidths.length > 0) {
      allWidths = transformedWidths.map((width) => ({
        width,
        descriptor: `${width}w`
      }));
    }
    return allWidths.map(({ width, descriptor }) => {
      const height = Math.round(width / aspectRatio);
      const transform = { ...transformWithoutDimensions, width, height };
      return {
        transform,
        descriptor,
        attributes: {
          type: `image/${targetFormat}`
        }
      };
    });
  },
  getURL(options, imageConfig) {
    const searchParams = new URLSearchParams();
    if (isESMImportedImage(options.src)) {
      searchParams.append("href", options.src.src);
    } else if (isRemoteAllowed(options.src, imageConfig)) {
      searchParams.append("href", options.src);
    } else {
      return options.src;
    }
    const params = {
      w: "width",
      h: "height",
      q: "quality",
      f: "format",
      fit: "fit",
      position: "position",
      background: "background"
    };
    Object.entries(params).forEach(([param, key]) => {
      options[key] && searchParams.append(param, options[key].toString());
    });
    const imageEndpoint = joinPaths("/", imageConfig.endpoint.route);
    let url = `${imageEndpoint}?${searchParams}`;
    if (imageConfig.assetQueryParams) {
      const assetQueryString = imageConfig.assetQueryParams.toString();
      if (assetQueryString) {
        url += "&" + assetQueryString;
      }
    }
    return url;
  },
  parseURL(url) {
    const params = url.searchParams;
    if (!params.has("href")) {
      return void 0;
    }
    const transform = {
      src: params.get("href"),
      width: params.has("w") ? Number.parseInt(params.get("w")) : void 0,
      height: params.has("h") ? Number.parseInt(params.get("h")) : void 0,
      format: params.get("f"),
      quality: params.get("q"),
      fit: params.get("fit"),
      position: params.get("position") ?? void 0,
      background: params.get("background") ?? void 0
    };
    return transform;
  },
  getRemoteSize(url, imageConfig) {
    return inferRemoteSize(url, imageConfig);
  }
};
function getTargetDimensions(options) {
  let targetWidth = options.width;
  let targetHeight = options.height;
  if (isESMImportedImage(options.src)) {
    const aspectRatio = options.src.width / options.src.height;
    if (targetHeight && !targetWidth) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else if (targetWidth && !targetHeight) {
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else if (!targetWidth && !targetHeight) {
      targetWidth = options.src.width;
      targetHeight = options.src.height;
    }
  }
  return {
    targetWidth,
    targetHeight
  };
}

function isImageMetadata(src) {
  return src.fsPath && !("fsPath" in src);
}

const PLACEHOLDER_BASE = "astro://placeholder";
function createPlaceholderURL(pathOrUrl) {
  return new URL(pathOrUrl, PLACEHOLDER_BASE);
}
function stringifyPlaceholderURL(url) {
  return url.href.replace(PLACEHOLDER_BASE, "");
}

const cssFitValues = ["fill", "contain", "cover", "scale-down"];
async function getConfiguredImageService() {
  if (!globalThis?.astroAsset?.imageService) {
    const { default: service } = await import(
      // @ts-expect-error
      './sharp_9hdvEH6A.mjs'
    ).catch((e) => {
      const error = new AstroError(InvalidImageService);
      error.cause = e;
      throw error;
    });
    if (!globalThis.astroAsset) globalThis.astroAsset = {};
    globalThis.astroAsset.imageService = service;
    return service;
  }
  return globalThis.astroAsset.imageService;
}
async function getImage$1(options, imageConfig) {
  if (!options || typeof options !== "object") {
    throw new AstroError({
      ...ExpectedImageOptions,
      message: ExpectedImageOptions.message(JSON.stringify(options))
    });
  }
  if (typeof options.src === "undefined") {
    throw new AstroError({
      ...ExpectedImage,
      message: ExpectedImage.message(
        options.src,
        "undefined",
        JSON.stringify(options)
      )
    });
  }
  if (isImageMetadata(options)) {
    throw new AstroError(ExpectedNotESMImage);
  }
  const service = await getConfiguredImageService();
  const resolvedOptions = {
    ...options,
    src: await resolveSrc(options.src)
  };
  let originalWidth;
  let originalHeight;
  if (resolvedOptions.inferSize) {
    delete resolvedOptions.inferSize;
    if (isRemoteImage(resolvedOptions.src) && isRemotePath(resolvedOptions.src)) {
      if (!isRemoteAllowed(resolvedOptions.src, imageConfig)) {
        throw new AstroError({
          ...RemoteImageNotAllowed,
          message: RemoteImageNotAllowed.message(resolvedOptions.src)
        });
      }
      const getRemoteSize = (url) => service.getRemoteSize?.(url, imageConfig) ?? inferRemoteSize(url, imageConfig);
      const result = await getRemoteSize(resolvedOptions.src);
      resolvedOptions.width ??= result.width;
      resolvedOptions.height ??= result.height;
      originalWidth = result.width;
      originalHeight = result.height;
    }
  }
  const originalFilePath = isESMImportedImage(resolvedOptions.src) ? resolvedOptions.src.fsPath : void 0;
  const clonedSrc = isESMImportedImage(resolvedOptions.src) ? (
    // @ts-expect-error - clone is a private, hidden prop
    resolvedOptions.src.clone ?? resolvedOptions.src
  ) : resolvedOptions.src;
  if (isESMImportedImage(clonedSrc)) {
    originalWidth = clonedSrc.width;
    originalHeight = clonedSrc.height;
  }
  if (originalWidth && originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    if (resolvedOptions.height && !resolvedOptions.width) {
      resolvedOptions.width = Math.round(resolvedOptions.height * aspectRatio);
    } else if (resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.height = Math.round(resolvedOptions.width / aspectRatio);
    } else if (!resolvedOptions.width && !resolvedOptions.height) {
      resolvedOptions.width = originalWidth;
      resolvedOptions.height = originalHeight;
    }
  }
  resolvedOptions.src = clonedSrc;
  const layout = options.layout ?? imageConfig.layout ?? "none";
  if (resolvedOptions.priority) {
    resolvedOptions.loading ??= "eager";
    resolvedOptions.decoding ??= "sync";
    resolvedOptions.fetchpriority ??= "high";
    delete resolvedOptions.priority;
  } else {
    resolvedOptions.loading ??= "lazy";
    resolvedOptions.decoding ??= "async";
    resolvedOptions.fetchpriority ??= void 0;
  }
  if (layout !== "none") {
    resolvedOptions.widths ||= getWidths({
      width: resolvedOptions.width,
      layout,
      originalWidth,
      breakpoints: imageConfig.breakpoints?.length ? imageConfig.breakpoints : isLocalService(service) ? LIMITED_RESOLUTIONS : DEFAULT_RESOLUTIONS
    });
    resolvedOptions.sizes ||= getSizesAttribute({ width: resolvedOptions.width, layout });
    delete resolvedOptions.densities;
    resolvedOptions["data-astro-image"] = layout;
    if (resolvedOptions.fit && cssFitValues.includes(resolvedOptions.fit)) {
      resolvedOptions["data-astro-image-fit"] = resolvedOptions.fit;
    }
    if (resolvedOptions.position) {
      resolvedOptions["data-astro-image-pos"] = resolvedOptions.position.replace(/\s+/g, "-");
    }
  }
  const validatedOptions = service.validateOptions ? await service.validateOptions(resolvedOptions, imageConfig) : resolvedOptions;
  const srcSetTransforms = service.getSrcSet ? await service.getSrcSet(validatedOptions, imageConfig) : [];
  const lazyImageURLFactory = (getValue) => {
    let cached = null;
    return () => cached ??= getValue();
  };
  const initialImageURL = await service.getURL(validatedOptions, imageConfig);
  let lazyImageURL = lazyImageURLFactory(() => initialImageURL);
  const matchesValidatedTransform = (transform) => transform.width === validatedOptions.width && transform.height === validatedOptions.height && transform.format === validatedOptions.format;
  let srcSets = await Promise.all(
    srcSetTransforms.map(async (srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesValidatedTransform(srcSet.transform) ? initialImageURL : await service.getURL(srcSet.transform, imageConfig),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    })
  );
  if (isLocalService(service) && globalThis.astroAsset.addStaticImage && !(isRemoteImage(validatedOptions.src) && initialImageURL === validatedOptions.src)) {
    const propsToHash = service.propertiesToHash ?? DEFAULT_HASH_PROPS;
    lazyImageURL = lazyImageURLFactory(
      () => globalThis.astroAsset.addStaticImage(validatedOptions, propsToHash, originalFilePath)
    );
    srcSets = srcSetTransforms.map((srcSet) => {
      return {
        transform: srcSet.transform,
        url: matchesValidatedTransform(srcSet.transform) ? lazyImageURL() : globalThis.astroAsset.addStaticImage(srcSet.transform, propsToHash, originalFilePath),
        descriptor: srcSet.descriptor,
        attributes: srcSet.attributes
      };
    });
  } else if (imageConfig.assetQueryParams) {
    const imageURLObj = createPlaceholderURL(initialImageURL);
    imageConfig.assetQueryParams.forEach((value, key) => {
      imageURLObj.searchParams.set(key, value);
    });
    lazyImageURL = lazyImageURLFactory(() => stringifyPlaceholderURL(imageURLObj));
    srcSets = srcSets.map((srcSet) => {
      const urlObj = createPlaceholderURL(srcSet.url);
      imageConfig.assetQueryParams.forEach((value, key) => {
        urlObj.searchParams.set(key, value);
      });
      return {
        ...srcSet,
        url: stringifyPlaceholderURL(urlObj)
      };
    });
  }
  return {
    rawOptions: resolvedOptions,
    options: validatedOptions,
    get src() {
      return lazyImageURL();
    },
    srcSet: {
      values: srcSets,
      attribute: srcSets.map((srcSet) => `${srcSet.url} ${srcSet.descriptor}`).join(", ")
    },
    attributes: service.getHTMLAttributes !== void 0 ? await service.getHTMLAttributes(validatedOptions, imageConfig) : {}
  };
}

Function.prototype.toString.call(Object);

const $$Image = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Image;
  const props = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  if (typeof props.width === "string") {
    props.width = Number.parseInt(props.width);
  }
  if (typeof props.height === "string") {
    props.height = Number.parseInt(props.height);
  }
  const layout = props.layout ?? imageConfig.layout ?? "none";
  if (layout !== "none") {
    props.layout ??= imageConfig.layout;
    props.fit ??= imageConfig.objectFit ?? "cover";
    props.position ??= imageConfig.objectPosition ?? "center";
  } else if (imageConfig.objectFit || imageConfig.objectPosition) {
    props.fit ??= imageConfig.objectFit;
    props.position ??= imageConfig.objectPosition;
  }
  const image = await getImage(props);
  const additionalAttributes = {};
  if (image.srcSet.values.length > 0) {
    additionalAttributes.srcset = image.srcSet.attribute;
  }
  const { class: className, ...attributes } = { ...additionalAttributes, ...image.attributes };
  return renderTemplate`${maybeRenderHead()}<img${addAttribute(image.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}>`;
}, "/home/lvl8/Projects/gilde-website/node_modules/astro/components/Image.astro", void 0);

const $$Picture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Picture;
  const defaultFormats = ["webp"];
  const defaultFallbackFormat = "png";
  const specialFormatsFallback = ["gif", "svg", "jpg", "jpeg"];
  const { formats = defaultFormats, pictureAttributes = {}, fallbackFormat, ...props } = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  const scopedStyleClass = props.class?.match(/\bastro-\w{8}\b/)?.[0];
  if (scopedStyleClass) {
    if (pictureAttributes.class) {
      pictureAttributes.class = `${pictureAttributes.class} ${scopedStyleClass}`;
    } else {
      pictureAttributes.class = scopedStyleClass;
    }
  }
  const layout = props.layout ?? imageConfig.layout ?? "none";
  const useResponsive = layout !== "none";
  if (useResponsive) {
    props.layout ??= imageConfig.layout;
    props.fit ??= imageConfig.objectFit ?? "cover";
    props.position ??= imageConfig.objectPosition ?? "center";
  } else if (imageConfig.objectFit || imageConfig.objectPosition) {
    props.fit ??= imageConfig.objectFit;
    props.position ??= imageConfig.objectPosition;
  }
  for (const key in props) {
    if (key.startsWith("data-astro-cid")) {
      pictureAttributes[key] = props[key];
    }
  }
  const originalSrc = await resolveSrc(props.src);
  const optimizedImages = await Promise.all(
    formats.map(
      async (format) => await getImage({
        ...props,
        src: originalSrc,
        format,
        widths: props.widths,
        densities: props.densities
      })
    )
  );
  const clonedSrc = isESMImportedImage(originalSrc) ? (
    // @ts-expect-error - clone is a private, hidden prop
    originalSrc.clone ?? originalSrc
  ) : originalSrc;
  let resultFallbackFormat = fallbackFormat ?? defaultFallbackFormat;
  if (!fallbackFormat && isESMImportedImage(clonedSrc) && specialFormatsFallback.includes(clonedSrc.format)) {
    resultFallbackFormat = clonedSrc.format;
  }
  const fallbackImage = await getImage({
    ...props,
    format: resultFallbackFormat,
    widths: props.widths,
    densities: props.densities
  });
  const imgAdditionalAttributes = {};
  const sourceAdditionalAttributes = {};
  if (props.sizes) {
    sourceAdditionalAttributes.sizes = props.sizes;
  }
  if (fallbackImage.srcSet.values.length > 0) {
    imgAdditionalAttributes.srcset = fallbackImage.srcSet.attribute;
  }
  const { class: className, ...attributes } = {
    ...imgAdditionalAttributes,
    ...fallbackImage.attributes
  };
  return renderTemplate`${maybeRenderHead()}<picture${spreadAttributes(pictureAttributes)}> ${Object.entries(optimizedImages).map(([_, image]) => {
    const srcsetAttribute = props.densities || !props.densities && !props.widths && !useResponsive ? `${image.src}${image.srcSet.values.length > 0 ? ", " + image.srcSet.attribute : ""}` : image.srcSet.attribute;
    return renderTemplate`<source${addAttribute(srcsetAttribute, "srcset")}${addAttribute(mime.lookup(image.options.format ?? image.src) ?? `image/${image.options.format}`, "type")}${spreadAttributes(sourceAdditionalAttributes)}>`;
  })}  <img${addAttribute(fallbackImage.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}> </picture>`;
}, "/home/lvl8/Projects/gilde-website/node_modules/astro/components/Picture.astro", void 0);

const componentDataByCssVariable = new Map([]);

function filterPreloads(data, preload) {
  if (!preload) {
    return null;
  }
  if (preload === true) {
    return data;
  }
  return data.filter(
    ({ weight, style, subset }) => preload.some((p) => {
      if (p.weight !== void 0 && weight !== void 0 && !checkWeight(p.weight.toString(), weight)) {
        return false;
      }
      if (p.style !== void 0 && p.style !== style) {
        return false;
      }
      if (p.subset !== void 0 && p.subset !== subset) {
        return false;
      }
      return true;
    })
  );
}
function checkWeight(input, target) {
  const trimmedInput = input.trim();
  if (trimmedInput.includes(" ")) {
    return trimmedInput === target;
  }
  if (target.includes(" ")) {
    const [a, b] = target.split(" ");
    const parsedInput = Number.parseInt(input);
    return parsedInput >= Number.parseInt(a) && parsedInput <= Number.parseInt(b);
  }
  return input === target;
}

const $$Font = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Font;
  const { cssVariable, preload = false } = Astro2.props;
  const data = componentDataByCssVariable.get(cssVariable);
  if (!data) {
    throw new AstroError({
      ...FontFamilyNotFound,
      message: FontFamilyNotFound.message(cssVariable)
    });
  }
  const filteredPreloadData = filterPreloads(data.preloads, preload);
  return renderTemplate`<style>${unescapeHTML(data.css)}</style>${filteredPreloadData?.map(({ url, type }) => renderTemplate`<link rel="preload"${addAttribute(url, "href")} as="font"${addAttribute(`font/${type}`, "type")} crossorigin>`)}`;
}, "/home/lvl8/Projects/gilde-website/node_modules/astro/components/Font.astro", void 0);

const assetQueryParams = undefined;
					const imageConfig = {"endpoint":{"route":"/_image"},"service":{"entrypoint":"astro/assets/services/sharp","config":{}},"domains":[],"remotePatterns":[],"responsiveStyles":false};
					Object.defineProperty(imageConfig, 'assetQueryParams', {
						value: assetQueryParams,
						enumerable: false,
						configurable: true,
					});
							const getImage = async (options) => await getImage$1(options, imageConfig);

const lst201908 = new Proxy({"src":"/_astro/2019-spieltage-08.C31enrqM.jpg","width":4896,"height":3264,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2019-spieltage-08.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2019-spieltage-08.jpg");
							return target[name];
						}
					});

var _tmpl$$4 = ["<div", ' class="', '">', "</div>"], _tmpl$2$4 = ["<div", ' class="image-text-left content">', "</div>"], _tmpl$3$4 = ["<div", ' class="image-text-right content">', "</div>"];
function ImageText(props) {
  return ssr(_tmpl$$4, ssrHydrationKey(), `image-text ${escape(props.kind, true)}`, escape(props.children));
}
function ImageTextLeft(props) {
  return ssr(_tmpl$2$4, ssrHydrationKey(), escape(props.children));
}
function ImageTextRight(props) {
  return ssr(_tmpl$3$4, ssrHydrationKey(), escape(props.children));
}

const MDXLayout$8 = function ({children}) {
  const {layout, ...content} = frontmatter$a;
  content.file = file$8;
  content.url = url$8;
  return createVNode($$Layout, {
    file: file$8,
    url: url$8,
    content,
    frontmatter: content,
    headings: getHeadings$8(),
    'server:root': true,
    children
  });
};
const frontmatter$a = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Flohmarkt",
  "navigation": {
    "group": "main",
    "label": "Flohmarkt",
    "order": 10
  }
};
function getHeadings$8() {
  return [{
    "depth": 1,
    "slug": "flohmarkt",
    "text": "Flohmarkt"
  }, {
    "depth": 2,
    "slug": "öffnungszeiten-flohmarkt",
    "text": "Öffnungszeiten Flohmarkt"
  }, {
    "depth": 2,
    "slug": "spiele-anmelden",
    "text": "Spiele anmelden"
  }, {
    "depth": 3,
    "slug": "ablauf-anmeldung",
    "text": "Ablauf Anmeldung"
  }, {
    "depth": 3,
    "slug": "abgabe",
    "text": "Abgabe"
  }, {
    "depth": 3,
    "slug": "abholen",
    "text": "Abholen"
  }];
}
const __usesAstroImage$3 = true;
function _createMdxContent$8(props) {
  const _components = {
    a: "a",
    "astro-image": "astro-image",
    br: "br",
    code: "code",
    em: "em",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    li: "li",
    ol: "ol",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...props.components
  }, _component0 = _components["astro-image"];
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "flohmarkt",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#flohmarkt",
        children: "Flohmarkt"
      })
    }), "\n", createVNode(Box, {
      type: "danger",
      children: [createVNode(_components.p, {
        children: createVNode(_components.strong, {
          children: "Wichtige Infos für Teilnehmer:innen und Besucher:innen des Flohmarkts:"
        })
      }), createVNode(_components.ul, {
        children: ["\n", createVNode(_components.li, {
          children: ["Der Flohmarkt schliesst am Sonntag bereits um ", createVNode(_components.strong, {
            children: "17 Uhr"
          }), " ", createVNode(_components.em, {
            children: "(eine Stunde früher als der restliche Event)"
          })]
        }), "\n", createVNode(_components.li, {
          children: ["Möchtest du ", createVNode(_components.strong, {
            children: "fünf oder mehr"
          }), " Artikel mitbringen, musst du diese im Vorfeld bei uns ", createVNode(_components.strong, {
            children: "korrekt anmelden"
          }), "."]
        }), "\n"]
      })]
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: [createVNode(_components.p, {
          children: "Du möchtest deine persönliche Spielesammlung aufstocken? Kein Problem, stöbere in unserem Flohmarkt. Die eine oder andere Perle wirst du bestimmt finden."
        }), createVNode(_components.p, {
          children: "Oder mache andern eine Freude indem du selbst Spiele anbietest welche du sowieso nicht mehr spielst. Der Flohmarkt wird von uns betreut und du kannst einfach sobald du gehst die übrig gebliebenen Spiele wieder Abholen."
        }), createVNode(_components.p, {
          children: createVNode(_components.em, {
            children: ["10% des Flohmarkt-Umsatzes gehen in die Vereinskasse der Organisatoren (", createVNode(_components.a, {
              href: "https://gildedernacht.ch/",
              children: "Gilde der Nacht"
            }), ")."]
          })
        })]
      }), createVNode(ImageTextRight, {
        children: createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "2018, Luzerner Spieltage",
            src: lst201908
          })
        })
      })]
    }), "\n", createVNode(_components.h2, {
      id: "öffnungszeiten-flohmarkt",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#öffnungszeiten-flohmarkt",
        children: "Öffnungszeiten Flohmarkt"
      })
    }), "\n", createVNode(_components.p, {
      children: [createVNode(_components.code, {
        children: "Samstag, 14. März 2026, 10 bis 24 Uhr"
      }), createVNode(_components.br, {}), "\n", createVNode(_components.code, {
        children: "Sonntag, 15. März 2026, 10 bis "
      }), createVNode("strong", {
        style: "color: var(--clr-danger-11);",
        children: createVNode(_components.code, {
          children: "17 Uhr"
        })
      })]
    }), "\n", createVNode(_components.h2, {
      id: "spiele-anmelden",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spiele-anmelden",
        children: "Spiele anmelden"
      })
    }), "\n", createVNode(_components.p, {
      children: ["Möchtest du ", createVNode(_components.strong, {
        children: "fünf oder mehr Spiele"
      }), " mitbringen, dann melde diese bitte bis am ", createVNode(_components.strong, {
        children: "Donnerstag, 12. März 2026"
      }), " bei uns an."]
    }), "\n", createVNode("a", {
      href: "/2026-luzerner-spieltage-flohmarkt-vorlage.ods",
      class: "button button-small button-gray",
      style: "justify-self: start; margin-block-end: 3rem;",
      children: [createVNode(Icon, {
        icon: "file-arrow-down",
        classes: ["event-icon"]
      }), createVNode("span", {
        children: "Vorlage herunterladen"
      })]
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: [createVNode(_components.h3, {
          id: "ablauf-anmeldung",
          children: createVNode(_components.a, {
            class: "header-anchor",
            href: "#ablauf-anmeldung",
            children: "Ablauf Anmeldung"
          })
        }), createVNode(_components.ol, {
          children: ["\n", createVNode(_components.li, {
            children: ["Lade ", createVNode(_components.a, {
              href: "/2026-luzerner-spieltage-flohmarkt-vorlage.ods",
              children: "unsere Vorlage"
            }), " herunter."]
          }), "\n", createVNode(_components.li, {
            children: ["Trage deine Spiele in dieses Dokument ein. ", createVNode(_components.em, {
              children: "(In einem Tabellenkalkulationsprogramm wie z.B. LibreOffice oder Excel)"
            })]
          }), "\n", createVNode(_components.li, {
            children: "Sende uns das ausgefüllte Dokument (bis am 12. März 2026) per E-Mail (Adresse in der Vorlage)."
          }), "\n", createVNode(_components.li, {
            children: "Wir kontrollieren das Dokument. Anschliessend werden wir jedem Eintrag eine Nummer zuteilen und dir die Liste nummeriert zurücksenden. Ausserdem senden wir dir eine generierte Beschriftungsvorlage."
          }), "\n", createVNode(_components.li, {
            children: "Beschrifte die Spiele entweder mit der Beschriftungsvorlage oder händisch."
          }), "\n"]
        })]
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.h3, {
          id: "abgabe",
          children: createVNode(_components.a, {
            class: "header-anchor",
            href: "#abgabe",
            children: "Abgabe"
          })
        }), createVNode(_components.p, {
          children: "Bringe deine beschrifteten Spiele mit zu den Luzerner Spieltagen."
        }), createVNode(_components.ul, {
          children: ["\n", createVNode(_components.li, {
            children: "Samstag, 14. März 2026, zwischen 9 bis 11 Uhr"
          }), "\n", createVNode(_components.li, {
            children: ["Freitagabend, 13. März 2026 ", createVNode(_components.strong, {
              children: "(informiere uns, wenn du am Freitagabend kommst)"
            })]
          }), "\n", createVNode(_components.li, {
            children: createVNode(_components.strong, {
              children: "Informiere uns, wenn du deine Spiele in einem anderem Zeitfenster bringen möchtest."
            })
          }), "\n"]
        }), createVNode(_components.h3, {
          id: "abholen",
          children: createVNode(_components.a, {
            class: "header-anchor",
            href: "#abholen",
            children: "Abholen"
          })
        }), createVNode(_components.p, {
          children: "Wenn du den Anlass verlässt, hole die nicht-verkauften Spiele bei uns wieder ab. Wir zahlen dir den Betrag der verkauften Spiele aus."
        }), createVNode(_components.ul, {
          children: ["\n", createVNode(_components.li, {
            children: "Jederzeit möglich."
          }), "\n", createVNode(_components.li, {
            children: ["Bitte bis ", createVNode(_components.strong, {
              children: "spätestens Sonntag, 15. März 2026, 17 Uhr"
            }), " vorbeikommen."]
          }), "\n"]
        })]
      })]
    })]
  });
}
function MDXContent$8(props = {}) {
  return createVNode(MDXLayout$8, {
    ...props,
    children: createVNode(_createMdxContent$8, {
      ...props
    })
  });
}

const url$8 = "/flohmarkt";
const file$8 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/flohmarkt.mdx";
const Content$8 = (props = {}) => MDXContent$8({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content$8[Symbol.for('mdx-component')] = true;
Content$8[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$a.layout);
Content$8.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/flohmarkt.mdx";
__astro_tag_component__(Content$8, 'astro:jsx');

const _page$c = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$8,
  __usesAstroImage: __usesAstroImage$3,
  default: Content$8,
  file: file$8,
  frontmatter: frontmatter$a,
  getHeadings: getHeadings$8,
  url: url$8
}, Symbol.toStringTag, { value: 'Module' }));

const MDXLayout$7 = function ({children}) {
  const {layout, ...content} = frontmatter$9;
  content.file = file$7;
  content.url = url$7;
  return createVNode($$Layout, {
    file: file$7,
    url: url$7,
    content,
    frontmatter: content,
    headings: getHeadings$7(),
    'server:root': true,
    children
  });
};
const frontmatter$9 = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Helfen",
  "navigation": {
    "group": "main",
    "label": "Helfen",
    "order": 50
  }
};
function getHeadings$7() {
  return [{
    "depth": 1,
    "slug": "helfen",
    "text": "Helfen"
  }, {
    "depth": 2,
    "slug": "anmeldung-helfer",
    "text": "Anmeldung Helfer"
  }];
}
function _createMdxContent$7(props) {
  const _components = {
    a: "a",
    h1: "h1",
    h2: "h2",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "helfen",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#helfen",
        children: "Helfen"
      })
    }), "\n", createVNode(_components.p, {
      children: "Die nächsten Luzerner Spieltage stehen vor der Tür."
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.strong, {
        children: "Und dazu brauchen wir dich!"
      })
    }), "\n", createVNode(_components.p, {
      children: "Am 14. + 15. März 2026 werden die Pforten zum Pfarreisaal St. Johannes im Würzenbach-Quartier wieder geöffnet."
    }), "\n", createVNode(_components.p, {
      children: ["Es würde uns sehr freuen wenn du uns bei einer der verschiedenen Tätigkeiten helfen kannst: ", createVNode(_components.strong, {
        children: "Kiosk-Kasse, Küche, Flohmarkt, Auf- und Abbau."
      })]
    }), "\n", createVNode(_components.p, {
      children: "Unser Ziel ist es, die Helfereinsätze so kurz wie möglich zu halten. Aber dafür sind wir auf viele Helfer angewiesen."
    }), "\n", createVNode(_components.p, {
      children: "Als Gegenleistung gebührt dir nicht nur unser aller Dank, sondern du wirst auch zum Helferessen eingeladen. Da werden wir mit Speis und Trank bis in die Abendstunden das eine oder andere Brettspiel-Abenteuer bestehen."
    }), "\n", createVNode(_components.h2, {
      id: "anmeldung-helfer",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#anmeldung-helfer",
        children: "Anmeldung Helfer"
      })
    }), "\n", createVNode(_components.p, {
      children: "Wir freuen uns auf deine Anmeldung und bedanken uns bereits jetzt für deine Unterstützung!"
    }), "\n", createVNode(_components.p, {
      children: "Du kannst dich direkt online für ein Zeitfenster eintragen:"
    }), "\n", createVNode(ButtonLink, {
      link: "/anmeldung",
      label: "Zur Anmeldung für Helfer:innen"
    })]
  });
}
function MDXContent$7(props = {}) {
  return createVNode(MDXLayout$7, {
    ...props,
    children: createVNode(_createMdxContent$7, {
      ...props
    })
  });
}

const url$7 = "/helfen";
const file$7 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/helfen.mdx";
const Content$7 = (props = {}) => MDXContent$7({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content$7[Symbol.for('mdx-component')] = true;
Content$7[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$9.layout);
Content$7.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/helfen.mdx";
__astro_tag_component__(Content$7, 'astro:jsx');

const _page$b = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$7,
  default: Content$7,
  file: file$7,
  frontmatter: frontmatter$9,
  getHeadings: getHeadings$7,
  url: url$7
}, Symbol.toStringTag, { value: 'Module' }));

const lst202401 = new Proxy({"src":"/_astro/2024-spieltage-01.--JeYbjs.jpg","width":5115,"height":3410,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2024-spieltage-01.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2024-spieltage-01.jpg");
							return target[name];
						}
					});

const lst202203 = new Proxy({"src":"/_astro/2022-spieltage-03.BBcjZxuX.jpg","width":6000,"height":4000,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2022-spieltage-03.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2022-spieltage-03.jpg");
							return target[name];
						}
					});

const lst201810 = new Proxy({"src":"/_astro/2018-spieltage-10.Bl-J2t6r.jpg","width":4896,"height":3264,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2018-spieltage-10.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2018-spieltage-10.jpg");
							return target[name];
						}
					});

const __0_______images_2022_spieltage_06_jpg__ = new Proxy({"src":"/_astro/2022-spieltage-06.DY__xmzi.jpg","width":6000,"height":4000,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2022-spieltage-06.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2022-spieltage-06.jpg");
							return target[name];
						}
					});

const lst202208 = new Proxy({"src":"/_astro/2022-spieltage-08.Bqsc0Y74.jpg","width":6000,"height":4000,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2022-spieltage-08.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2022-spieltage-08.jpg");
							return target[name];
						}
					});

const $$ReferenceGilde = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ReferenceGilde;
  const { event } = Astro2.props;
  const VARS = {
    LST: {
      eventName: "Luzerner Spieltage",
      date: "13. und 14. März 2027"
    },
    RST: {
      eventName: "Luzerner Rollenspieltage"
      /* date: "22. und 23. August 2026", */
    }
  };
  const vars = VARS[event];
  return renderTemplate`${renderComponent($$result, "Box", Box, { "type": "success", "link": "https://gildedernacht.ch/", "linkLabel": "Zur Gilde der Nacht" }, { "default": ($$result2) => renderTemplate`
Ist dir das zu wenig Programm? Dann schau doch bei der Gilde der Nacht rein,
  den Organisatoren der ${vars.eventName}.
${"date" in vars ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<br>
Und merk dir unbedingt das Datum fürs nächste Jahr:${" "}<strong>${vars.date}</strong>.
` })}` : null}` })}`;
}, "/home/lvl8/Projects/gilde-website/common/components/ReferenceGilde.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "data-astro-cid-d6jc5ro2": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="hero" data-astro-cid-d6jc5ro2> <ul class="cluster" role="list" data-astro-cid-d6jc5ro2> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="#öffnungszeiten" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Icon", Icon, { "icon": "calendar-days", "data-astro-cid-d6jc5ro2": true })}
14. + 15. März 2026
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="#eintritt-anmeldung" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Icon", Icon, { "icon": "ticket", "data-astro-cid-d6jc5ro2": true })} Eintritt kostenfrei
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="/adresse" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Icon", Icon, { "icon": "location-smile", "data-astro-cid-d6jc5ro2": true })} Schädrütistrasse 26, Luzern
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> </ul> <ul class="big-grid" role="list" data-astro-cid-d6jc5ro2> <li data-astro-cid-d6jc5ro2> <a href="/programm/freies-spielen" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Picture", $$Picture, { "src": lst202401, "formats": ["avif", "webp", "jpg"], "alt": "2024, Luzerner Spieltage", "data-astro-cid-d6jc5ro2": true })} <span class="tag" data-astro-cid-d6jc5ro2>
Freies Spielen
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </span> </a> </li> <li data-astro-cid-d6jc5ro2> <a href="/programm/organisiert" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Picture", $$Picture, { "src": lst202203, "formats": ["avif", "webp", "jpg"], "alt": "2022, Luzerner Spieltage", "data-astro-cid-d6jc5ro2": true })} <span class="tag" data-astro-cid-d6jc5ro2>
Organisierte Spiele
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </span> </a> </li> <li data-astro-cid-d6jc5ro2> <a href="/flohmarkt" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Picture", $$Picture, { "src": lst201908, "formats": ["avif", "webp", "jpg"], "alt": "2019, Luzerner Spieltage", "data-astro-cid-d6jc5ro2": true })} <span class="tag" data-astro-cid-d6jc5ro2>
Flohmarkt
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </span> </a> </li> <li data-astro-cid-d6jc5ro2> <a href="#verpflegung" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Picture", $$Picture, { "src": lst201810, "formats": ["avif", "webp", "jpg"], "alt": "2018, Luzerner Spieltage", "data-astro-cid-d6jc5ro2": true })} <span class="tag" data-astro-cid-d6jc5ro2>
Verpflegung
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </span> </a> </li> <li data-astro-cid-d6jc5ro2> <a href="/programm/familien" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Picture", $$Picture, { "src": __0_______images_2022_spieltage_06_jpg__, "formats": ["avif", "webp", "jpg"], "alt": "2022, Luzerner Spieltage", "data-astro-cid-d6jc5ro2": true })} <span class="tag" data-astro-cid-d6jc5ro2>
Familiensonntag
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </span> </a> </li> <li data-astro-cid-d6jc5ro2> <a href="/programm/spieldesigner" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Picture", $$Picture, { "src": lst202208, "formats": ["avif", "webp", "jpg"], "alt": "2022, Luzerner Spieltage", "data-astro-cid-d6jc5ro2": true })} <span class="tag" data-astro-cid-d6jc5ro2>
Spieldesigner
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </span> </a> </li> </ul> <ul class="cluster" role="list" data-astro-cid-d6jc5ro2> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="/programm" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Icon", Icon, { "icon": "list-radio", "data-astro-cid-d6jc5ro2": true })} Programm entdecken
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="/helfen" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Icon", Icon, { "icon": "hand-heart", "data-astro-cid-d6jc5ro2": true })} Hilf mit
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="/kontakt" data-astro-cid-d6jc5ro2> ${renderComponent($$result2, "Icon", Icon, { "icon": "mailbox", "data-astro-cid-d6jc5ro2": true })} Schreib uns eine Nachricht
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> </ul> </div> ${renderComponent($$result2, "Heading", Heading, { "level": 1, "id": "herzlich-willkommen", "data-astro-cid-d6jc5ro2": true }, { "default": ($$result3) => renderTemplate`
Herzlich willkommen <br data-astro-cid-d6jc5ro2>
an den Luzerner Spieltage 2026
` })} <p data-astro-cid-d6jc5ro2>
Am
<strong data-astro-cid-d6jc5ro2> Samstag, 14. und Sonntag, 15. März 2026 </strong>
verwandeln wir den <a href="/adresse" data-astro-cid-d6jc5ro2>Würzenbachsaal</a>
in eine Oase für Spielerinnen und Spieler. Ob jung oder alt, ob Stratege oder
    Teamplayer, ob Bastler oder Geniesser, wir haben für jeden was auf dem Speiseplan.
    Apropos Speiseplan: für dein kulinarisches Wohl ist auch gesorgt.
</p> <p data-astro-cid-d6jc5ro2>
Falls du Fragen hast oder an den Spieltagen <a href="/helfen" data-astro-cid-d6jc5ro2><strong data-astro-cid-d6jc5ro2>mithelfen</strong></a>
möchtest, zögere nicht, uns über das <a href="/kontakt" data-astro-cid-d6jc5ro2>Kontaktformular</a>
anzuschreiben. Wir freuen uns auf deine Nachricht.
</p> ${renderComponent($$result2, "Heading", Heading, { "level": 2, "title": "Die wichtigsten Informationen auf einen Blick", "id": "wichtige-infos", "data-astro-cid-d6jc5ro2": true })} ${renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Öffnungszeiten", "data-astro-cid-d6jc5ro2": true })} <p data-astro-cid-d6jc5ro2> <code data-astro-cid-d6jc5ro2>
Samstag, 14. März 2026, 10 bis 24 Uhr <br data-astro-cid-d6jc5ro2>
Sonntag, 15. März 2026, 10 bis 18 Uhr<sup data-astro-cid-d6jc5ro2>*</sup> </code> </p> <p data-astro-cid-d6jc5ro2> <em data-astro-cid-d6jc5ro2>*Der Flohmarkt schliesst am Sonntag bereits um 17 Uhr.</em> </p> ${renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Eintritt & Anmeldung", "data-astro-cid-d6jc5ro2": true })} <p data-astro-cid-d6jc5ro2>
Der Eintritt ist kostenfrei und eine Anmeldung ist nicht nötig. Bei gewissem
    Spezialprogramm hat es begrenzte Plätze, für die du dich im Vorfeld anmelden
    kannst.
</p> <ul class="cluster" role="list" data-astro-cid-d6jc5ro2> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="/programm" data-astro-cid-d6jc5ro2>
zum Programm
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> </ul> ${renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Anreise", "data-astro-cid-d6jc5ro2": true })} <p data-astro-cid-d6jc5ro2>Die Adresse lautet: Schädrütistrasse 26 6006 Luzern.</p> <ul class="cluster" role="list" data-astro-cid-d6jc5ro2> <li class="tag inverted" data-astro-cid-d6jc5ro2> <a href="/adresse" data-astro-cid-d6jc5ro2>
alle Informationen zur Lokalität und Anreise
${renderComponent($$result2, "Icon", Icon, { "icon": "chevrons-right", "data-astro-cid-d6jc5ro2": true })} </a> </li> </ul> ${renderComponent($$result2, "Heading", Heading, { "level": 3, "title": "Verpflegung", "data-astro-cid-d6jc5ro2": true })} <p data-astro-cid-d6jc5ro2>
Ein Kiosk mit Getränken und Snacks steht während den Öffnungszeiten zur
    Verfügung und am Mittag und am Abend kochen wir etwas Leckeres für euch,
    inkl. Optionen für Veganer.
</p> <p data-astro-cid-d6jc5ro2>
Wir kochen auf <strong data-astro-cid-d6jc5ro2>Vorbestellungen</strong>, welche wir vor Ort
    aufnehmen werden. Gib bitte für das Mittagessen bis 11 Uhr und für das
    Nachtessen (am Samstag) bis 17 Uhr an der Kasse deine Bestellung auf.
</p> <p data-astro-cid-d6jc5ro2> <em data-astro-cid-d6jc5ro2>Speisen und Getränke können Bar oder per Twint bezahlt werden.</em> </p> ${renderComponent($$result2, "ReferenceGilde", $$ReferenceGilde, { "event": "LST", "data-astro-cid-d6jc5ro2": true })} ` })}`;
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/index.astro", void 0);

const $$file$3 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/index.astro";
const $$url$3 = "";

const _page$a = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file$3,
  url: $$url$3
}, Symbol.toStringTag, { value: 'Module' }));

const MDXLayout$6 = function ({children}) {
  const {layout, ...content} = frontmatter$8;
  content.file = file$6;
  content.url = url$6;
  return createVNode($$Layout, {
    file: file$6,
    url: url$6,
    content,
    frontmatter: content,
    headings: getHeadings$6(),
    'server:root': true,
    children
  });
};
const frontmatter$8 = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Kontakt",
  "navigation": {
    "group": "secondary",
    "label": "Kontakt",
    "order": 99
  }
};
function getHeadings$6() {
  return [{
    "depth": 1,
    "slug": "kontakt",
    "text": "Kontakt"
  }];
}
function _createMdxContent$6(props) {
  const _components = {
    a: "a",
    h1: "h1",
    p: "p",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "kontakt",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#kontakt",
        children: "Kontakt"
      })
    }), "\n", createVNode(_components.p, {
      children: "Wir lesen gerne von dir und antworten dir sobald als möglich."
    }), "\n", createVNode($$ContactForm, {
      category: "spieltage"
    })]
  });
}
function MDXContent$6(props = {}) {
  return createVNode(MDXLayout$6, {
    ...props,
    children: createVNode(_createMdxContent$6, {
      ...props
    })
  });
}

const url$6 = "/kontakt";
const file$6 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/kontakt.mdx";
const Content$6 = (props = {}) => MDXContent$6({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content$6[Symbol.for('mdx-component')] = true;
Content$6[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$8.layout);
Content$6.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/kontakt.mdx";
__astro_tag_component__(Content$6, 'astro:jsx');

const _page$9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$6,
  default: Content$6,
  file: file$6,
  frontmatter: frontmatter$8,
  getHeadings: getHeadings$6,
  url: url$6
}, Symbol.toStringTag, { value: 'Module' }));

const $$MeineAnmeldung = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "metaTitle": "Meine Anmeldung" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h1>Meine Anmeldung</h1> ${renderComponent($$result2, "MeineAnmeldungWrapper", null, { "client:only": true, "client:component-hydration": "only", "client:component-path": "@lst/components/anmeldung/pages/MyRegistrationPage.tsx", "client:component-export": "MeineAnmeldungWrapper" })} ` })}`;
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/meine-anmeldung.astro", void 0);

const $$file$2 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/meine-anmeldung.astro";
const $$url$2 = "/meine-anmeldung";

const _page$8 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$MeineAnmeldung,
  file: $$file$2,
  url: $$url$2
}, Symbol.toStringTag, { value: 'Module' }));

var _tmpl$$3 = ["<ul", ' role="list" class="checkbox-list">', "</ul>"], _tmpl$2$3 = ["<li", ">", "</li>"], _tmpl$3$3 = ["<label", ' class="input-checkbox"><input type="checkbox"', "", "", "><div><!--$-->", "<!--/--><!--$-->", "<!--/--></div></label>"], _tmpl$4$2 = ["<div", ' class="checkbox-description">', "</div>"];
function CheckboxGroup(props) {
  return ssr(_tmpl$$3, ssrHydrationKey(), escape(createComponent$1(For, {
    get each() {
      return props.items;
    },
    children: (checkbox) => ssr(_tmpl$2$3, ssrHydrationKey(), escape(createComponent$1(Checkbox, {
      get label() {
        return checkbox.label;
      },
      get name() {
        return checkbox.name;
      },
      get value() {
        return checkbox.value;
      },
      get checked() {
        return checkbox.checked;
      },
      onValueUpdate: (value) => props.onValueUpdate(checkbox.value, value),
      get disabled() {
        return checkbox.disabled;
      }
    })))
  })));
}
function Checkbox(props) {
  return ssr(_tmpl$3$3, ssrHydrationKey(), ssrAttribute("name", escape(props.name, true), false) + ssrAttribute("value", escape(props.value, true), false), ssrAttribute("checked", props.checked, true), ssrAttribute("disabled", props.disabled === true, true), escape(props.label), escape(createComponent$1(Show, {
    get when() {
      return props.description;
    },
    children: (description) => ssr(_tmpl$4$2, ssrHydrationKey(), escape(description()))
  })));
}

var _tmpl$$2 = ["<ul", ' role="list" class="', '">', "</ul>"], _tmpl$2$2 = ["<li", ">", "</li>"], _tmpl$3$2 = ["<label", ' class="input-radio"><input type="radio"', "", "><!--$-->", "<!--/--></label>"];
function RadioGroup(props) {
  const layout = props.layout ?? "vertical";
  return ssr(_tmpl$$2, ssrHydrationKey(), `radio-list ${escape(layout, true)}`, escape(createComponent$1(For, {
    get each() {
      return props.items;
    },
    children: (radio) => ssr(_tmpl$2$2, ssrHydrationKey(), escape(createComponent$1(Radio, {
      get label() {
        return radio.label;
      },
      get name() {
        return `${radio.value}-${props.name}`;
      },
      get value() {
        return radio.value;
      },
      get checked() {
        return radio.checked;
      },
      onValueUpdate: () => props.onValueUpdate(radio.value)
    })))
  })));
}
function Radio(props) {
  return ssr(_tmpl$3$2, ssrHydrationKey(), ssrAttribute("name", escape(props.name, true), false) + ssrAttribute("value", escape(props.value, true), false), ssrAttribute("checked", props.checked, true), escape(props.label));
}

var _tmpl$$1 = ["<h2", ">Thema</h2>"], _tmpl$2$1 = ["<p", ">Wähle mindestens ein Thema aus, das dich interessiert.<br>Ansonsten wirst du keine E-Mails erhalten.</p>"], _tmpl$3$1 = ["<h2", ">Häufigkeit</h2>"], _tmpl$4$1 = ["<p", ">Wenn du dich für weniger häufigere E-Mails entscheidest <em>(maximal 8 E-Mails / Jahr)</em>,<br>werden wir dich hauptsächlich über grössere Events informieren.</p>"], _tmpl$5$1 = ["<br", ">"], _tmpl$6$1 = ["<p", ">", "</p>"];
const actionUrl = new URL("https://gildedernacht.us9.list-manage.com/subscribe/post?u=ac8c826d7db864c54a3c2f001&amp;id=c6bec31754");
function resetFormData(props) {
  return {
    firstName: "",
    lastName: "",
    email: "",
    themeBrettspiele: props.theme === "Brettspiele",
    themeRollenspiele: props.theme === "Rollenspiele",
    themeTabletop: props.theme === "Tabletop",
    frequency: props.frequency ?? "selten"
  };
}
function resetFieldErrors() {
  return {
    firstName: [],
    lastName: [],
    email: [],
    themeBrettspiele: [],
    themeRollenspiele: [],
    themeTabletop: [],
    frequency: []
  };
}
function NewsletterImpl(props) {
  const [formData, setFormData] = createSignal(resetFormData(props));
  const [isSuccess, setSuccess] = createSignal(false);
  const [isErrorGeneral, setErrorGeneral] = createSignal(false);
  function updateField(fieldName) {
    return (newValue) => {
      setErrorGeneral(false);
      setFieldErrors(resetFieldErrors());
      setFormData((prev) => ({
        ...prev,
        [fieldName]: newValue
      }));
    };
  }
  const checkboxValues = {
    BRETTSPIELE: "128",
    ROLLENSPIELE: "256",
    TABLETOP: "512"
  };
  const checkboxGroup = () => {
    return {
      items: [{
        label: "Brettspiele",
        name: "group[48105][128]",
        value: checkboxValues.BRETTSPIELE,
        checked: formData().themeBrettspiele
      }, {
        label: "Rollenspiele",
        name: "group[48105][256]",
        value: checkboxValues.ROLLENSPIELE,
        checked: formData().themeRollenspiele
      }, {
        label: "Tabletop",
        name: "group[48105][512]",
        value: checkboxValues.TABLETOP,
        checked: formData().themeTabletop
      }],
      onValueUpdate: (value, checked) => {
        switch (value) {
          case checkboxValues.BRETTSPIELE:
            updateField("themeBrettspiele")(checked);
            break;
          case checkboxValues.ROLLENSPIELE:
            updateField("themeRollenspiele")(checked);
            break;
          case checkboxValues.TABLETOP:
            updateField("themeTabletop")(checked);
            break;
        }
      }
    };
  };
  const radioValues = {
    OFT: "1024",
    SELTEN: "2048"
  };
  const radioGroup = () => {
    return {
      items: [{
        label: "maximal 2 E-Mails / Monat",
        value: radioValues.OFT,
        checked: formData().frequency === "oft"
      }, {
        label: "maximal 8 E-Mails / Jahr",
        value: radioValues.SELTEN,
        checked: formData().frequency === "selten"
      }],
      name: "group[48109]",
      onValueUpdate: (value) => {
        switch (value) {
          case radioValues.OFT:
            updateField("frequency")("oft");
            break;
          case radioValues.SELTEN:
            updateField("frequency")("selten");
            break;
        }
      }
    };
  };
  let emailInput;
  const [fieldErrors, setFieldErrors] = createSignal(resetFieldErrors());
  function isValid(_formData) {
    setFieldErrors(resetFieldErrors());
    if (formData().firstName.trim().length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        firstName: ["Dies ist ein Pflichtfeld."]
      }));
    }
    if (formData().lastName.trim().length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        lastName: ["Dies ist ein Pflichtfeld."]
      }));
    }
    if (formData().email.trim().length === 0) {
      const msg = "Dies ist ein Pflichtfeld.";
      setFieldErrors((prev) => ({
        ...prev,
        email: [...prev.email, msg]
      }));
    }
    if (emailInput.validity.typeMismatch) {
      const msg = "Die Eingabe scheint keine gültige E-Mail-Adresse zu sein.";
      setFieldErrors((prev) => ({
        ...prev,
        email: [...prev.email, msg]
      }));
    }
    if (!(formData().themeBrettspiele || formData().themeRollenspiele || formData().themeTabletop)) {
      const msg = "Mindestens ein Thema muss ausgewählt werden, um E-Mails zu erhalten.";
      setFieldErrors((prev) => ({
        ...prev,
        themeTabletop: [...prev.themeTabletop, msg]
      }));
    }
    return fieldErrors().firstName.length === 0 && fieldErrors().lastName.length === 0 && fieldErrors().email.length === 0 && fieldErrors().themeBrettspiele.length === 0 && fieldErrors().themeRollenspiele.length === 0 && fieldErrors().themeTabletop.length === 0 && fieldErrors().frequency.length === 0;
  }
  function onSuccess() {
    setSuccess(true);
    setFormData(resetFormData(props));
  }
  function onError(err) {
    setErrorGeneral(true);
    console.error(err);
  }
  return [createComponent$1(Form, {
    actionUrl,
    submitLabel: "Abonnieren",
    isValid,
    onSuccess,
    onError,
    get children() {
      return [createComponent$1(Input, {
        label: "Vorname",
        name: "FNAME",
        get value() {
          return formData().firstName;
        },
        get onValueUpdate() {
          return updateField("firstName");
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().firstName.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().firstName;
                },
                children: (error) => ssr(_tmpl$6$1, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), createComponent$1(Input, {
        label: "Nachname",
        name: "LNAME",
        get value() {
          return formData().lastName;
        },
        get onValueUpdate() {
          return updateField("lastName");
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().lastName.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().lastName;
                },
                children: (error) => ssr(_tmpl$6$1, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), createComponent$1(InputWithRef, {
        label: "E-Mail-Adresse",
        type: "email",
        name: "EMAIL",
        get value() {
          return formData().email;
        },
        get onValueUpdate() {
          return updateField("email");
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().email.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().email;
                },
                children: (error) => ssr(_tmpl$6$1, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), ssr(_tmpl$$1, ssrHydrationKey()), ssr(_tmpl$2$1, ssrHydrationKey()), createComponent$1(CheckboxGroup, {
        get items() {
          return checkboxGroup().items;
        },
        get onValueUpdate() {
          return checkboxGroup().onValueUpdate;
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().themeTabletop.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().themeTabletop;
                },
                children: (error) => ssr(_tmpl$6$1, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), ssr(_tmpl$3$1, ssrHydrationKey()), ssr(_tmpl$4$1, ssrHydrationKey()), createComponent$1(RadioGroup, {
        get items() {
          return radioGroup().items;
        },
        get name() {
          return radioGroup().name;
        },
        get onValueUpdate() {
          return radioGroup().onValueUpdate;
        }
      }), createComponent$1(Show, {
        get when() {
          return fieldErrors().frequency.length > 0;
        },
        get children() {
          return createComponent$1(Box, {
            type: "danger",
            get children() {
              return createComponent$1(For, {
                get each() {
                  return fieldErrors().frequency;
                },
                children: (error) => ssr(_tmpl$6$1, ssrHydrationKey(), escape(error))
              });
            }
          });
        }
      }), createComponent$1(Show, {
        get when() {
          return props.referer;
        },
        children: (referer) => createComponent$1(HiddenInput, {
          name: "FORMLOC",
          get value() {
            return referer().href;
          }
        })
      })];
    }
  }), createComponent$1(Show, {
    get when() {
      return isErrorGeneral();
    },
    get children() {
      return [ssr(_tmpl$5$1, ssrHydrationKey()), createComponent$1(Box, {
        type: "danger",
        children: "Wir hatten mit einigen technischen Problemen zu kämpfen. Bitte versuchen Sie es erneut."
      })];
    }
  }), createComponent$1(Show, {
    get when() {
      return isSuccess();
    },
    get children() {
      return [ssr(_tmpl$5$1, ssrHydrationKey()), createComponent$1(Box, {
        type: "success",
        children: "Du hast dich erfolgreich in unseren Newsletter eingetragen."
      })];
    }
  })];
}

const $$Newsletter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Newsletter;
  const { theme, frequency } = Astro2.props;
  const currentPage = Astro2.url;
  return renderTemplate`${renderComponent($$result, "NewsletterImpl", NewsletterImpl, { "theme": theme, "frequency": frequency, "referer": currentPage })}`;
}, "/home/lvl8/Projects/gilde-website/common/components/Newsletter.astro", void 0);

const MDXLayout$5 = function ({children}) {
  const {layout, ...content} = frontmatter$7;
  content.file = file$5;
  content.url = url$5;
  return createVNode($$Layout, {
    file: file$5,
    url: url$5,
    content,
    frontmatter: content,
    headings: getHeadings$5(),
    'server:root': true,
    children
  });
};
const frontmatter$7 = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Newsletter",
  "navigation": {
    "group": "secondary",
    "label": "Newsletter",
    "order": 5
  }
};
function getHeadings$5() {
  return [{
    "depth": 1,
    "slug": "erinnerungs-newsletter",
    "text": "Erinnerungs-Newsletter"
  }];
}
function _createMdxContent$5(props) {
  const _components = {
    a: "a",
    h1: "h1",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "erinnerungs-newsletter",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#erinnerungs-newsletter",
        children: "Erinnerungs-Newsletter"
      })
    }), "\n", createVNode($$Newsletter, {
      frequency: "selten",
      theme: "Brettspiele"
    })]
  });
}
function MDXContent$5(props = {}) {
  return createVNode(MDXLayout$5, {
    ...props,
    children: createVNode(_createMdxContent$5, {
      ...props
    })
  });
}

const url$5 = "/newsletter";
const file$5 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/newsletter.mdx";
const Content$5 = (props = {}) => MDXContent$5({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content$5[Symbol.for('mdx-component')] = true;
Content$5[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$7.layout);
Content$5.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/newsletter.mdx";
__astro_tag_component__(Content$5, 'astro:jsx');

const _page$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$5,
  default: Content$5,
  file: file$5,
  frontmatter: frontmatter$7,
  getHeadings: getHeadings$5,
  url: url$5
}, Symbol.toStringTag, { value: 'Module' }));

const __0____images_partner_Logo_Ludothek_Luzern_png__ = new Proxy({"src":"/_astro/Logo_Ludothek-Luzern.Ck-jS_gj.png","width":439,"height":80,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/partner/Logo_Ludothek-Luzern.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/partner/Logo_Ludothek-Luzern.png");
							return target[name];
						}
					});

const __1____images_Ludothek_Foto_jpg__ = new Proxy({"src":"/_astro/Ludothek_Foto.CHzYZI3P.jpg","width":2048,"height":1536,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/Ludothek_Foto.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/Ludothek_Foto.jpg");
							return target[name];
						}
					});

const __2____images_partner_Logo_Spielbude_jpg__ = new Proxy({"src":"/_astro/Logo_Spielbude.CM5WR7Eq.jpg","width":1024,"height":283,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/partner/Logo_Spielbude.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/partner/Logo_Spielbude.jpg");
							return target[name];
						}
					});

const __3____images_Spielbude_Foto_jpg__ = new Proxy({"src":"/_astro/Spielbude_Foto.BVLP3ze8.jpg","width":3069,"height":2457,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/Spielbude_Foto.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/Spielbude_Foto.jpg");
							return target[name];
						}
					});

function createSvgComponent({ meta, attributes, children }) {
  const Component = createComponent((_, props) => {
    const normalizedProps = normalizeProps(attributes, props);
    return renderTemplate`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
  });
  Object.defineProperty(Component, "toJSON", {
    value: () => meta,
    enumerable: false
  });
  return Object.assign(Component, meta);
}
const ATTRS_TO_DROP = ["xmlns", "xmlns:xlink", "version"];
const DEFAULT_ATTRS = {};
function dropAttributes(attributes) {
  for (const attr of ATTRS_TO_DROP) {
    delete attributes[attr];
  }
  return attributes;
}
function normalizeProps(attributes, props) {
  return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

const __4____images_partner_Logo_Gameorama_svg__ = createSvgComponent({"meta":{"src":"/_astro/Logo_Gameorama.npa605Um.svg","width":303,"height":208,"format":"svg"},"attributes":{"id":"Ebene_1","x":"0px","y":"0px","viewBox":"0 0 303.4 207.6","enable-background":"new 0 0 303.4 207.6","xml:space":"preserve"},"children":"\n<g>\n\t<g>\n\t\t<path fill=\"#FFCC00\" d=\"M28,182.8c-0.6,0.2-1.1,0.4-1.5,0.6c-0.4,0.1-0.8,0.3-1.2,0.4s-1,0.3-1.7,0.5c-1.3,0.3-2.5,0.5-3.8,0.7\n\t\t\tc-1.3,0.2-2.6,0.2-4,0.2c-2.8,0-5.4-0.5-7.8-1.5c-2.4-1-4.3-2.6-5.7-4.8c-1.4-2.2-2.2-4.8-2.2-8c0-2,0.4-4,1.1-6\n\t\t\tc0.7-2,1.9-3.5,3.4-4.7c1.3-1,2.5-1.7,3.8-2.2c1.3-0.5,2.5-0.9,3.8-1c1.2-0.2,2.6-0.3,4.1-0.3c2.4,0,4.5,0.2,6,0.5\n\t\t\tc1.6,0.4,3.3,0.9,5.2,1.5v6.6c-1.3-0.7-2.6-1.3-4-1.8s-3.1-0.7-5.2-0.7c-2.4,0-4.3,0.5-5.8,1.4c-1.4,0.9-2.5,2-3,3.3\n\t\t\tc-0.6,1.3-0.9,2.5-0.9,3.7c0,1.4,0.3,2.7,1,3.9c0.7,1.2,1.6,2.1,3,2.8s2.9,1.1,4.8,1.1c1.1,0,2.2-0.1,3.4-0.4V175h-3.8v-5.6H28\n\t\t\tV182.8z\" />\n\t\t<path fill=\"#FFCC00\" d=\"M64.4,184.8h-8.6l-2.3-5.6H41.6l-2.3,5.6h-8.6L43,157h9.2L64.4,184.8z M51.7,174.3l-4.1-10.1l-4.1,10.1\n\t\t\tH51.7z\" />\n\t\t<path fill=\"#FFCC00\" d=\"M100.4,184.8H92v-16.1l-7.5,9.3h-0.7l-7.6-9.3v16.1h-8.1V157h7.6l8.5,10.4l8.6-10.4h7.6V184.8z\" />\n\t\t<path fill=\"#FFCC00\" d=\"M128.3,184.8h-20.9V157H128v5.6h-12.2v5.1h11.7v5.6h-11.7v5.9h12.6V184.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M163.6,170.9c0,2.6-0.6,5-1.8,7.1c-1.2,2.2-3,3.9-5.3,5.2s-5.2,1.9-8.6,1.9c-3.4,0-6.3-0.7-8.7-2\n\t\t\tc-2.4-1.3-4.1-3.1-5.3-5.3s-1.7-4.5-1.7-7c0-2.5,0.6-4.8,1.7-7c1.1-2.2,2.9-3.9,5.3-5.2c2.4-1.3,5.3-2,8.7-2\n\t\t\tc2.6,0,4.8,0.4,6.9,1.1s3.7,1.8,5,3.1c1.3,1.3,2.3,2.8,2.9,4.5C163.3,167.1,163.6,169,163.6,170.9z M155.1,170.9\n\t\t\tc0-1-0.2-2-0.5-2.9c-0.3-0.9-0.8-1.6-1.4-2.2c-0.6-0.6-1.4-1.1-2.3-1.5c-0.9-0.4-1.9-0.5-3.1-0.5c-2.2,0-4,0.7-5.3,2\n\t\t\ts-1.9,3-1.9,5.1s0.6,3.8,1.9,5.2s3,2,5.3,2c1.5,0,2.8-0.3,3.9-0.9c1.1-0.6,1.9-1.4,2.5-2.5C154.8,173.5,155.1,172.2,155.1,170.9z\" />\n\t\t<path fill=\"#262F38\" d=\"M195.7,184.8h-9l-2.2-4.9c-0.8-1.8-1.5-3.1-2.2-4c-0.6-0.8-1.3-1.4-1.9-1.6c-0.6-0.2-1.4-0.3-2.4-0.3h-0.9\n\t\t\tv10.8h-8.4V157h14.2c2.3,0,4.2,0.5,5.6,1.4c1.5,0.9,2.5,2.1,3.2,3.4c0.6,1.3,1,2.6,1,3.8c0,1.4-0.3,2.6-0.8,3.6\n\t\t\tc-0.5,1-1.1,1.7-1.7,2.1s-1.3,0.9-2,1.3c0.9,0.5,1.6,1.1,2.2,1.9c0.6,0.7,1.4,2.2,2.4,4.3L195.7,184.8z M184.3,165.8\n\t\t\tc0-1.3-0.4-2.2-1.3-2.7c-0.8-0.5-2.2-0.8-4.1-0.8h-1.8v6.7h1.8c2,0,3.4-0.2,4.2-0.7C183.9,167.9,184.3,167,184.3,165.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M230,184.8h-8.6l-2.3-5.6h-12.1l-2.3,5.6h-8.6l12.3-27.7h9.2L230,184.8z M217.2,174.3l-4.1-10.1l-4.1,10.1\n\t\t\tH217.2z\" />\n\t\t<path fill=\"#262F38\" d=\"M265.9,184.8h-8.4v-16.1L250,178h-0.7l-7.6-9.3v16.1h-8.1V157h7.6l8.5,10.4l8.6-10.4h7.6V184.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M303.4,184.8h-8.6l-2.3-5.6h-12.1l-2.3,5.6h-8.6l12.3-27.7h9.2L303.4,184.8z M290.6,174.3l-4.1-10.1\n\t\t\tl-4.1,10.1H290.6z\" />\n\t</g>\n\t<g>\n\t\t<path fill=\"#262F38\" d=\"M45.9,193.8h2v13.6h-2V193.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M52.4,198.5v1.1c0.8-0.9,1.7-1.3,2.7-1.3c0.6,0,1.1,0.1,1.6,0.4s0.8,0.7,1.1,1.2s0.4,1.3,0.4,2.4v5.1h-1.8\n\t\t\tv-5.1c0-0.9-0.1-1.6-0.4-2s-0.7-0.6-1.4-0.6c-0.8,0-1.6,0.4-2.1,1.3v6.4h-1.8v-9H52.4z\" />\n\t\t<path fill=\"#262F38\" d=\"M59.4,199.9l3.3-3.3v1.9h2.8v1.6h-2.8v4.4c0,1,0.4,1.5,1.3,1.5c0.6,0,1.3-0.2,2-0.6v1.7\n\t\t\tc-0.7,0.4-1.4,0.6-2.2,0.6c-0.8,0-1.5-0.2-2-0.7c-0.2-0.1-0.3-0.3-0.4-0.5s-0.2-0.4-0.3-0.7s-0.1-0.8-0.1-1.7v-4h-1.6V199.9z\" />\n\t\t<path fill=\"#262F38\" d=\"M74.9,203.2h-6.3c0,0.9,0.3,1.5,0.9,2.1s1.2,0.8,2.1,0.8c1.2,0,2.3-0.4,3.2-1.1v1.7\n\t\t\tc-0.5,0.4-1.1,0.6-1.6,0.8s-1.2,0.2-1.9,0.2c-1,0-1.8-0.2-2.4-0.6s-1.1-1-1.5-1.7s-0.6-1.5-0.6-2.4c0-1.4,0.4-2.5,1.2-3.3\n\t\t\ts1.8-1.3,3-1.3c1.2,0,2.1,0.4,2.9,1.2s1.1,1.9,1.1,3.3V203.2z M68.7,202.1h4.5c0-0.7-0.3-1.3-0.6-1.6s-0.9-0.6-1.5-0.6\n\t\t\ts-1.2,0.2-1.6,0.6S68.8,201.4,68.7,202.1z\" />\n\t\t<path fill=\"#262F38\" d=\"M78.8,198.5v2.1l0.1-0.2c0.9-1.4,1.7-2.1,2.6-2.1c0.7,0,1.4,0.3,2.1,1l-0.9,1.6c-0.6-0.6-1.2-0.9-1.7-0.9\n\t\t\tc-0.6,0-1.1,0.3-1.5,0.8s-0.6,1.2-0.6,1.9v4.7H77v-9H78.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M90.4,202.1v3.8c0,0.3,0.1,0.5,0.3,0.5c0.2,0,0.6-0.2,1-0.5v1.1c-0.4,0.3-0.7,0.4-1,0.5s-0.5,0.1-0.8,0.1\n\t\t\tc-0.8,0-1.2-0.3-1.3-0.9c-0.8,0.6-1.6,0.9-2.4,0.9c-0.6,0-1.1-0.2-1.6-0.6s-0.6-0.9-0.6-1.6c0-0.6,0.2-1.1,0.6-1.5s1-0.8,1.7-1.1\n\t\t\tl2.3-0.8v-0.5c0-1.1-0.5-1.6-1.6-1.6c-1,0-1.9,0.5-2.8,1.5v-1.9c0.7-0.8,1.7-1.2,3-1.2c1,0,1.7,0.3,2.3,0.8\n\t\t\tc0.2,0.2,0.4,0.4,0.5,0.6s0.3,0.5,0.3,0.8S90.4,201.3,90.4,202.1z M88.7,205.7V203l-1.2,0.5c-0.6,0.2-1,0.5-1.3,0.7\n\t\t\ts-0.4,0.5-0.4,0.9c0,0.4,0.1,0.7,0.4,0.9s0.5,0.4,0.9,0.4C87.7,206.4,88.2,206.2,88.7,205.7z\" />\n\t\t<path fill=\"#262F38\" d=\"M100,205.4v1.8c-0.9,0.3-1.8,0.5-2.6,0.5c-1.4,0-2.5-0.4-3.4-1.2s-1.3-1.9-1.3-3.3c0-1.4,0.4-2.6,1.2-3.4\n\t\t\ts1.9-1.3,3.2-1.3c0.5,0,0.9,0,1.2,0.1s0.8,0.3,1.4,0.5v1.9c-0.9-0.6-1.7-0.9-2.5-0.9c-0.8,0-1.5,0.3-2,0.8s-0.8,1.3-0.8,2.2\n\t\t\tc0,0.9,0.3,1.6,0.8,2.2s1.3,0.8,2.3,0.8C98.4,206,99.2,205.8,100,205.4z\" />\n\t\t<path fill=\"#262F38\" d=\"M100.8,199.9l3.3-3.3v1.9h2.8v1.6h-2.8v4.4c0,1,0.4,1.5,1.3,1.5c0.6,0,1.3-0.2,2-0.6v1.7\n\t\t\tc-0.7,0.4-1.4,0.6-2.2,0.6c-0.8,0-1.5-0.2-2-0.7c-0.2-0.1-0.3-0.3-0.4-0.5s-0.2-0.4-0.3-0.7s-0.1-0.8-0.1-1.7v-4h-1.6V199.9z\" />\n\t\t<path fill=\"#262F38\" d=\"M109.6,194.7c0.3,0,0.5,0.1,0.8,0.3s0.3,0.4,0.3,0.7c0,0.3-0.1,0.5-0.3,0.7s-0.5,0.3-0.8,0.3\n\t\t\tc-0.3,0-0.5-0.1-0.7-0.3s-0.3-0.5-0.3-0.7c0-0.3,0.1-0.5,0.3-0.7S109.4,194.7,109.6,194.7z M108.8,198.5h1.8v9h-1.8V198.5z\" />\n\t\t<path fill=\"#262F38\" d=\"M118.6,198.5h1.9l-4,9.1H116l-4.1-9.1h1.9l2.4,5.5L118.6,198.5z\" />\n\t\t<path fill=\"#262F38\" d=\"M129.1,203.2h-6.3c0,0.9,0.3,1.5,0.9,2.1s1.2,0.8,2.1,0.8c1.2,0,2.3-0.4,3.2-1.1v1.7\n\t\t\tc-0.5,0.4-1.1,0.6-1.6,0.8s-1.2,0.2-1.9,0.2c-1,0-1.8-0.2-2.4-0.6s-1.1-1-1.5-1.7s-0.6-1.5-0.6-2.4c0-1.4,0.4-2.5,1.2-3.3\n\t\t\ts1.8-1.3,3-1.3c1.2,0,2.1,0.4,2.9,1.2s1.1,1.9,1.1,3.3V203.2z M122.9,202.1h4.5c0-0.7-0.3-1.3-0.6-1.6s-0.9-0.6-1.5-0.6\n\t\t\ts-1.2,0.2-1.6,0.6S123,201.4,122.9,202.1z\" />\n\t\t<path fill=\"#262F38\" d=\"M144.2,200.8h4.6v5.8c-1.7,0.7-3.3,1.1-5,1.1c-2.3,0-4.1-0.7-5.4-2s-2-2.9-2-4.9c0-2,0.7-3.7,2.1-5.1\n\t\t\ts3.2-2,5.3-2c0.8,0,1.5,0.1,2.2,0.2s1.6,0.5,2.6,0.9v2c-1.6-0.9-3.2-1.4-4.8-1.4c-1.5,0-2.7,0.5-3.8,1.5s-1.5,2.3-1.5,3.7\n\t\t\tc0,1.5,0.5,2.8,1.5,3.8s2.3,1.5,3.9,1.5c0.8,0,1.7-0.2,2.8-0.5l0.2-0.1v-2.8h-2.6V200.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M157.1,202.1v3.8c0,0.3,0.1,0.5,0.3,0.5c0.2,0,0.6-0.2,1-0.5v1.1c-0.4,0.3-0.7,0.4-1,0.5s-0.5,0.1-0.8,0.1\n\t\t\tc-0.8,0-1.2-0.3-1.3-0.9c-0.8,0.6-1.6,0.9-2.4,0.9c-0.6,0-1.1-0.2-1.6-0.6s-0.6-0.9-0.6-1.6c0-0.6,0.2-1.1,0.6-1.5s1-0.8,1.7-1.1\n\t\t\tl2.3-0.8v-0.5c0-1.1-0.5-1.6-1.6-1.6c-1,0-1.9,0.5-2.8,1.5v-1.9c0.7-0.8,1.7-1.2,3-1.2c1,0,1.7,0.3,2.3,0.8\n\t\t\tc0.2,0.2,0.4,0.4,0.5,0.6s0.3,0.5,0.3,0.8S157.1,201.3,157.1,202.1z M155.3,205.7V203l-1.2,0.5c-0.6,0.2-1,0.5-1.3,0.7\n\t\t\ts-0.4,0.5-0.4,0.9c0,0.4,0.1,0.7,0.4,0.9s0.5,0.4,0.9,0.4C154.3,206.4,154.8,206.2,155.3,205.7z\" />\n\t\t<path fill=\"#262F38\" d=\"M167.3,201v6.5h-1.8v-5c0-1-0.1-1.7-0.4-2.1s-0.7-0.6-1.4-0.6c-0.4,0-0.7,0.1-1,0.3s-0.7,0.5-1.1,0.9v6.5\n\t\t\th-1.8v-9h1.8v1.2c0.9-0.9,1.8-1.4,2.7-1.4c1.1,0,2,0.5,2.6,1.6c1-1.1,1.9-1.6,3-1.6c0.9,0,1.6,0.3,2.2,1s0.8,1.6,0.8,2.9v5.3h-1.8\n\t\t\tv-5.3c0-0.7-0.2-1.3-0.5-1.7s-0.7-0.6-1.3-0.6C168.6,199.9,168,200.2,167.3,201z\" />\n\t\t<path fill=\"#262F38\" d=\"M183,203.2h-6.3c0,0.9,0.3,1.5,0.9,2.1s1.2,0.8,2.1,0.8c1.2,0,2.3-0.4,3.2-1.1v1.7\n\t\t\tc-0.5,0.4-1.1,0.6-1.6,0.8s-1.2,0.2-1.9,0.2c-1,0-1.8-0.2-2.4-0.6s-1.1-1-1.5-1.7s-0.6-1.5-0.6-2.4c0-1.4,0.4-2.5,1.2-3.3\n\t\t\ts1.8-1.3,3-1.3c1.2,0,2.1,0.4,2.9,1.2s1.1,1.9,1.1,3.3V203.2z M176.7,202.1h4.5c0-0.7-0.3-1.3-0.6-1.6s-0.9-0.6-1.5-0.6\n\t\t\ts-1.2,0.2-1.6,0.6S176.9,201.4,176.7,202.1z\" />\n\t\t<path fill=\"#262F38\" d=\"M201.6,193.8h1.8v13.6h-2v-10.6l-4.2,5.3h-0.4l-4.2-5.3v10.6h-2v-13.6h1.8l4.5,5.6L201.6,193.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M211.8,207.5v-1.2c-0.4,0.4-0.8,0.7-1.3,1c-0.5,0.2-1,0.3-1.5,0.3c-0.6,0-1.1-0.1-1.6-0.4\n\t\t\ts-0.8-0.7-1.1-1.2s-0.4-1.3-0.4-2.4v-5.1h1.8v5.1c0,0.9,0.1,1.6,0.4,2c0.3,0.4,0.7,0.6,1.4,0.6c0.8,0,1.6-0.4,2.2-1.2v-6.4h1.8v9\n\t\t\tH211.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M215.7,206.8v-1.9c0.5,0.4,1,0.6,1.5,0.9s1,0.3,1.3,0.3c0.4,0,0.7-0.1,1-0.3s0.4-0.4,0.4-0.7\n\t\t\tc0-0.3-0.1-0.5-0.3-0.6s-0.5-0.4-1.1-0.7c-1.1-0.6-1.9-1.2-2.3-1.6s-0.5-0.9-0.5-1.5c0-0.7,0.3-1.3,0.8-1.7s1.2-0.7,2.1-0.7\n\t\t\tc0.9,0,1.8,0.2,2.7,0.7v1.8c-1.1-0.6-1.9-1-2.6-1c-0.3,0-0.6,0.1-0.8,0.2c-0.2,0.1-0.3,0.3-0.3,0.6c0,0.2,0.1,0.4,0.3,0.6\n\t\t\tc0.2,0.2,0.5,0.4,1,0.7l0.6,0.4c1.5,0.8,2.2,1.8,2.2,2.8c0,0.7-0.3,1.3-0.9,1.8c-0.6,0.5-1.3,0.7-2.2,0.7c-0.5,0-1-0.1-1.4-0.2\n\t\t\tS216.3,207.2,215.7,206.8z\" />\n\t\t<path fill=\"#262F38\" d=\"M231.5,203.2h-6.3c0,0.9,0.3,1.5,0.9,2.1s1.2,0.8,2.1,0.8c1.2,0,2.3-0.4,3.2-1.1v1.7\n\t\t\tc-0.5,0.4-1.1,0.6-1.6,0.8s-1.2,0.2-1.9,0.2c-1,0-1.8-0.2-2.4-0.6s-1.1-1-1.5-1.7s-0.6-1.5-0.6-2.4c0-1.4,0.4-2.5,1.2-3.3\n\t\t\ts1.8-1.3,3-1.3c1.2,0,2.1,0.4,2.9,1.2s1.1,1.9,1.1,3.3V203.2z M225.2,202.1h4.5c0-0.7-0.3-1.3-0.6-1.6s-0.9-0.6-1.5-0.6\n\t\t\ts-1.2,0.2-1.6,0.6S225.3,201.4,225.2,202.1z\" />\n\t\t<path fill=\"#262F38\" d=\"M239.1,207.5v-1.2c-0.4,0.4-0.8,0.7-1.3,1c-0.5,0.2-1,0.3-1.5,0.3c-0.6,0-1.1-0.1-1.6-0.4\n\t\t\ts-0.8-0.7-1.1-1.2s-0.4-1.3-0.4-2.4v-5.1h1.8v5.1c0,0.9,0.1,1.6,0.4,2c0.3,0.4,0.7,0.6,1.4,0.6c0.8,0,1.6-0.4,2.2-1.2v-6.4h1.8v9\n\t\t\tH239.1z\" />\n\t\t<path fill=\"#262F38\" d=\"M250.8,201v6.5H249v-5c0-1-0.1-1.7-0.4-2.1s-0.7-0.6-1.4-0.6c-0.4,0-0.7,0.1-1,0.3s-0.7,0.5-1.1,0.9v6.5\n\t\t\th-1.8v-9h1.8v1.2c0.9-0.9,1.8-1.4,2.7-1.4c1.1,0,2,0.5,2.6,1.6c1-1.1,1.9-1.6,3-1.6c0.9,0,1.6,0.3,2.2,1s0.8,1.6,0.8,2.9v5.3h-1.8\n\t\t\tv-5.3c0-0.7-0.2-1.3-0.5-1.7s-0.7-0.6-1.3-0.6C252.1,199.9,251.4,200.2,250.8,201z\" />\n\t</g>\n\t<path fill=\"#262F38\" d=\"M92.4,43.5h117c1.2,0,2.3,1,2.3,2.3v4.5c0,1.3-1,2.3-2.3,2.3h-117c-1.3,0-2.3-1-2.3-2.3v-4.5\n\t\tC90.2,44.5,91.2,43.5,92.4,43.5\" />\n\t<path fill=\"#262F38\" d=\"M92.4,114.6h117c1.2,0,2.3,1,2.3,2.3v4.5c0,1.3-1,2.3-2.3,2.3h-117c-1.3,0-2.3-1-2.3-2.3v-4.5\n\t\tC90.2,115.6,91.2,114.6,92.4,114.6\" />\n\t<path fill=\"#262F38\" d=\"M85.3,126.7h131.3c1.3,0,2.3,1,2.3,2.3v4.5c0,1.3-1,2.3-2.3,2.3H85.3c-1.3,0-2.3-1-2.3-2.3V129\n\t\tC83.1,127.7,84.1,126.7,85.3,126.7\" />\n\t<path fill=\"#262F38\" d=\"M151,0c-0.4,0-0.8,0.1-1.1,0.3L85,36.1c-1.1,0.6-1.5,2-0.9,3.1c0.4,0.7,1.2,1.2,2,1.2h129.7\n\t\tc1.3,0,2.3-1,2.3-2.3c0-0.8-0.4-1.6-1.2-2L152,0.3C151.7,0.1,151.3,0,151,0\" />\n\t<g>\n\t\t<g>\n\t\t\t<defs>\n\t\t\t\t<path id=\"SVGID_1_\" d=\"M107.9,55.8c-0.8,0.2-1.5,0.5-2.2,1c-0.8,0.5-1.5,1.2-2.1,2.1c-0.3,0.6-0.6,1.2-0.8,1.8\n\t\t\t\t\tc-0.5,1.7-0.5,3.7,0,5.8c0.4,1.6,1.1,3.3,2.2,4.9c0.7,1.1,1.1,2.2,1.3,3.2c0.7,4.4-3.7,8.1-6.3,17.3c-1.1,3.9-2,8.8-2,15.2\n\t\t\t\t\tc0,0.1,0,0.3,0,0.4c0.1,0.6,0.6,1.2,1.4,1.7c0.8,0.5,1.9,1,3.3,1.3c1.1,0.3,2.4,0.5,3.7,0.7c1.8,0.2,3.7,0.3,5.5,0.2\n\t\t\t\t\tc2-0.1,3.8-0.3,5.4-0.7c1.7-0.4,3.1-0.9,4.1-1.5c0.8-0.5,1.3-1.1,1.4-1.7c0-0.1,0-0.3,0-0.4c0-6.4-0.8-11.3-2-15.2\n\t\t\t\t\tc-2.7-9.2-7-12.9-6.4-17.3c0.1-1,0.6-2,1.3-3.2c1-1.6,1.8-3.3,2.2-4.9c0.5-2.1,0.5-4.1,0-5.8c-0.2-0.7-0.5-1.3-0.8-1.8\n\t\t\t\t\tc-0.6-1-1.4-1.8-2.4-2.4c-1-0.6-2.2-0.9-3.6-1c-0.2,0-0.5,0-0.7,0C109.6,55.5,108.7,55.6,107.9,55.8\" />\n\t\t\t</defs>\n\t\t\t<use xlink:href=\"#SVGID_1_\" overflow=\"visible\" fill=\"#FFCC00\" />\n\t\t\t<clipPath id=\"SVGID_2_\">\n\t\t\t\t<use xlink:href=\"#SVGID_1_\" overflow=\"visible\" />\n\t\t\t</clipPath>\n\t\t</g>\n\t\t<g>\n\t\t\t<defs>\n\t\t\t\t<path id=\"SVGID_3_\" d=\"M148.4,55.8c-0.8,0.2-1.5,0.5-2.2,1c-0.8,0.5-1.5,1.2-2.1,2.1c-0.3,0.6-0.6,1.2-0.8,1.8\n\t\t\t\t\tc-0.5,1.7-0.5,3.7,0,5.8c0.4,1.6,1.1,3.3,2.2,4.9c0.7,1.1,1.1,2.2,1.3,3.2c0.7,4.4-3.7,8.1-6.3,17.3c-1.1,3.9-2,8.8-2,15.2v0\n\t\t\t\t\tc0,0.1,0,0.3,0,0.4c0.1,0.6,0.6,1.2,1.4,1.7c0.8,0.5,1.9,1,3.3,1.3c1.1,0.3,2.4,0.5,3.7,0.7c1.8,0.2,3.7,0.3,5.5,0.2\n\t\t\t\t\tc2-0.1,3.8-0.3,5.4-0.7c1.7-0.4,3.1-0.9,4.1-1.5c0.8-0.5,1.3-1.1,1.4-1.7c0-0.1,0-0.3,0-0.4c0-6.4-0.8-11.3-2-15.2\n\t\t\t\t\tc-2.7-9.2-7-12.9-6.4-17.3c0.1-1,0.6-2,1.3-3.2c1-1.6,1.8-3.3,2.2-4.9c0.5-2.1,0.5-4.1,0-5.8c-0.2-0.7-0.5-1.3-0.8-1.8\n\t\t\t\t\tc-0.6-1-1.4-1.8-2.4-2.4c-1-0.6-2.2-0.9-3.6-1c-0.2,0-0.5,0-0.7,0C150.1,55.5,149.3,55.6,148.4,55.8\" />\n\t\t\t</defs>\n\t\t\t<use xlink:href=\"#SVGID_3_\" overflow=\"visible\" fill=\"#FFCC00\" />\n\t\t\t<clipPath id=\"SVGID_4_\">\n\t\t\t\t<use xlink:href=\"#SVGID_3_\" overflow=\"visible\" />\n\t\t\t</clipPath>\n\t\t</g>\n\t\t<g>\n\t\t\t<defs>\n\t\t\t\t<path id=\"SVGID_5_\" d=\"M189,55.8c-0.8,0.2-1.5,0.5-2.2,1c-0.8,0.5-1.5,1.2-2.1,2.1c-0.3,0.6-0.6,1.2-0.8,1.8\n\t\t\t\t\tc-0.5,1.7-0.5,3.7,0,5.8c0.4,1.6,1.1,3.3,2.2,4.9c0.7,1.1,1.1,2.2,1.3,3.2c0.7,4.4-3.7,8.1-6.3,17.3c-1.1,3.9-2,8.8-2,15.2\n\t\t\t\t\tc0,0.1,0,0.3,0,0.4c0.1,0.6,0.6,1.2,1.4,1.7c0.8,0.5,1.9,1,3.3,1.3c1.1,0.3,2.4,0.5,3.7,0.7c1.8,0.2,3.7,0.3,5.5,0.2\n\t\t\t\t\tc2-0.1,3.8-0.3,5.4-0.7c1.7-0.4,3.1-0.9,4.1-1.5c0.8-0.5,1.3-1.1,1.4-1.7c0-0.1,0-0.3,0-0.4c0-6.4-0.8-11.3-2-15.2\n\t\t\t\t\tc-2.7-9.2-7-12.9-6.4-17.3c0.1-1,0.6-2,1.3-3.2c1-1.6,1.8-3.3,2.2-4.9c0.5-2.1,0.5-4.1,0-5.8c-0.2-0.7-0.5-1.3-0.8-1.8\n\t\t\t\t\tc-0.6-1-1.4-1.8-2.4-2.4c-1-0.6-2.2-0.9-3.6-1c-0.2,0-0.5,0-0.7,0C190.6,55.5,189.8,55.6,189,55.8\" />\n\t\t\t</defs>\n\t\t\t<use xlink:href=\"#SVGID_5_\" overflow=\"visible\" fill=\"#FFCC00\" />\n\t\t\t<clipPath id=\"SVGID_6_\">\n\t\t\t\t<use xlink:href=\"#SVGID_5_\" overflow=\"visible\" />\n\t\t\t</clipPath>\n\t\t</g>\n\t</g>\n\t<g>\n\t\t<path fill=\"#FFCC00\" d=\"M151.4,22.2l10.2-5.9c-1.9-3.5-5.6-5.9-9.9-5.9c-6.2,0-11.3,5.1-11.3,11.3c0,6.2,5.1,11.3,11.3,11.3\n\t\t\tc4,0,7.5-2.1,9.5-5.2L151.4,22.2z\" />\n\t</g>\n</g>\n"});

const __5____images_Gameorama_Foto_jpg__ = new Proxy({"src":"/_astro/Gameorama_Foto.zGj6x7tP.jpg","width":3240,"height":2160,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/Gameorama_Foto.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/Gameorama_Foto.jpg");
							return target[name];
						}
					});

const MDXLayout$4 = function ({children}) {
  const {layout, ...content} = frontmatter$6;
  content.file = file$4;
  content.url = url$4;
  return createVNode($$Layout, {
    file: file$4,
    url: url$4,
    content,
    frontmatter: content,
    headings: getHeadings$4(),
    'server:root': true,
    children
  });
};
const frontmatter$6 = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Partner",
  "title": "Partner",
  "toc": true,
  "navigation": {
    "group": "secondary",
    "label": "Partner",
    "order": 3
  }
};
function getHeadings$4() {
  return [{
    "depth": 2,
    "slug": "ludothek-luzern",
    "text": "Ludothek Luzern"
  }, {
    "depth": 2,
    "slug": "spielbude-zug",
    "text": "Spielbude Zug"
  }, {
    "depth": 2,
    "slug": "gameorama--interaktives-spielmuseum",
    "text": "Gameorama – Interaktives Spielmuseum"
  }];
}
const __usesAstroImage$2 = true;
function _createMdxContent$4(props) {
  const _components = {
    a: "a",
    "astro-image": "astro-image",
    em: "em",
    h2: "h2",
    p: "p",
    ...props.components
  }, _component0 = _components["astro-image"];
  return createVNode(Fragment, {
    children: [createVNode(_components.h2, {
      id: "ludothek-luzern",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#ludothek-luzern",
        children: "Ludothek Luzern"
      })
    }), "\n", createVNode(ImageText, {
      kind: "partner",
      children: [createVNode(ImageTextLeft, {
        children: [createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Ludothek Luzern",
            src: __0____images_partner_Logo_Ludothek_Luzern_png__
          })
        }), createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Ludothek Luzern",
            src: __1____images_Ludothek_Foto_jpg__
          })
        })]
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: "Kinder und Erwachsene haben die Möglichkeit in unserer Ludothek neue Spiele und Spielgeräte zu kleinem Preis auszuleihen.\nDas Angebot richtet sich an alle, die sich nicht immer neue Spiele anschaffen wollen oder können."
        }), createVNode(_components.p, {
          children: "unsere Adresse ist Ludothek Luzern, Bruchstrasse 78, 6003 Luzern"
        }), createVNode(_components.p, {
          children: createVNode(_components.em, {
            children: "Unsere Kolleginnen und Kollegen von der Ludothek bringen Spiele für die ganze Familie mit und werden diese am Sonntag, ab 10 Uhr gerne unseren jüngsten Spieler:innen erklären."
          })
        }), createVNode(ButtonLink, {
          link: "https://www.ludothek-luzern.ch",
          label: "Ludothek Luzern"
        })]
      })]
    }), "\n", createVNode(_components.h2, {
      id: "spielbude-zug",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spielbude-zug",
        children: "Spielbude Zug"
      })
    }), "\n", createVNode(ImageText, {
      kind: "partner",
      children: [createVNode(ImageTextLeft, {
        children: [createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Spielbude Zug",
            src: __2____images_partner_Logo_Spielbude_jpg__
          })
        }), createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Spielbude Zug",
            src: __3____images_Spielbude_Foto_jpg__
          })
        })]
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: "«Spielbude Zug (Denise und Yves Hess): Motiviert durch unsere Passion für die Welt der Spiele konnten wir 2015 die ersten Spieleschulungen für sechs Zuger Ludotheken durchführen. Es folgten Spielanlässe mit verschiedenen Gastropartner und Firmenevents, u. a. die Zuger Spielnacht und das Spielschiff auf dem Zugersee. In der Zwischenzeit bieten wir zusätzlich Weiterbildungen für Lehrpersonen an und entwickeln unser Konzept «Spielend lernen» stetig weiter.»"
        }), createVNode(_components.p, {
          children: "Unsere Kolleginnen und Kollegen von Zug bringen Spiele für die ganze Familie mit und werden diese am Sonntag, ab 10 Uhr gerne unseren jüngsten Spieler:innen erklären."
        }), createVNode(ButtonLink, {
          link: "https://www.zugerspielnacht.ch/spielbudezug",
          label: "Spielbude Zug"
        })]
      })]
    }), "\n", createVNode(_components.h2, {
      id: "gameorama--interaktives-spielmuseum",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#gameorama--interaktives-spielmuseum",
        children: "Gameorama – Interaktives Spielmuseum"
      })
    }), "\n", createVNode(ImageText, {
      kind: "partner",
      children: [createVNode(ImageTextLeft, {
        children: [createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Gameorama",
            src: __4____images_partner_Logo_Gameorama_svg__
          })
        }), createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Gameorama",
            src: __5____images_Gameorama_Foto_jpg__
          })
        })]
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: "Das Gameorama in Luzern ist das einzige interaktive Spielmuseum der Schweiz. Das Gameorama bewahrt, präsentiert und vermittelt Exponate aus den Bereichen Gesellschaftsspiele, Spielautomaten und Videospiele."
        }), createVNode(ButtonLink, {
          link: "https://www.gameorama.ch/",
          label: "Gameorama"
        })]
      })]
    })]
  });
}
function MDXContent$4(props = {}) {
  return createVNode(MDXLayout$4, {
    ...props,
    children: createVNode(_createMdxContent$4, {
      ...props
    })
  });
}

const url$4 = "/partner";
const file$4 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/partner.mdx";
const Content$4 = (props = {}) => MDXContent$4({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content$4[Symbol.for('mdx-component')] = true;
Content$4[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$6.layout);
Content$4.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/partner.mdx";
__astro_tag_component__(Content$4, 'astro:jsx');

const _page$6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$4,
  __usesAstroImage: __usesAstroImage$2,
  default: Content$4,
  file: file$4,
  frontmatter: frontmatter$6,
  getHeadings: getHeadings$4,
  url: url$4
}, Symbol.toStringTag, { value: 'Module' }));

const MDXLayout$3 = function ({children}) {
  const {layout, ...content} = frontmatter$5;
  content.file = file$3;
  content.url = url$3;
  return createVNode($$Layout, {
    file: file$3,
    url: url$3,
    content,
    frontmatter: content,
    headings: getHeadings$3(),
    'server:root': true,
    children
  });
};
const frontmatter$5 = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Programm",
  "toc": true
};
function getHeadings$3() {
  return [{
    "depth": 1,
    "slug": "programm",
    "text": "Programm"
  }];
}
function _createMdxContent$3(props) {
  const _components = {
    a: "a",
    em: "em",
    h1: "h1",
    p: "p",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "programm",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#programm",
        children: "Programm"
      })
    }), "\n", createVNode(Heading, {
      level: 3,
      title: "Öffnungszeiten"
    }), "\n", createVNode("p", {
      children: createVNode("code", {
        children: createVNode(_components.p, {
          children: ["Samstag, 14. März 2026, 10 bis 24 Uhr ", createVNode("br", {}), "\nSonntag, 15. März 2026, 10 bis 18 Uhr", createVNode("sup", {
            children: "*"
          })]
        })
      })
    }), "\n", createVNode("p", {
      children: createVNode("em", {
        children: "*Der Flohmarkt schliesst am Sonntag bereits um 17 Uhr."
      })
    }), "\n", createVNode(_components.p, {
      children: "Für ein abwechslungsreiches Programm ist an den Luzerner Spieltagen gesorgt:"
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.em, {
        children: "Programm wird in dieser Woche hier kommuniziert."
      })
    }), "\n", createVNode($$ReferenceGilde, {
      event: "LST"
    })]
  });
}
function MDXContent$3(props = {}) {
  return createVNode(MDXLayout$3, {
    ...props,
    children: createVNode(_createMdxContent$3, {
      ...props
    })
  });
}

const url$3 = "/programm";
const file$3 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm.mdx";
const Content$3 = (props = {}) => MDXContent$3({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content$3[Symbol.for('mdx-component')] = true;
Content$3[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$5.layout);
Content$3.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm.mdx";
__astro_tag_component__(Content$3, 'astro:jsx');

const _page$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$3,
  default: Content$3,
  file: file$3,
  frontmatter: frontmatter$5,
  getHeadings: getHeadings$3,
  url: url$3
}, Symbol.toStringTag, { value: 'Module' }));

const MDXLayout$2 = function ({children}) {
  const {layout, ...content} = frontmatter$4;
  content.file = file$2;
  content.url = url$2;
  return createVNode($$Layout, {
    file: file$2,
    url: url$2,
    content,
    frontmatter: content,
    headings: getHeadings$2(),
    'server:root': true,
    children
  });
};
const frontmatter$4 = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Familiensonntag",
  "navigation": {
    "group": "main",
    "label": "Familiensonntag",
    "order": 15
  }
};
function getHeadings$2() {
  return [{
    "depth": 1,
    "slug": "familiensonntag",
    "text": "Familiensonntag"
  }];
}
const __usesAstroImage$1 = true;
function _createMdxContent$2(props) {
  const _components = {
    a: "a",
    "astro-image": "astro-image",
    h1: "h1",
    p: "p",
    strong: "strong",
    ...props.components
  }, _component0 = _components["astro-image"];
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "familiensonntag",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#familiensonntag",
        children: "Familiensonntag"
      })
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: [createVNode(_components.p, {
          children: ["Wie letztes Jahr, dass wir ", createVNode(_components.strong, {
            children: "am Sonntag von 10 bis 18 Uhr"
          }), " abwechslungsreiches Programm für Familien geplant haben:"]
        }), createVNode(_components.p, {
          children: ["Dank der Zusammenarbeit mit der ", createVNode(_components.a, {
            href: "/partner/#ludothek-luzern",
            children: "Ludothek Luzern"
          }), " und der ", createVNode(_components.a, {
            href: "/partner/#spielbude-zug",
            children: "Spielbude Zug"
          }), " haben wir Spiele vor Ort, die für Kinder ab 3 Jahren geeignet sind und euch bequem erklãrt werden."]
        }), createVNode(_components.p, {
          children: "Unsere Kolleginnen und Kollegen von der Spielbude Zug und Ludothek Luzern bringen Spiele für die ganze Familie mit und werden diese gerne unseren jüngsten Spieler:innen erklären. Eine super Gelegenheit, um neue Spiele kennen zu lernen."
        })]
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "2019, Luzerner Spieltage",
            src: __0_______images_2022_spieltage_06_jpg__
          })
        }), createVNode(_components.p, {
          children: "Unterstützt durch die Spielbude Zug und Ludothek Luzern."
        }), createVNode("div", {
          class: "cluster",
          children: [createVNode(ButtonLink, {
            link: "https://www.ludothek-luzern.ch",
            label: "Ludothek Luzern"
          }), createVNode(ButtonLink, {
            link: "https://www.zugerspielnacht.ch/spielbudezug",
            label: "Spielbude Zug"
          })]
        })]
      })]
    }), "\n", createVNode(Box, {
      type: "success",
      link: "/programm",
      linkLabel: "Alle Programmpunkte",
      children: createVNode(_components.p, {
        children: "Willst du den kompletten Überblick? Schau doch in unsere Gesamtübersicht rein."
      })
    })]
  });
}
function MDXContent$2(props = {}) {
  return createVNode(MDXLayout$2, {
    ...props,
    children: createVNode(_createMdxContent$2, {
      ...props
    })
  });
}

const url$2 = "/programm/familien";
const file$2 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/familien.mdx";
const Content$2 = (props = {}) => MDXContent$2({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content$2[Symbol.for('mdx-component')] = true;
Content$2[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$4.layout);
Content$2.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/familien.mdx";
__astro_tag_component__(Content$2, 'astro:jsx');

const _page$4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$2,
  __usesAstroImage: __usesAstroImage$1,
  default: Content$2,
  file: file$2,
  frontmatter: frontmatter$4,
  getHeadings: getHeadings$2,
  url: url$2
}, Symbol.toStringTag, { value: 'Module' }));

const lst201802 = new Proxy({"src":"/_astro/2018-spieltage-02.BinWxnxw.jpg","width":4896,"height":3264,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2018-spieltage-02.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2018-spieltage-02.jpg");
							return target[name];
						}
					});

const lst201911 = new Proxy({"src":"/_astro/2019-spieltage-11.DBdDbWT9.jpg","width":4896,"height":3264,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/2019-spieltage-11.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/2019-spieltage-11.jpg");
							return target[name];
						}
					});

const frontmatter$3 = {
  navigation: {
    group: "main",
    label: "Freies Spielen",
    order: 1
  }
};
const $$FreiesSpielen = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "metaTitle": "Freies Spielen" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Heading", Heading, { "level": 1, "title": "Freies Spielen" })} ${renderComponent($$result2, "Heading", Heading, { "level": 2, "title": "Spiele-Bibliothek" })} ${renderComponent($$result2, "ImageText", ImageText, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "ImageTextLeft", ImageTextLeft, {}, { "default": ($$result4) => renderTemplate`
Die grosse Bibliothek mit Spielen für Jung und Alt, für Strategen und
      Geniesser, für Einzel- oder Teamkämpfer steht im Fokus des Anlasses –
      entdecke mit uns Spiele, welche wir dir vor Ort erklären, ohne dass du das
      Regelbuch in die Hand nehmen musst.
` })} ${renderComponent($$result3, "ImageTextRight", ImageTextRight, {}, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "Picture", $$Picture, { "src": lst201802, "formats": ["avif", "webp", "jpg"], "alt": "2018, Luzerner Spieltage" })} ` })} ` })} ${renderComponent($$result2, "Heading", Heading, { "level": 2, "title": "Erklärbären / Spielempfehlungen" })} ${renderComponent($$result2, "ImageText", ImageText, {}, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "ImageTextLeft", ImageTextLeft, {}, { "default": ($$result4) => renderTemplate`
Wir haben dieses Jahr wieder eine Auswahl an Spielen, welche Erklärbären
      und Erklärbärinnen aus dem Effeff beherschen. Sieh dich nach den roten
      T-Shirts um, melde dich am Infopoint oder stöbere selber in unserer
      Bibliothek.
` })} ${renderComponent($$result3, "ImageTextRight", ImageTextRight, {}, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "Picture", $$Picture, { "src": lst201911, "formats": ["avif", "webp", "jpg"], "alt": "2019, Luzerner Spieltage" })} ` })} ` })} ` })}`;
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/freies-spielen.astro", void 0);

const $$file$1 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/freies-spielen.astro";
const $$url$1 = "/programm/freies-spielen";

const _page$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$FreiesSpielen,
  file: $$file$1,
  frontmatter: frontmatter$3,
  url: $$url$1
}, Symbol.toStringTag, { value: 'Module' }));

async function elysiumLoadPublic(secret) {
  try {
    const url = new URL(elysium("/lst26/public"));
    url.searchParams.append("secret", secret);
    const result = await fetch(url, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!result.ok) {
      console.error(await result.text());
      return { kind: "FAILURE" };
    }
    const data = await result.json();
    return { kind: "SUCCESS", data };
  } catch (e) {
    console.error(e);
    return { kind: "FAILURE" };
  }
}

const daySchema = z.enum(["FRIDAY", "SATURDAY", "SUNDAY"]);
const hourRangeSchema = z.object({
  from: z.number(),
  to: z.number()
});
hourRangeSchema.extend({
  day: daySchema
});

const FRIDAY = Temporal.PlainDate.from({
  year: 2026,
  month: 3,
  day: 13
});
const SATURDAY = Temporal.PlainDate.from({
  year: 2026,
  month: 3,
  day: 14
});
const SUNDAY = Temporal.PlainDate.from({
  year: 2026,
  month: 3,
  day: 15
});
const defaultPlainDates = {
  FRIDAY,
  SATURDAY,
  SUNDAY
};
function getDay(date) {
  const { year, month, day } = date;
  if (FRIDAY.year === year && FRIDAY.month === month && FRIDAY.day === day) {
    return "FRIDAY";
  }
  if (SATURDAY.year === year && SATURDAY.month === month && SATURDAY.day === day) {
    return "SATURDAY";
  }
  if (SUNDAY.year === year && SUNDAY.month === month && SUNDAY.day === day) {
    return "SUNDAY";
  }
  return null;
}

var _tmpl$ = ["<br", ">"], _tmpl$2 = ["<strong", ">Donnerstag, 21. August 2025</strong>"], _tmpl$3 = ["<p", ">Deine Anmeldung wird geladen...</p>"], _tmpl$4 = ["<p", ">Das Programm wird geladen...</p>"], _tmpl$5 = ["<p", '>Leider ist ein unerwarteter Fehler passiert. Versuche deine Anmeldung erneut zu laden. Wiederholt sich dieser Fehler, bitte kontaktiere uns sobald als möglich über das <a href="/kontakt">Kontaktformular</a>, da dies nicht passieren sollte.</p>'], _tmpl$6 = ["<p", '>Wir konnten leider keine Anmeldung finden. Wenn du bereits eine Anmeldung begonnen hast, solltest du den korrekten Link per E-Mail erhalten haben.<br><br> Falls du noch keine Anmeldung begonnen hast, kannst du <a href="/anmeldung">hier</a> deine persönliche Anmeldung beginnen. <br><br>Für generelle Fragen oder Probleme, schreibe uns doch bitte über unser <a href="/kontakt">Kontaktformular</a>.</p>'], _tmpl$7 = ["<p", ">Wir konnten leider keine Spielrunde unter diesem Link finden.<br><br>Vermutlich liegt es an uns. Bitte kontaktiere uns sobald als möglich über das </p>"], _tmpl$8 = ["<p", '>Leider ist ein unerwarteter Fehler passiert. Vermutlich liegt es an uns. Bitte kontaktiere uns sobald als möglich über das <a href="/kontakt">Kontaktformular</a>.</p>'], _tmpl$9 = ["<p", '>Leider ist ein unerwarteter Fehler passiert beim Laden des Programmes. Vermutlich liegt es an uns. Bitte kontaktiere uns sobald als möglich über das <a href="/kontakt">Kontaktformular</a>.</p>'], _tmpl$0 = ["<p", '>Leider ist ein unerwarteter Fehler passiert beim Laden von Daten. Vermutlich liegt es an uns. Bitte kontaktiere uns sobald als möglich über das <a href="/kontakt">Kontaktformular</a>.</p>'], _tmpl$1 = ["<p", '>Leider ist das keine gültige Seite. Versuche deine Anmeldung erneut zu laden. Wiederholt sich dieser Fehler, bitte kontaktiere uns sobald als möglich über das <a href="/kontakt">Kontaktformular</a>, da dies nicht passieren sollte.</p>'], _tmpl$10 = ["<p", '>Leider hast du keinen Zugriff auf diese Seite. Sollte dies ein Fehler sein, dann kontaktiere uns sobald als möglich über das <a href="/kontakt">Kontaktformular</a>.</p>'];
["Deine Anmeldung wurde erfolgreich gestartet.", ssr(_tmpl$, ssrHydrationKey()), ssr(_tmpl$, ssrHydrationKey()), "Wir haben eine E-Mail an deine Adresse gesendet. In dieser E-Mail findest du einen persönlichen Link, um deine Anmeldung bis am", " ", ssr(_tmpl$2, ssrHydrationKey()), " anzupassen."];
({
  registration: ssr(_tmpl$3, ssrHydrationKey()),
  program: ssr(_tmpl$4, ssrHydrationKey())
});
({
  general: ssr(_tmpl$5, ssrHydrationKey()),
  secretError: ssr(_tmpl$6, ssrHydrationKey()),
  gameroundUuidError: ssr(_tmpl$7, ssrHydrationKey()),
  ourMistake: ssr(_tmpl$8, ssrHydrationKey()),
  program: ssr(_tmpl$9, ssrHydrationKey()),
  help: ssr(_tmpl$0, ssrHydrationKey()),
  siteNotFound: ssr(_tmpl$1, ssrHydrationKey()),
  noAccess: ssr(_tmpl$10, ssrHydrationKey())
});
const missingSlot = "kein Zeitslot ausgewählt";
const charLimitBy = "Dieses Feld ist auf {} Zeichen limitiert.";
const TXT = {
  missingSlot,
  charLimitBy};

const DESCR_SHORT_MAX_CHAR = 200;
const DESCR_LONG_MAX_CHAR = 500;
function getErrors(entry) {
  const byField = {};
  if (entry.title.trim().length === 0) {
    byField["title"] = [
      ...byField["title"] ?? [],
      "Titel ist ein Pflichtfeld"
    ];
  }
  if (entry.organizer.trim().length === 0) {
    byField["organizer"] = [
      ...byField["organizer"] ?? [],
      "'Organisiert durch' ist ein Pflichtfeld"
    ];
  }
  if (entry.shortDescription.trim().length === 0) {
    byField["shortDescription"] = [
      ...byField["shortDescription"] ?? [],
      "'Kurze Beschreibung' ist ein Pflichtfeld"
    ];
  }
  if (entry.shortDescription.trim().length > DESCR_SHORT_MAX_CHAR) {
    byField["shortDescription"] = [
      ...byField["shortDescription"] ?? [],
      TXT.charLimitBy.replace("{}", String(DESCR_SHORT_MAX_CHAR))
    ];
  }
  if (entry.longDescription.trim().length > DESCR_LONG_MAX_CHAR) {
    byField["longDescription"] = [
      ...byField["longDescription"] ?? [],
      TXT.charLimitBy.replace("{}", String(DESCR_LONG_MAX_CHAR))
    ];
  }
  if (entry.timeSlots.length === 0) {
    byField["timeSlots"] = [...byField["timeSlots"] ?? [], TXT.missingSlot];
  } else {
    entry.timeSlots.forEach((slot) => {
      const parsedStartTime = parsePlainTime(slot.start.time);
      if (parsedStartTime.kind === "ERROR") {
        byField["timeSlots"] = [
          ...byField["timeSlots"] ?? [],
          "Fehler im Zeitslot, 'Start'"
        ];
      }
      const parsedEndTime = parsePlainTime(slot.end.time);
      if (parsedEndTime.kind === "ERROR") {
        byField["timeSlots"] = [
          ...byField["timeSlots"] ?? [],
          "Fehler im Zeitslot, 'Ende'"
        ];
      }
      if (parsedStartTime.kind === "TIME" && parsedEndTime.kind === "TIME") {
        if (parsedEndTime.value.since(parsedStartTime.value).hours < 0) {
          byField["timeSlots"] = [
            ...byField["timeSlots"] ?? [],
            "Zeitfenster fehlerhaft ('Ende' vor 'Start')"
          ];
        }
      }
    });
  }
  entry.links.forEach((link) => {
    if (link.label.trim().length === 0) {
      byField["links"] = [
        ...byField["links"] ?? [],
        "Link ohne Label gefunden"
      ];
    }
    if (!link.link.startsWith("https://")) {
      byField["links"] = [
        ...byField["links"] ?? [],
        "Alle Links müssen mit 'https://' starten"
      ];
    }
  });
  const allErrors = Object.values(byField).flat();
  return {
    allErrors,
    byField,
    hasErrors: allErrors.length > 0
  };
}

const dateTimeRangeSchema = z.object({
  start: z.object({
    day: daySchema,
    time: z.string()
  }),
  end: z.object({
    day: daySchema,
    time: z.string()
  })
});
const publicProgramEntryRawSchema = z.object({
  uuid: z.string(),
  title: z.string(),
  organizer: z.string(),
  dateTimeRange: dateTimeRangeSchema,
  shortDescription: z.string(),
  longDescription: z.string(),
  participating: z.union([
    z.object({ kind: z.literal("NONE"), maxSeats: z.number() }),
    z.object({
      kind: z.literal("LIMITED"),
      maxSeats: z.number(),
      reserved: z.array(z.string())
    })
  ]),
  tagNames: z.string(),
  materialLanguage: z.string(),
  links: z.array(z.object({ label: z.string(), link: z.string() }))
});
const reservationsSchema = z.record(z.string(), z.array(z.string()));
const publicRawSchema = z.object({
  programEntries: z.array(publicProgramEntryRawSchema),
  reservations: reservationsSchema
});
async function loadPublic(secret) {
  const program = await elysiumLoadPublic(secret);
  if (program.kind === "FAILURE") {
    console.error("Unexpected error. Maybe network, maybe server error.");
    return {
      kind: "FAILURE"
    };
  }
  const parseResult = publicRawSchema.safeParse(program.data);
  if (!parseResult.success) {
    console.error(parseResult.error);
    return {
      kind: "FAILURE"
    };
  }
  return {
    kind: "SUCCESS",
    data: {
      programEntries: parseResult.data.programEntries.map(toPublic).filter((entry) => entry !== null),
      reservations: parseResult.data.reservations
    }
  };
}
function toPublic(entry) {
  const {
    dateTimeRange: { start, end }
  } = entry;
  const day = defaultPlainDates[start.day];
  const parsedStartTime = parsePlainTime(start.time);
  const parsedEndTime = parsePlainTime(end.time);
  if (parsedStartTime.kind === "ERROR" || parsedEndTime.kind === "ERROR") {
    return null;
  }
  const transformedEntry = {
    ...entry,
    slot: {
      day,
      start: parsedStartTime.value,
      end: parsedEndTime.value
    }
  };
  const errors = getErrors({
    ...transformedEntry,
    timeSlots: [
      {
        uuid: entry.uuid,
        start,
        end
      }
    ]
  });
  if (errors.hasErrors) {
    return null;
  }
  return transformedEntry;
}

async function getProgramGroupedByStarthour() {
  const program = await loadPublic("");
  assert(program.kind === "SUCCESS", "Could not load public program");
  const grouped = {
    FRIDAY: {},
    SATURDAY: {},
    SUNDAY: {}
  };
  for (const entry of program.data.programEntries) {
    const { day, start } = entry.slot;
    const dayStr = getDay(day);
    if (dayStr === null) {
      continue;
    }
    const list = grouped[dayStr][start.hour] ?? [];
    list.push(entry);
    grouped[dayStr][start.hour] = list;
  }
  return grouped;
}

const $$EventList = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$EventList;
  const { hour, entries, showQuestion } = Astro2.props;
  const colorsOfHour = {
    "10": "special",
    "11": "success",
    "14": "danger",
    "15": "special",
    "19": "success"
  };
  return renderTemplate`${maybeRenderHead()}<ul class="event-list" role="list"> ${entries.map((entry) => renderTemplate`<li${addAttribute(`event-entry ${colorsOfHour[hour]}`, "class")}> <h3 class="event-title">${entry.title}</h3> <div class="event-details"> <div class="event-tags"><strong>Zeit:</strong> ${entry.slot.start.hour}.${String(entry.slot.start.minute).padStart(2, "0")} - ${entry.slot.end.hour}.${String(entry.slot.end.minute).padStart(2, "0")} Uhr</div> <div class="event-tags"><strong>Organisiert durch:</strong> ${entry.organizer}</div> <div class="event-tags"><strong>Spielende:</strong> ${entry.participating.kind === "NONE" ? renderTemplate`<em>unbegrenzt</em>` : `bis ${entry.participating.maxSeats}`} </div> ${entry.tagNames.trim().length === 0 ? null : renderTemplate`<div class="event-tags"><strong>Kategorien:</strong> ${entry.tagNames.split(", ").map((s) => s.trim().length === 0 ? null : s.trim()).filter((s) => s !== null).join(", ")}</div>`} </div> <div class="event-description content"><p><strong>Beschreibung:</strong><br>${entry.shortDescription}</p> </div> <ul role="list" class="event-links"> <li><a href="/anmeldung" style="border: none; display: block; padding: 0;"><button class="event-link"><span>Details &amp; Teilnahme</span></button></a></li> </ul> </li>`)} ${showQuestion ? renderTemplate`<li${addAttribute(`event-entry gray`, "class")}> <h3 class="event-title">Möchtest du auch eine Spielrunde leiten?</h3> <div></div> <div class="event-description content"><p>Melde dich ungeniert bei uns.</p> </div> <ul role="list" class="event-links"> <li><a href="/kontakt" class="event-link"> Zum Kontaktformular</a></li> </ul> </li>` : null} </ul>`;
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/components/program/EventList.astro", void 0);

const frontmatter$2 = {
  navigation: {
    group: "main",
    label: "Organisierte Spiele",
    order: 5
  }
};
const $$Organisiert = createComponent(async ($$result, $$props, $$slots) => {
  const program = await getProgramGroupedByStarthour();
  const saturday = Object.entries(program.SATURDAY);
  const sunday = Object.entries(program.SUNDAY);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "metaTitle": "Programm 2025" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Heading", Heading, { "level": 1, "title": "Organisierte Spielerunden" })} ${maybeRenderHead()}<div class="cluster"> <a href="#samstag" style="border: none;">${renderComponent($$result2, "Button", Button, { "label": "Samstag", "onClick": (() => {
  }) })}</a> <a href="#sonntag" style="border: none;">${renderComponent($$result2, "Button", Button, { "label": "Sonntag", "onClick": (() => {
  }) })}</a> </div> <p style="margin-block-start: 2.5rem;">
Wir veranstalten diverse Spielrunden, die für Action und Spannung stehen.
    Komplexe oder tumultreiche Spiele, so wie Spiele mit hoher Spieleranzahl
    finden so ihren Platz. Das ist auch eine gute Gelegenheit, andere
    Mitspieler:innen zu finden, wenn du alleine anreist.
</p> <p>Du kannst dir hier bereits im Vorfeld einen Platz sichern!</p> <p> <i>
Hast du selbst ein Spiel, welches du für eine Gruppe anbiten möchtest?
      Dann kontaktiere uns via Kontaktformular.
</i> </p> ${renderComponent($$result2, "Heading", Heading, { "level": 2, "title": "Samstag, 14. März 2026", "id": "samstag" })} ${saturday.map(([hour, entries], i) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Heading", Heading, { "level": 3, "title": `Start ${hour} Uhr`, "id": `samstag-${hour}` })} ${renderComponent($$result3, "EventList", $$EventList, { "hour": hour, "entries": entries, "showQuestion": i === 0 })} <div style="margin-block: 2.5rem;"> <a href="#top" style="border: none;"> ${renderComponent($$result3, "Button", Button, { "label": "nach oben", "onClick": (() => {
  }) })} </a> </div> ` })}`)}${renderComponent($$result2, "Heading", Heading, { "level": 2, "title": "Sonntag, 15. März 2026", "id": "sonntag" })} ${sunday.map(([hour, entries], i) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Heading", Heading, { "level": 3, "title": `Start ${hour} Uhr`, "id": `sonntag-${hour}` })} ${renderComponent($$result3, "EventList", $$EventList, { "hour": hour, "entries": entries, "showQuestion": i === 0 })} <div style="margin-block: 2.5rem;"> <a href="#top" style="border: none;"> ${renderComponent($$result3, "Button", Button, { "label": "nach oben", "onClick": (() => {
  }) })} </a> </div> ` })}`)}${renderComponent($$result2, "ReferenceGilde", $$ReferenceGilde, { "event": "LST" })} ` })}`;
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/organisiert.astro", void 0);

const $$file = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/organisiert.astro";
const $$url = "/programm/organisiert";

const _page$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Organisiert,
  file: $$file,
  frontmatter: frontmatter$2,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const __0_______images_projectX_webp__ = new Proxy({"src":"/_astro/projectX.BDVcUs5o.webp","width":1938,"height":1936,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/projectX.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/projectX.webp");
							return target[name];
						}
					});

const __1_______images_beechboy_logo_png__ = new Proxy({"src":"/_astro/beechboy_logo.DUKLdxjm.png","width":1024,"height":674,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/beechboy_logo.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/beechboy_logo.png");
							return target[name];
						}
					});

const __2_______images_kampfhummel_webp__ = new Proxy({"src":"/_astro/kampfhummel.BKt5BVyB.webp","width":944,"height":174,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/kampfhummel.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/kampfhummel.webp");
							return target[name];
						}
					});

const __3_______images_Saurvival_webp__ = new Proxy({"src":"/_astro/Saurvival.DKJPV3Nn.webp","width":8160,"height":6120,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/Saurvival.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/Saurvival.webp");
							return target[name];
						}
					});

const __4_______images_ThomasJorg_webp__ = new Proxy({"src":"/_astro/ThomasJorg.DiutrUJV.webp","width":3024,"height":4032,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/lvl8/Projects/gilde-website/spieltage.ch/images/ThomasJorg.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages?.add("/home/lvl8/Projects/gilde-website/spieltage.ch/images/ThomasJorg.webp");
							return target[name];
						}
					});

const MDXLayout$1 = function ({children}) {
  const {layout, ...content} = frontmatter$1;
  content.file = file$1;
  content.url = url$1;
  return createVNode($$Layout, {
    file: file$1,
    url: url$1,
    content,
    frontmatter: content,
    headings: getHeadings$1(),
    'server:root': true,
    children
  });
};
const frontmatter$1 = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Spieldesigner:innen",
  "navigation": {
    "group": "main",
    "label": "Spieldesigner:innen",
    "order": 20
  }
};
function getHeadings$1() {
  return [{
    "depth": 1,
    "slug": "spieldesignerinnen",
    "text": "Spieldesigner:innen"
  }, {
    "depth": 2,
    "slug": "rahmenbedingungen-für-spieldesignerinnen",
    "text": "Rahmenbedingungen für Spieldesigner:innen"
  }, {
    "depth": 2,
    "slug": "spieldesigner-project-x",
    "text": "Spieldesigner «Project X»"
  }, {
    "depth": 2,
    "slug": "spieldesigner-constantin-büker",
    "text": "Spieldesigner Constantin Büker"
  }, {
    "depth": 2,
    "slug": "spieldesigner-kampfhummel-spiele",
    "text": "Spieldesigner Kampfhummel Spiele"
  }, {
    "depth": 3,
    "slug": "kampf-gegen-das-bünzlitum--das-fiese-brettspiel",
    "text": "Kampf gegen das Bünzlitum – das fiese Brettspiel"
  }, {
    "depth": 3,
    "slug": "road-rage",
    "text": "Road Rage"
  }, {
    "depth": 2,
    "slug": "spieldesigner-saurvival",
    "text": "Spieldesigner «Saurvival»"
  }, {
    "depth": 2,
    "slug": "spieldesigner-thomas-vogel",
    "text": "Spieldesigner Thomas Vogel"
  }];
}
const __usesAstroImage = true;
function _createMdxContent$1(props) {
  const _components = {
    a: "a",
    "astro-image": "astro-image",
    br: "br",
    em: "em",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    li: "li",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...props.components
  }, _component0 = _components["astro-image"];
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "spieldesignerinnen",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spieldesignerinnen",
        children: "Spieldesigner:innen"
      })
    }), "\n", createVNode(_components.p, {
      children: "Die Luzerner Spieltage bieten jedes Jahr Schweizer Spieldesigner:innen eine Plattform ihre Spiele und Prototypen zu zeigen. Auf dedizierten Eventtischen erklären die Designer:innen ihre Spiele, welche danach direkt vor Ort getestet werden können."
    }), "\n", createVNode(_components.h2, {
      id: "rahmenbedingungen-für-spieldesignerinnen",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#rahmenbedingungen-für-spieldesignerinnen",
        children: "Rahmenbedingungen für Spieldesigner:innen"
      })
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Kostenlose Plattform für Spieldesigner:innen"
      }), "\n", createVNode(_components.li, {
        children: "Prototypen / Spiele sollen spielbar sein"
      }), "\n", createVNode(_components.li, {
        children: "Kein Verkaufsstand (Verkauf per Flohmarkt nach Absprache möglich)"
      }), "\n", createVNode(_components.li, {
        children: "Garantierter Platz während den eingeplanten Eventtisch-Zeitslots"
      }), "\n", createVNode(_components.li, {
        children: ["Ausserhalb der eingeplanten Zeitslots gilt:\n", createVNode(_components.ul, {
          children: ["\n", createVNode(_components.li, {
            children: "Falls freie Spieltische und interessierte Spielende vorhanden sind, dürfen die Spiele/Prototypen natürlich auf den normalen Spieltischen gespielt werden"
          }), "\n", createVNode(_components.li, {
            children: "Normale Spieltische freigeben wenn nicht gespielt wird"
          }), "\n"]
        }), "\n"]
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "spieldesigner-project-x",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spieldesigner-project-x",
        children: "Spieldesigner «Project X»"
      })
    }), "\n", createVNode(_components.p, {
      children: [createVNode(_components.em, {
        children: ["Samstag, 10 bis 18 Uhr | ", createVNode(_components.a, {
          href: "/adresse#raumaufteilung",
          children: "Unterkirche"
        })]
      }), " & ", createVNode(_components.em, {
        children: ["Sonntag, 10 bis 14 Uhr | ", createVNode(_components.a, {
          href: "/adresse#raumaufteilung",
          children: "Unterkirche"
        })]
      })]
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Spiel \"Project X\"",
            src: __0_______images_projectX_webp__
          })
        })
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: "Mitte des 20. Jahrhunderts blickt die Menschheit erstmals tief in den Kosmos – und in ihr mögliches Ende. Ein gewaltiger Asteroid rast auf die Erde zu, die Zeit läuft unerbittlich. Nur visionäre Technologien und gewaltige Rettungsprojekte bieten Hoffnung."
        }), createVNode(_components.p, {
          children: "In diesem strategischen Sci-Fi-Spiel übernimmst du die Rolle eines von vier Projektleitern mit eigenem Rettungsplan. Auf dem gemeinsamen Markt sicherst du dir Schlüsseltechnologien die du möglichst effizient in dein Projekt integrieren möchtest. Doch Ressourcen sind knapp und Konkurrenz allgegenwärtig."
        }), createVNode(_components.p, {
          children: "Stelle eine Crew zusammen, nutze Assistenten und sende Agenten auf Missionen, um Vorteile zu erlangen. Nur wer klug plant und seine Rivalen übertrifft, kann die Zukunft der Menschheit sichern."
        }), createVNode(_components.p, {
          children: ["Kennerspiel", createVNode(_components.br, {}), "\n2-4 Spieler", createVNode(_components.br, {}), "\nab 12 Jahren", createVNode(_components.br, {}), "\nca. 45 Minuten pro Spieler"]
        }), createVNode(ButtonLink, {
          link: "https://www.turnwise.ch",
          label: "Turnwise Games"
        })]
      })]
    }), "\n", createVNode(_components.h2, {
      id: "spieldesigner-constantin-büker",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spieldesigner-constantin-büker",
        children: "Spieldesigner Constantin Büker"
      })
    }), "\n", createVNode(_components.p, {
      children: [createVNode(_components.em, {
        children: "Samstag, 10 bis 14 Uhr"
      }), " & ", createVNode(_components.em, {
        children: ["16 bis 20 Uhr | ", createVNode(_components.a, {
          href: "/adresse#raumaufteilung",
          children: "Unterkirche"
        })]
      })]
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Beechboy Boardgames",
            src: __1_______images_beechboy_logo_png__
          })
        })
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: "Hi, ich bin Constantin. Unter dem Namen Beech Boy entwickle ich innovative, interaktive Spiele - voller Chaos, Kreativität und einer deftigen Prise satirischem Humor. Ich bringe drei meiner aktuellen Prototypen mit und freue mich darauf, diese mit euch zu spielen!"
        }), createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "DOUBT"
          }), " ist ein erzählerisches Social-Deduction-Spiel, man könnte sagen, Secret Hitler trifft Cards Against Humanity.", createVNode(_components.br, {}), "\n(30-60 Minuten, 5-9 Spieler)"]
        }), createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Triggerparty!"
          }), " ist ein kooperatives, interaktives Partyspiel, bei dem alle Spieler eine komplett dysfunktionale Selbsthilfegruppe bilden. Chaos ist also vorprogrammiert!", createVNode(_components.br, {}), "\n(20-30 Minuten, 4+ Spieler)"]
        }), createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Woolside Story"
          }), " ist ein kinderfreundliches Deckbuilding-Duellspiel, bei dem beide Seiten darum streiten, wer die flauschigste Schafsherde hat.", createVNode(_components.br, {}), "\n(10-20 Minuten, 2 Spieler)"]
        }), createVNode(ButtonLink, {
          link: "https://beechboy.eu/",
          label: "Beechboy Boardgames"
        })]
      })]
    }), "\n", createVNode(_components.h2, {
      id: "spieldesigner-kampfhummel-spiele",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spieldesigner-kampfhummel-spiele",
        children: "Spieldesigner Kampfhummel Spiele"
      })
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.em, {
        children: ["Samstag, 14 bis 16 Uhr | ", createVNode(_components.a, {
          href: "/adresse#raumaufteilung",
          children: "Unterkirche"
        })]
      })
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Kampfhummel Spiele GmbH Logo",
            src: __2_______images_kampfhummel_webp__
          })
        })
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: "Angela Vögtli und Jerome Müller, Spielautoren der Kampfhummel Spiele GmbH, bringen gleich 2 Protypen an die Luzerner Spieltage."
        }), createVNode(_components.h3, {
          id: "kampf-gegen-das-bünzlitum--das-fiese-brettspiel",
          children: createVNode(_components.a, {
            class: "header-anchor",
            href: "#kampf-gegen-das-bünzlitum--das-fiese-brettspiel",
            children: "Kampf gegen das Bünzlitum – das fiese Brettspiel"
          })
        }), createVNode(_components.p, {
          children: "10 Jahre nach Lancierung des Kultspiels kommt nun die noch fiesere Variante in Brettspielform."
        }), createVNode(_components.h3, {
          id: "road-rage",
          children: createVNode(_components.a, {
            class: "header-anchor",
            href: "#road-rage",
            children: "Road Rage"
          })
        }), createVNode(_components.p, {
          children: "Ziel dieses Spiels ist es, im Strassenverkehr so richtig auszurasten. Es ist ein humorvolles Deckbuilding-Kartenspiel mit Push-Your-Luck-Elementen."
        }), createVNode(ButtonLink, {
          link: "https://www.kampfhummeln.ch",
          label: "Kampfhummel Spiele GmbH"
        })]
      })]
    }), "\n", createVNode(_components.h2, {
      id: "spieldesigner-saurvival",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spieldesigner-saurvival",
        children: "Spieldesigner «Saurvival»"
      })
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.em, {
        children: ["Sonntag, 10 bis 17 Uhr | ", createVNode(_components.a, {
          href: "/adresse#raumaufteilung",
          children: "Unterkirche"
        })]
      })
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Spiel \"Saurival\"",
            src: __3_______images_Saurvival_webp__
          })
        })
      }), createVNode(ImageTextRight, {
        children: [createVNode(_components.p, {
          children: "Begib dich auf ein Abenteuer und kämpf in einer Gegend voller wilder Saurier um das Überleben. Ein paar einfache Gegenstände bekommst du mit auf den Weg, den Rest musst du selber suchen, erkämpfen oder herstellen. Nutz die Stärke und die Fähigkeiten der Saurier, indem du sie mit einem Fangutensil deiner Truppe hinzufügst. Sammle auf der Ebene, in der Höhle und auf dem See alles, was du brauchst, um dich im Urwald der ultimativen Herausforderung zu stellen: dem T-Rex!"
        }), createVNode(_components.p, {
          children: "Das Spiel «Saurvival» ist im Jahr 2022 mit Hilfe eines Crowdfundings für den Schweizer Markt erschienen. Jessica und Marc (das Entwicklerteam) sind vor Ort, um euch das Spiel zu zeigen und eine Runde mit euch zu spielen."
        })]
      })]
    }), "\n", createVNode(_components.h2, {
      id: "spieldesigner-thomas-vogel",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#spieldesigner-thomas-vogel",
        children: "Spieldesigner Thomas Vogel"
      })
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.em, {
        children: ["Sonntag, 14 bis 17 Uhr | ", createVNode(_components.a, {
          href: "/adresse#raumaufteilung",
          children: "Unterkirche"
        })]
      })
    }), "\n", createVNode(ImageText, {
      children: [createVNode(ImageTextLeft, {
        children: createVNode(_components.p, {
          children: createVNode(_component0, {
            alt: "Kartenspiel",
            src: __4_______images_ThomasJorg_webp__
          })
        })
      }), createVNode(ImageTextRight, {
        children: createVNode(_components.p, {
          children: "Was macht man als Vater und Lehrer eigentlich, wenn man eine Leidenschaft für Gesellschaftsspiele hat, gerne malt und gerne ein Projekt am laufen hat? Man entwickelt Kartenspiele. Ich Thomas Vogel freue mich euch an der Messe kennenzulernen und ein paar meiner Spiele zu spielen."
        })
      })]
    }), "\n", createVNode($$ReferenceGilde, {
      event: "LST"
    })]
  });
}
function MDXContent$1(props = {}) {
  return createVNode(MDXLayout$1, {
    ...props,
    children: createVNode(_createMdxContent$1, {
      ...props
    })
  });
}

const url$1 = "/programm/spieldesigner";
const file$1 = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/spieldesigner.mdx";
const Content$1 = (props = {}) => MDXContent$1({
  ...props,
  components: { Fragment: Fragment, ...props.components, "astro-image":  props.components?.img ?? $$Image },
});
Content$1[Symbol.for('mdx-component')] = true;
Content$1[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter$1.layout);
Content$1.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/programm/spieldesigner.mdx";
__astro_tag_component__(Content$1, 'astro:jsx');

const _page$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content: Content$1,
  __usesAstroImage,
  default: Content$1,
  file: file$1,
  frontmatter: frontmatter$1,
  getHeadings: getHeadings$1,
  url: url$1
}, Symbol.toStringTag, { value: 'Module' }));

const $$Favicon = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"><link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-57x57.png"><link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png"><link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.png"><link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png"><link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.png"><link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png"><link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.png"><link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png"><link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16"><link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32"><link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96"><link rel="icon" type="image/png" href="/android-chrome-192x192.png" sizes="192x192"><meta name="msapplication-square70x70logo" content="/smalltile.png"><meta name="msapplication-square150x150logo" content="/mediumtile.png"><meta name="msapplication-wide310x150logo" content="/widetile.png"><meta name="msapplication-square310x310logo" content="/largetile.png">`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/favicon.astro", void 0);

const $$NavigationMain = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$NavigationMain;
  const { entries } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<nav class="main-navigation" aria-label="main navigation"> <ul> ${entries.toSorted((a, b) => a.order - b.order).map((entry) => renderTemplate`<li> <a${addAttribute(entry.url, "href")}>${entry.label}</a> </li>`)} </ul> </nav>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/navigation/navigation-main.astro", void 0);

const $$NavigationSecondary = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$NavigationSecondary;
  const { entries } = Astro2.props;
  return renderTemplate`${entries.length > 0 && renderTemplate`${maybeRenderHead()}<nav class="secondary-navigation" aria-label="secondary navigation"><ul>${entries.toSorted((a, b) => a.order - b.order).map((entry) => renderTemplate`<li><a${addAttribute(entry.url, "href")}>${entry.label}</a></li>`)}</ul></nav>`}`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/navigation/navigation-secondary.astro", void 0);

const $$ThemeSwitcher = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<button class="button hidden" data-toggle-theme> <span data-toggle-theme-to-light class="hidden"> ${renderComponent($$result, "Icon", Icon, { "icon": "sun-bright" })} </span> <span data-toggle-theme-to-dark> ${renderComponent($$result, "Icon", Icon, { "icon": "moon-stars" })} </span> </button>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/theme-switcher.astro", void 0);

const $$Footer$1 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="mobile-footer"> ${renderComponent($$result, "ThemeSwitcher", $$ThemeSwitcher, {})} </footer>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/mobile/footer.astro", void 0);

const $$MenuContainer = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$MenuContainer;
  const { mainNavigation, secondaryNavigation } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<aside class="mobile-menu-container"> ${renderComponent($$result, "NavigationMain", $$NavigationMain, { "entries": mainNavigation })} ${renderComponent($$result, "NavigationSecondary", $$NavigationSecondary, { "entries": secondaryNavigation })} ${renderComponent($$result, "Footer", $$Footer$1, {})} </aside>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/mobile/menu-container.astro", void 0);

const $$Navigation = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Navigation;
  const { mainNavigation, secondaryNavigation } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<input type="checkbox" id="mobile-navigation" class="hidden"> <label for="mobile-navigation" class="toggle-mobile-navigation" data-toggle-mobile-navigation> <svg aria-hidden="true" focusable="false" data-icon="bars-staggered" class="fa-bars-staggered open-menu-container" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> <g> <path style="opacity: 0.4;" fill="currentColor" d="M64 256C64 238.3 78.33 224 96 224H480C497.7 224 512 238.3 512 256C512 273.7 497.7 288 480 288H96C78.33 288 64 273.7 64 256z"></path> <path fill="currentColor" d="M416 128H32C14.33 128 0 113.7 0 96C0 78.33 14.33 64 32 64H416C433.7 64 448 78.33 448 96C448 113.7 433.7 128 416 128zM416 448H32C14.33 448 0 433.7 0 416C0 398.3 14.33 384 32 384H416C433.7 384 448 398.3 448 416C448 433.7 433.7 448 416 448z"></path> </g> </svg> <svg aria-hidden="true" focusable="false" class="fa-xmark close-menu-container" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"> <path fill="currentColor" d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path> </svg> </label> ${renderComponent($$result, "MenuContainer", $$MenuContainer, { "mainNavigation": mainNavigation, "secondaryNavigation": secondaryNavigation })}`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/mobile/navigation.astro", void 0);

const $$Gdn = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000" height="75" width="75" class="gdn-logo"> <defs> <style>
      .gdn-gradient-1 {
        fill: url("#gdn-gradient-1");
      }

      .gdn-gradient-2 {
        fill: url("#gdn-gradient-2");
      }

      .gdn-gradient-3 {
        fill: url("#gdn-gradient-3");
      }

      .gdn-gradient-4 {
        fill: url("#gdn-gradient-4");
      }

      .gdn-gradient-5 {
        fill: url("#gdn-gradient-5");
      }

      .gdn-gradient-6 {
        fill: url("#gdn-gradient-6");
      }
    </style> <linearGradient id="gdn-gradient-1" x1="392.09" y1="221.37" x2="566.4" y2="221.37" gradientUnits="userSpaceOnUse"> <stop offset="0" stop-color="var(--clr-light)"></stop> <stop offset="1" stop-color="var(--clr-base)"></stop> </linearGradient> <linearGradient id="gdn-gradient-2" x1="433.6" y1="778.63" x2="607.91" y2="778.63" gradientUnits="userSpaceOnUse"> <stop offset="0" stop-color="var(--clr-base)"></stop> <stop offset="1" stop-color="var(--clr-light)"></stop> </linearGradient> <linearGradient id="gdn-gradient-3" x1="105" y1="385" x2="398.96" y2="385" xlink:href="#gdn-gradient-1"></linearGradient> <linearGradient id="gdn-gradient-4" x1="601.04" y1="615" x2="895" y2="615" xlink:href="#gdn-gradient-2"></linearGradient> <linearGradient id="gdn-gradient-5" x1="192.9" y1="653.63" x2="355.66" y2="653.63" xlink:href="#gdn-gradient-1"></linearGradient> <linearGradient id="gdn-gradient-6" x1="644.34" y1="346.37" x2="807.1" y2="346.37" xlink:href="#gdn-gradient-2"></linearGradient> </defs> <g> <path class="gdn-fill-1" d="M566.4,425,653,575h45.35q-4.12-8.58-8.94-16.93L612.58,425Z"></path> <path class="gdn-fill-1" d="M681,655c10.94,81.86-27.26,166.15-103.1,209.94l20,34.64A250.55,250.55,0,0,0,721.45,655Z"></path> <path class="gdn-fill-1" d="M319,345c-10.94-81.86,27.26-166.15,103.1-209.94l-20-34.64A250.55,250.55,0,0,0,278.55,345Z"></path> <path class="gdn-fill-1" d="M433.6,575,347,425H301.65q4.13,8.58,8.94,16.93L387.42,575Z"></path> <path class="gdn-fill-1" d="M468.25,405h173.2l22.68-39.28Q654.64,365,645,365H491.34Z"></path> <path class="gdn-fill-1" d="M821.78,438.22A249.89,249.89,0,0,0,745,385.72l-20.22,35C801.1,452.2,855,527.42,855,615h40A248.36,248.36,0,0,0,821.78,438.22Z"></path> <path class="gdn-fill-1" d="M531.75,595H358.55l-22.68,39.28q9.5.71,19.13.72H508.66Z"></path> <path class="gdn-fill-1" d="M275.26,579.26C198.9,547.8,145,472.58,145,385H105A250.53,250.53,0,0,0,255,614.28Z"></path> <path class="gdn-fill-1" d="M465.78,290.72q-5.37,7.88-10.19,16.21L378.76,440l23.09,40,86.6-150Z"></path> <path class="gdn-fill-1" d="M607.39,190.45a249.69,249.69,0,0,0-83.88,40.27l20.22,35c65.43-50.4,157.52-59.47,233.36-15.68l20-34.64A248.31,248.31,0,0,0,607.39,190.45Z"></path> <path class="gdn-fill-1" d="M598.15,520l-86.6,150,22.67,39.28q5.37-7.87,10.19-16.21L621.24,560Z"></path> <path class="gdn-fill-1" d="M456.27,734.26c-65.43,50.4-157.52,59.47-233.36,15.68l-20,34.64a250.58,250.58,0,0,0,273.58-15.3Z"></path> <path class="gdn-gradient-1" d="M566.4,345l-137-237.26a20,20,0,0,0-34.64,20L520.21,345Z"></path> <path class="gdn-gradient-2" d="M605.23,872.26,479.79,655H433.6l137,237.26a20,20,0,1,0,34.64-20Z"></path> <path class="gdn-gradient-3" d="M399,365H125a20,20,0,0,0,0,40H375.87Z"></path> <path class="gdn-gradient-4" d="M875,595H624.13L601,635H875a20,20,0,0,0,0-40Z"></path> <path class="gdn-gradient-5" d="M332.57,520l-137,237.26a20,20,0,0,0,34.64,20L355.66,560Z"></path> <path class="gdn-gradient-6" d="M797.09,215.42a20,20,0,0,0-27.32,7.32L644.34,440l23.09,40,137-237.26A20,20,0,0,0,797.09,215.42Z"></path> </g> </svg>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/logos/gdn.astro", void 0);

const $$Lst = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000" height="75" width="75" class="lst-logo"> <defs> <style>
      .lst-gradient-1 {
        fill: url("#lst-gradient-1");
      }

      .lst-gradient-2 {
        fill: url("#lst-gradient-2");
      }

      .lst-gradient-3 {
        fill: url("#lst-gradient-3");
      }
    </style> <linearGradient id="lst-gradient-1" x1="820.05" y1="684.81" x2="820.05" y2="295" gradientUnits="userSpaceOnUse"> <stop offset="0.2" stop-color="var(--clr-blue-to-green-start)"></stop> <stop offset="1" stop-color="var(--clr-blue-to-green-end)"></stop> </linearGradient> <linearGradient id="lst-gradient-2" x1="160" y1="224.03" x2="510" y2="224.03" gradientUnits="userSpaceOnUse"> <stop offset="0" stop-color="var(--clr-yellow-to-red-end)"></stop> <stop offset="0.8" stop-color="var(--clr-yellow-to-red-start)"></stop> </linearGradient> <linearGradient id="lst-gradient-3" x1="169.89" y1="778.56" x2="520.21" y2="778.56" gradientUnits="userSpaceOnUse"> <stop offset="0.2" stop-color="var(--clr-pink-to-purple-start)"></stop> <stop offset="1" stop-color="var(--clr-pink-to-purple-end)"></stop> </linearGradient> </defs> <g> <path class="lst-fill-1" d="M199.89,682.93V315.19h-40V684.81H160c0,.07,0,.13,0,.19a20,20,0,0,0,40,0A20.2,20.2,0,0,0,199.89,682.93Z"></path> <path class="lst-fill-2" d="M840,685a20,20,0,0,0-29.83-17.4l-.06-.11L490,852.31,510,887,828.28,703.19A20,20,0,0,0,840,685Z"></path> <path class="lst-fill-3" d="M510,113.05l-.06.11a20,20,0,1,0-18.43,35.4l318.6,184,20-34.64Z"></path> <path class="lst-gradient-1" d="M840,315.19c0-.07,0-.13,0-.19a20,20,0,0,0-40,0,20.2,20.2,0,0,0,.11,2.07V684.81h40V315.19Z"></path> <path class="lst-gradient-2" d="M510,147.69l-20-34.64L171.72,296.81a20,20,0,1,0,18.11,35.59l.06.11Z"></path> <path class="lst-gradient-3" d="M508.49,851.44l-318.6-184-20,34.64L490,887l.06-.11a20,20,0,1,0,18.43-35.4Z"></path> </g> </svg>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/logos/lst.astro", void 0);

const $$Rst = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000" height="75" width="75" class="rst-logo"> <defs> <style>
      .rst-gradient-1 {
        fill: url("#rst-gradient-1");
      }

      .rst-gradient-2 {
        fill: url("#rst-gradient-2");
      }

      .rst-gradient-3 {
        fill: url("#rst-gradient-3");
      }

      .rst-gradient-4 {
        fill: url("#rst-gradient-4");
      }
    </style> <linearGradient id="rst-gradient-1" x1="89.92" y1="210.49" x2="233.63" y2="331.07" gradientUnits="userSpaceOnUse"> <stop offset="0" stop-color="var(--clr-purple-light)"></stop> <stop offset="0.8" stop-color="var(--clr-purple-base)"></stop> </linearGradient> <linearGradient id="rst-gradient-2" x1="566.62" y1="735.16" x2="696.22" y2="735.16" xlink:href="#rst-gradient-1"></linearGradient> <linearGradient id="rst-gradient-3" x1="156.5" y1="479.39" x2="717.44" y2="479.39" gradientUnits="userSpaceOnUse"> <stop offset="0" stop-color="var(--clr-red-light)"></stop> <stop offset="0.8" stop-color="var(--clr-red-base)"></stop> </linearGradient> <linearGradient id="rst-gradient-4" x1="247.21" y1="521.26" x2="882.39" y2="521.26" gradientUnits="userSpaceOnUse"> <stop offset="0.2" stop-color="var(--clr-red-base)"></stop> <stop offset="1" stop-color="var(--clr-red-light)"></stop> </linearGradient> </defs> <g> <path class="rst-fill-2" d="M820,153a125.14,125.14,0,0,0-176.78,0L501.77,294.38h0a20,20,0,0,0,28.28,28.28h0L671.47,181.24a85.09,85.09,0,0,1,120.21,0l56.57,56.57,28.28-28.29Z"></path> <path class="rst-fill-2" d="M756.33,237.81h0l-38.89-38.89h0a20,20,0,0,0-28.29,28.28h0L728,266.09h0a20,20,0,0,0,28.29-28.28Z"></path> <path class="rst-fill-2" d="M156.77,869.33l0-.06,38.79-123.42-38.16-12L118.53,857.6h0a20,20,0,1,0,38.14,12h0Z"></path> <path class="rst-fill-2" d="M275.49,810.56a20,20,0,0,0-20.13-4.92h0L131.61,844.52l12,38.16L267,843.89l.05,0,.27-.08h0a20,20,0,0,0,8.15-33.22Z"></path> <path class="rst-fill-1" d="M332.06,223.67a19.91,19.91,0,0,0-8.51-5l-180.3-53L132,204l180.2,53a20,20,0,0,0,19.9-33.29Z"></path> <path class="rst-gradient-1" d="M209.83,359.44l-53-180.29a20,20,0,1,0-38.34,11.39l53,180.19Z"></path> <path class="rst-fill-1" d="M738.65,566.61l-28.29-28.28-81.31,81.32h0a20,20,0,0,0,28.28,28.28h0Z"></path> <path class="rst-fill-1" d="M600.76,704.5l-28.28-28.29-81.32,81.32h0a20,20,0,0,0,28.29,28.29h0Z"></path> <path class="rst-gradient-2" d="M696.22,771.67l-95.46-95.46h0a20,20,0,0,0-28.28,28.29h0L667.94,800Z"></path> <path class="rst-fill-1" d="M752.79,715.11h0L703.3,665.61h0A20,20,0,0,0,675,693.89h0l49.49,49.49h0a20,20,0,0,0,28.28-28.28Z"></path> <path class="rst-fill-1" d="M547.74,664.34a20,20,0,1,0-35.9-17.57,221.89,221.89,0,0,0-27.36,106.87q0,10.38,1,20.72l39.71-5q-.66-7.8-.67-15.72a180.93,180.93,0,0,1,23.31-89.28Z"></path> <path class="rst-fill-1" d="M738.65,538.33a19.86,19.86,0,0,0-11.71-5.69v0q-10.22-.95-20.47-1A221.46,221.46,0,0,0,599,559.36l18,35.73a181,181,0,0,1,89.53-23.45c5.19,0,10.35.23,15.47.66h0a20,20,0,0,0,16.7-34Z"></path> <path class="rst-fill-1" d="M798.75,732.78a79.74,79.74,0,0,0-56.57-23.43c-1.74,0-3.49.08-5.23.19l3.5,39.85c.57,0,1.15,0,1.73,0a40,40,0,1,1-39.95,39h-.33a20,20,0,1,0-39.68-.29,80,80,0,1,0,136.53-55.29Z"></path> <polygon class="rst-fill-1" points="469.32 384.27 333.13 224.82 302.71 250.8 440.95 412.64 469.32 384.27"></polygon> <path class="rst-fill-1" d="M623,564.24h0l-17.55-20.55-28.37,28.37,15.51,18.16h0c.34.39.68.79,1.05,1.16A20,20,0,0,0,623,564.24Z"></path> <path class="rst-fill-1" d="M203.63,349.88h0a20,20,0,0,0-27.12,29.34c.37.37.77.71,1.16,1h0L337.1,516.49l28.37-28.37Z"></path> <polygon class="rst-fill-1" points="496.51 652.65 517.06 670.21 543.04 639.79 524.88 624.28 496.51 652.65"></polygon> <path class="rst-gradient-3" d="M717.44,227.2l-28.29-28.28L162.36,725.71h0A20,20,0,0,0,190.64,754h0Z"></path> <path class="rst-gradient-4" d="M876.53,209.52a20,20,0,0,0-28.28,0h0l-601,601,28.28,28.29,601-601h0A20,20,0,0,0,876.53,209.52Z"></path> </g> </svg>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/logos/rst.astro", void 0);

const $$Logo = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Logo;
  const { siteCode } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="site-logo"> <a href="/"> ${siteCode === "lst" ? renderTemplate`${renderComponent($$result, "LstLogo", $$Lst, {})}` : siteCode === "rst" ? renderTemplate`${renderComponent($$result, "RstLogo", $$Rst, {})}` : renderTemplate`${renderComponent($$result, "GdnLogo", $$Gdn, {})}`} </a> </div>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/logos/logo.astro", void 0);

const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Header;
  const { siteCode, siteName, siteTagline, mainNavigation, secondaryNavigation } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<header class="header"> ${renderComponent($$result, "Navigation", $$Navigation, { "mainNavigation": mainNavigation, "secondaryNavigation": secondaryNavigation })} <div class="site-name"> <a href="/"> <h1>${siteName}</h1> <h2>${siteTagline}</h2> </a> </div> ${renderComponent($$result, "Logo", $$Logo, { "siteCode": siteCode })} </header>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/header.astro", void 0);

const $$SiteSwitcher = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$SiteSwitcher;
  const { development } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="site-switcher"> <h1>Unser Netzwerk</h1> <div class="switcher"> <div class="logo"> <a${addAttribute(`https://${development ? "test." : ""}gildedernacht.ch/`, "href")}> <div class="network-name"> <h2>Gilde der Nacht</h2> <h3>Luzerner Spielverein</h3> </div> ${renderComponent($$result, "GdnLogo", $$Gdn, {})} </a> </div> <div class="logo"> <a${addAttribute(`https://${development ? "test." : ""}spieltage.ch/`, "href")}> <div class="network-name"> <h2>Luzerner Spieltage</h2> <h3>14. + 15. März 2026</h3> </div> ${renderComponent($$result, "LstLogo", $$Lst, {})} </a> </div> <div class="logo"> <a${addAttribute(`https://${development ? "test." : ""}rollenspieltage.ch/`, "href")}> <div class="network-name"> <h2>Luzerner Rollenspieltage</h2> <h3>22. + 23. August 2026</h3> </div> ${renderComponent($$result, "RstLogo", $$Rst, {})} </a> </div> </div> </div>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/site-switcher.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Footer;
  const { development } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<footer class="footer"> ${renderComponent($$result, "SiteSwitcher", $$SiteSwitcher, { "development": development })} </footer>`;
}, "/home/lvl8/Projects/gilde-website/common/layouts/partials/footer.astro", void 0);

function buildToc(headings) {
  const startHeading = headings[0]?.depth;
  const toc = [];
  const parentHeadings = /* @__PURE__ */ new Map();
  headings.forEach((h) => {
    const heading = { ...h, sub: [] };
    parentHeadings.set(heading.depth, heading);
    if (heading.depth === startHeading) {
      toc.push(heading);
    } else {
      parentHeadings.get(heading.depth - 1).sub.push(heading);
    }
  });
  return toc;
}
function generateTocView(headings, startLevel, endLevel) {
  const filteredEntries = headings.filter(
    (heading) => heading.depth >= startLevel && heading.depth <= endLevel
  );
  return buildToc(filteredEntries);
}

const $$Entry = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Entry;
  const { entry, ordered } = Astro2.props;
  const List = ordered ? "ol" : "ul";
  return renderTemplate`${maybeRenderHead()}<li> <a${addAttribute("#" + entry.slug, "href")}> ${entry.text} </a> ${entry.sub.length > 0 && renderTemplate`${renderComponent($$result, "List", List, {}, { "default": ($$result2) => renderTemplate`${entry.sub.map((subEntry) => renderTemplate`${renderComponent($$result2, "Astro.self", Astro2.self, { "entry": subEntry, "ordered": ordered })}`)}` })}`} </li>`;
}, "/home/lvl8/Projects/gilde-website/common/components/toc/Entry.astro", void 0);

const $$ToC = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ToC;
  const { headings, toc } = Astro2.props;
  function createConfig() {
    if (toc === null) {
      return { render: false };
    }
    if (toc !== true && toc.startLevel > toc.endLevel) {
      return { render: false };
    }
    const startLevel = toc === true ? 2 : toc.startLevel;
    const endLevel = toc === true ? 6 : toc.endLevel;
    const ordered = toc === true ? false : toc.ordered ?? false;
    const tocView = generateTocView(headings, startLevel, endLevel);
    return { render: true, startLevel, endLevel, ordered, toc: tocView };
  }
  const config = createConfig();
  const List = config.render && config.ordered ? "ol" : "ul";
  return renderTemplate`${config.render && renderTemplate`${renderComponent($$result, "List", List, {}, { "default": ($$result2) => renderTemplate`${config.toc.map((entry) => renderTemplate`${renderComponent($$result2, "Entry", $$Entry, { "entry": entry, "ordered": config.ordered })}`)}` })}`}`;
}, "/home/lvl8/Projects/gilde-website/common/components/toc/ToC.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    locale,
    title,
    metaTitle,
    description,
    keywords,
    siteCode,
    siteName,
    siteTagline,
    pages,
    development,
    toc,
    headings
  } = Astro2.props;
  const pageType = z.object({
    frontmatter: z.optional(
      z.object({
        navigation: z.optional(
          z.object({
            group: z.enum(["main", "secondary"]),
            label: z.string(),
            order: z.number()
          })
        )
      })
    ),
    url: z.string()
  });
  const pageWithNavigationType = z.object({
    frontmatter: z.object({
      navigation: z.object({
        group: z.enum(["main", "secondary"]),
        label: z.string(),
        order: z.number()
      })
    }),
    url: z.string()
  });
  const mainNavigation = pages.map((page) => pageType.parse(page)).filter((page) => page.frontmatter?.navigation?.group === "main").map((page) => pageWithNavigationType.parse(page)).map((page) => ({
    label: page.frontmatter.navigation.label,
    order: page.frontmatter.navigation.order,
    url: page.url === "" ? "/" : page.url
  }));
  const secondaryNavigation = pages.map((page) => pageType.parse(page)).filter((page) => page.frontmatter?.navigation?.group === "secondary").map((page) => pageWithNavigationType.parse(page)).map((page) => ({
    label: page.frontmatter.navigation.label,
    order: page.frontmatter.navigation.order,
    url: page.url === "" ? "/" : page.url
  }));
  return renderTemplate(_a || (_a = __template(["<html", ' dir="ltr"> <head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">', "", "<title>", '</title><script src="/icons/duotone.min.js"><\/script><script src="/icons/fontawesome.min.js"><\/script>', "", "", "</head> <body", "> ", ' <div class="main-wrapper"> <main class="primary-content content"> ', " ", " ", " </main> </div> ", " </body></html>"])), addAttribute(locale ?? "de", "lang"), description && renderTemplate`<meta name="description"${addAttribute(description, "content")}>`, keywords && renderTemplate`<meta name="keywords"${addAttribute(keywords, "content")}>`, metaTitle ?? title, renderScript($$result, "/home/lvl8/Projects/gilde-website/common/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts"), renderComponent($$result, "Favicon", $$Favicon, {}), renderHead(), addAttribute(siteCode, "class"), renderComponent($$result, "Header", $$Header, { "siteCode": siteCode, "siteName": siteName, "siteTagline": siteTagline, "mainNavigation": mainNavigation, "secondaryNavigation": secondaryNavigation }), title !== void 0 && title.length > 0 && renderTemplate`<h1>${title}</h1>`, renderComponent($$result, "ToC", $$ToC, { "headings": headings, "toc": toc }), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, { "development": development }));
}, "/home/lvl8/Projects/gilde-website/common/layouts/BaseLayout.astro", void 0);

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { locale, title, metaTitle, description, keywords, toc } = Astro2.props.frontmatter ?? Astro2.props;
  const { headings } = Astro2.props;
  const siteName = "Luzerner Spieltage";
  const siteCode = "lst";
  const siteTagline = "14. + 15. März 2026";
  const pages = Object.values([_page,_page$g,_page$f,_page$e,_page$d,_page$c,_page$b,_page$a,_page$9,_page$8,_page$7,_page$6,_page$5,_page$4,_page$3,_page$2,_page$1]);
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "locale": locale, "title": title, "metaTitle": [metaTitle, siteName].filter(Boolean).join(" | "), "description": description, "keywords": keywords, "siteCode": siteCode, "siteName": siteName, "siteTagline": siteTagline, "pages": pages, "headings": headings, "toc": toc ?? null, "development": false }, { "default": ($$result2) => renderTemplate` ${renderSlot($$result2, $$slots["default"])} ` })}`;
}, "/home/lvl8/Projects/gilde-website/spieltage.ch/layouts/Layout.astro", void 0);

const MDXLayout = function ({children}) {
  const {layout, ...content} = frontmatter;
  content.file = file;
  content.url = url;
  return createVNode($$Layout, {
    file,
    url,
    content,
    frontmatter: content,
    headings: getHeadings(),
    'server:root': true,
    children
  });
};
const frontmatter = {
  "layout": "@lst/layouts/Layout.astro",
  "metaTitle": "Seite nicht gefunden / Site not found",
  "permalink": "/404.html"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "404",
    "text": "404"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    br: "br",
    em: "em",
    h1: "h1",
    p: "p",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "404",
      children: createVNode(_components.a, {
        class: "header-anchor",
        href: "#404",
        children: "404"
      })
    }), "\n", createVNode(_components.p, {
      children: ["Die gesuchte Seite existiert leider nicht.", createVNode(_components.br, {}), "\n", createVNode(_components.em, {
        children: "Sorry, we couldn›t find that page."
      })]
    }), "\n", createVNode(ButtonLink, {
      link: "/",
      label: "Zurück zur Startseite / Back to the homepage"
    })]
  });
}
function MDXContent(props = {}) {
  return createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  });
}

const url = "/404";
const file = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/404.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/home/lvl8/Projects/gilde-website/spieltage.ch/pages/404.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { _page as _, _page$g as a, _page$f as b, _page$e as c, _page$d as d, _page$c as e, _page$b as f, _page$9 as g, _page$8 as h, _page$7 as i, _page$6 as j, _page$4 as k, _page$3 as l, _page$2 as m, _page$1 as n, _page$5 as o, _page$a as p, baseService as q, parseQuality as r };
