/* ==========================================================================
   CAPA Peer Support Directory
   --------------------------------------------------------------------------
   No frameworks, no build step, no storage. Every piece of state, the
   language, the search text, and every filter, lives in the URL, so any
   view of this page can be copied and shared as a link.
   ========================================================================== */

(function () {
  "use strict";

  var CONFIG = window.CAPA_CONFIG;
  var I18N = window.I18N;

  /* ---------------------------------------------------------------- helpers */

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        if (key === "class") node.className = props[key];
        else if (key === "text") node.textContent = props[key];
        else if (key === "html") node.innerHTML = props[key];
        else if (props[key] !== null && props[key] !== undefined && props[key] !== false) {
          node.setAttribute(key, props[key]);
        }
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /** Strip accents and case so "Québec" matches "quebec". */
  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  /** Edit distance capped at 2, enough to forgive one typo, cheap to run. */
  function withinOneEdit(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  /* ------------------------------------------------------------ translation */

  var lang = "en";

  function t(key, vars) {
    var table = I18N[lang] || I18N.en;
    var value = table[key];
    if (value === undefined) value = I18N.en[key];
    if (value === undefined) return key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        value = value.split("{" + name + "}").join(vars[name]);
      });
    }
    return value;
  }

  /** Plural helper: "results.count" / "results.count.plural". */
  function tCount(key, n) {
    return t(n === 1 ? key : key + ".plural", { n: n });
  }

  /** Free-text spreadsheet terms: translate when we know the term, else show English. */
  function term(value) {
    var word = (lang === "fr" && I18N.terms[value]) ? I18N.terms[value] : value;
    /* The spreadsheet keeps these lowercase so they stay a tidy controlled
       vocabulary. They are capitalised here so they match every other label on
       screen rather than sitting in lowercase beside them. */
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /** Pick the French text when it exists, otherwise fall back to English. */
  function localized(record, field) {
    if (lang === "fr") {
      var fr = record[field + "_fr"];
      if (fr && String(fr).trim()) return fr;
    }
    return record[field + "_en"] || "";
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = String(iso).split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    try {
      return new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA",
        { year: "numeric", month: "long", day: "numeric" }).format(date);
    } catch (err) {
      return iso;
    }
  }

  function monthsSince(iso) {
    var parts = String(iso).split("-");
    var then = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var now = new Date();
    return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
  }

  /* --------------------------------------------------------- filter schema */

  var PROVINCE_ORDER = ["national", "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];

  var FILTERS = [
    { key: "prov",  field: "province",       param: "prov",  labelKey: "filter.province",
      prefix: "prov.",       primary: true, order: PROVINCE_ORDER },
    { key: "format", field: "format",         param: "format", labelKey: "filter.format",
      prefix: "format.",     primary: true, order: ["in-person", "virtual", "hybrid", "phone", "online-forum"] },
    { key: "cost",  field: "cost",           param: "cost",  labelKey: "filter.cost",
      prefix: "cost.",       primary: true, order: ["free", "membership-required", "fee", "unknown"] },
    { key: "cat",   field: "category",       param: "cat",   labelKey: "filter.condition",
      prefix: "category.",   primary: true,
      order: ["arthritis", "psoriatic-disease", "lupus", "scleroderma", "sjogrens",
              "myositis", "vasculitis", "autoinflammatory", "chronic-pain", "other-rheumatic"] },
    { key: "glang", field: "language",       param: "glang", labelKey: "filter.language",
      prefix: "lang.",       primary: false, order: ["en", "fr", "other"] },
    { key: "fac",   field: "facilitator_type", param: "fac",  labelKey: "filter.facilitator",
      prefix: "facilitator.", primary: false, order: ["peer-volunteer", "staff", "health-professional", "mixed", "unknown"] },
    { key: "aud",   field: "audience",       param: "aud",   labelKey: "filter.audience",
      prefix: "audience.",   primary: false, order: ["adults", "youth", "children", "seniors", "caregivers", "families", "women", "men", "anyone"] },
    { key: "based", field: "based_in",       param: "based", labelKey: "filter.basedIn",
      prefix: "based.",      primary: false, order: ["canada", "united-states", "united-kingdom", "ireland", "australia", "new-zealand", "international"] }
  ];

  function optionLabel(filter, value) {
    return filter.freeText ? term(value) : t(filter.prefix + value);
  }

  /* -------------------------------------------------------------- app state */

  var state = { q: "", mod: false, selected: {} };
  var records = [];
  var meta = {};

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    lang = params.get("lang") === "fr" ? "fr" : "en";
    state.q = params.get("q") || "";
    state.mod = params.get("mod") === "yes";
    state.selected = {};
    FILTERS.forEach(function (filter) {
      var raw = params.get(filter.param);
      state.selected[filter.key] = raw ? raw.split(",").filter(Boolean) : [];
    });
  }

  function writeUrl(replace) {
    var params = new URLSearchParams();
    if (lang === "fr") params.set("lang", "fr");
    if (state.q.trim()) params.set("q", state.q.trim());
    FILTERS.forEach(function (filter) {
      var values = state.selected[filter.key];
      if (values && values.length) params.set(filter.param, values.join(","));
    });
    if (state.mod) params.set("mod", "yes");
    var query = params.toString();
    var url = window.location.pathname + (query ? "?" + query : "");
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  function activeFilterCount() {
    var count = state.mod ? 1 : 0;
    FILTERS.forEach(function (filter) { count += state.selected[filter.key].length; });
    return count;
  }

  /* ------------------------------------------------------------- filtering */

  function valuesOf(record, field) {
    var value = record[field];
    if (Array.isArray(value)) return value;
    return value === undefined || value === null || value === "" ? [] : [value];
  }

  function matchesSearch(record) {
    var query = normalize(state.q).trim();
    if (!query) return true;
    var haystack = normalize([
      record.name_en, record.name_fr, record.organization,
      record.description_en, record.description_fr,
      (record.focus_areas || []).join(" "),
      (record.conditions || []).join(" "),
      record.city || ""
    ].join(" "));
    var words = haystack.split(/[^a-z0-9]+/).filter(Boolean);

    return query.split(/\s+/).every(function (token) {
      if (haystack.indexOf(token) !== -1) return true;
      if (token.length < 5) return false;
      return words.some(function (word) { return withinOneEdit(token, word); });
    });
  }

  function matchesFilters(record, skipKey) {
    if (state.mod && skipKey !== "mod" && record.moderated !== "yes") return false;
    return FILTERS.every(function (filter) {
      if (filter.key === skipKey) return true;
      var chosen = state.selected[filter.key];
      if (!chosen.length) return true;
      var have = valuesOf(record, filter.field);
      return chosen.some(function (value) { return have.indexOf(value) !== -1; });
    });
  }

  function filtered() {
    var matches = records.filter(function (record) {
      return matchesSearch(record) && matchesFilters(record);
    });
    /* This is a directory for people in Canada, so groups run from Canada come
       first. Everything else keeps the order it has in the spreadsheet. */
    return matches.sort(function (a, b) {
      return (a.based_in === "canada" ? 0 : 1) - (b.based_in === "canada" ? 0 : 1);
    });
  }

  /* ---------------------------------------------------- rendering: filters */

  function facetValues(filter) {
    var seen = {};
    records.forEach(function (record) {
      valuesOf(record, filter.field).forEach(function (value) { seen[value] = true; });
    });
    var values = Object.keys(seen);
    if (filter.order) {
      values.sort(function (a, b) {
        var ia = filter.order.indexOf(a), ib = filter.order.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    } else {
      values.sort(function (a, b) {
        return optionLabel(filter, a).localeCompare(optionLabel(filter, b), lang === "fr" ? "fr" : "en");
      });
    }
    return values;
  }

  /** How many results each option would give, with the other filters still applied. */
  function optionCount(filter, value) {
    return records.filter(function (record) {
      return matchesSearch(record)
        && matchesFilters(record, filter.key)
        && valuesOf(record, filter.field).indexOf(value) !== -1;
    }).length;
  }

  function buildFilterGroup(filter) {
    var values = facetValues(filter);
    if (!values.length) return null;

    var list = el("ul", { class: "option-list" });

    values.forEach(function (value) {
      var id = "f-" + filter.key + "-" + String(value).replace(/[^a-z0-9]+/gi, "-");
      var checked = state.selected[filter.key].indexOf(value) !== -1;
      var count = optionCount(filter, value);

      var input = el("input", {
        type: "checkbox", id: id, value: value,
        checked: checked ? "checked" : null
      });
      input.addEventListener("change", function () {
        var chosen = state.selected[filter.key];
        var at = chosen.indexOf(value);
        if (input.checked && at === -1) chosen.push(value);
        else if (!input.checked && at !== -1) chosen.splice(at, 1);
        writeUrl(false);
        render();
      });

      list.appendChild(el("li", null, [
        el("label", { class: "option", for: id }, [
          input,
          el("span", { text: optionLabel(filter, value) }),
          el("span", { class: "option-count", "aria-hidden": "true", text: String(count) }),
          el("span", { class: "visually-hidden", text: "(" + count + ")" })
        ])
      ]));
    });

    return el("fieldset", { class: "filter-group" }, [
      el("legend", { text: t(filter.labelKey) }),
      list
    ]);
  }

  function buildModerationGroup() {
    var input = el("input", {
      type: "checkbox", id: "f-moderated",
      checked: state.mod ? "checked" : null,
      "aria-describedby": "f-moderated-hint"
    });
    input.addEventListener("change", function () {
      state.mod = input.checked;
      writeUrl(false);
      render();
    });

    return el("fieldset", { class: "filter-group" }, [
      el("legend", { text: t("filter.moderated") }),
      el("ul", { class: "option-list" }, [
        el("li", null, [
          el("label", { class: "option", for: "f-moderated" }, [
            input,
            el("span", { text: t("filter.moderatedOnly") })
          ])
        ])
      ]),
      el("p", { class: "field-hint", id: "f-moderated-hint", text: t("filter.moderatedHint") })
    ]);
  }

  function renderFilters() {
    var host = document.getElementById("filter-groups");
    clear(host);

    FILTERS.filter(function (f) { return f.primary; }).forEach(function (filter) {
      var group = buildFilterGroup(filter);
      if (group) host.appendChild(group);
    });

    var more = el("details", { class: "more-filters" }, [
      el("summary", { text: t("filters.moreHeading") })
    ]);
    var secondary = FILTERS.filter(function (f) { return !f.primary; });
    var hasSecondarySelection = state.mod || secondary.some(function (f) { return state.selected[f.key].length; });
    if (hasSecondarySelection) more.setAttribute("open", "open");

    secondary.forEach(function (filter) {
      var group = buildFilterGroup(filter);
      if (group) more.appendChild(group);
    });
    more.appendChild(buildModerationGroup());
    host.appendChild(more);
  }

  /* ---------------------------------------------------- rendering: results */

  function chip(text, extraClass) {
    return el("li", { class: "chip" + (extraClass ? " " + extraClass : ""), text: text });
  }

  /* One chip per idea, not one per value. A national listing was producing a
     chip for every province and every language, which pushed the row onto two
     lines and buried the group's name. */
  function locationLabel(record) {
    var provinces = record.province || [];
    if (provinces.indexOf("national") !== -1) return t("prov.national");
    if (provinces.length <= 2) {
      return provinces.map(function (code) { return t("prov." + code); }).join(", ");
    }
    return provinces.join(", ");   // three or more: the two letter codes stay readable
  }

  function languageLabel(record) {
    return (record.language || []).map(function (code) { return t("lang." + code); }).join(", ");
  }

  function detailRow(label, value) {
    if (!value || !String(value).trim()) return null;
    return el("div", null, [
      el("dt", { text: label }),
      el("dd", { text: value })
    ]);
  }

  function buildCard(record) {
    var name = localized(record, "name") || record.name_en;
    var detailsId = "details-" + record.id;

    /* --- chips: format, provinces, cost, languages, moderation --- */
    var chips = el("ul", { class: "chips" });
    chips.appendChild(chip(t("format." + record.format)));
    /* For a group run from outside Canada, "Based in the United Kingdom" is the
       useful fact and "Across Canada" adds nothing, so only one of the two
       appears. The expanded detail carries both either way. */
    if (!record.based_in || record.based_in === "canada") {
      chips.appendChild(chip(locationLabel(record)));
    }
    chips.appendChild(chip(t("cost." + record.cost)));
    chips.appendChild(chip(languageLabel(record)));
    chips.appendChild(chip(t("moderated." + record.moderated), "chip-mod-" + record.moderated));
    if (record.based_in && record.based_in !== "canada") {
      /* Only flagged when it is NOT Canadian, a Canadian reader should never
         have to work out that a listing is run from another country. */
      chips.appendChild(chip(
        record.based_in === "international"
          ? t("based.internationalChip")
          : t("based.note", { place: t("based." + record.based_in) }),
        "chip-based"));
    }

    /* --- expanding detail region --- */
    var details = el("div", { class: "card-details", id: detailsId, hidden: "hidden" }, [
      el("dl", { class: "detail-list" }, [
        detailRow(t("field.basedIn"), record.based_in ? t("based." + record.based_in) : ""),
        detailRow(t("field.category"), record.category ? t("category." + record.category) : ""),
        detailRow(t("field.conditions"), (record.conditions || []).map(term).join(", ")),
        detailRow(t("field.focusAreas"), (record.focus_areas || []).map(term).join(", ")),
        detailRow(t("field.audience"), (record.audience || []).map(function (a) { return t("audience." + a); }).join(", ")),
        detailRow(t("field.location"),
          [(record.province || []).map(function (code) { return t("prov." + code); }).join(", "),
           record.city].filter(Boolean).join(" . ")),
        detailRow(t("field.schedule"), localized(record, "schedule_notes")),
        detailRow(t("field.howToAccess"),
          [t("access." + record.how_to_access), localized(record, "how_to_access_notes")]
            .filter(Boolean).join(", ")),
        detailRow(t("field.facilitator"),
          [t("facilitator." + record.facilitator_type), localized(record, "facilitator_notes")]
            .filter(Boolean).join(", ")),
        detailRow(t("field.moderated"),
          [t("moderated." + record.moderated), localized(record, "moderation_notes")]
            .filter(Boolean).join(", ")),
        detailRow(t("filter.cost"), localized(record, "cost_notes")),
        detailRow(t("field.language"), localized(record, "language_notes")),
        detailRow(t("field.contact"), [record.contact_email, record.contact_phone].filter(Boolean).join(" · "))
      ])
    ]);

    if (record.source_url) {
      details.appendChild(el("p", { class: "card-source" }, [
        el("a", { href: record.source_url, rel: "noopener", target: "_blank" }, [
          el("span", { text: t("field.sourceLink") })
        ])
      ]));
    }

    /* --- actions --- */
    var toggle = el("button", {
      type: "button", class: "btn details-toggle",
      "aria-expanded": "false", "aria-controls": detailsId,
      text: t("results.details")
    });
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      toggle.textContent = open ? t("results.details") : t("results.detailsHide");
      if (open) details.setAttribute("hidden", "hidden");
      else details.removeAttribute("hidden");
    });

    var actions = el("div", { class: "card-actions" });
    if (record.access_url) {
      actions.appendChild(el("a", {
        class: "btn btn-primary", href: record.access_url,
        target: "_blank", rel: "noopener",
        "aria-label": t("results.joinAria", { name: name })
      }, [el("span", { text: t("results.join") })]));
    }
    actions.appendChild(toggle);

    /* --- footer: when we last checked --- */
    var footer = el("p", { class: "card-footer" }, [
      el("span", { text: t("results.verified", { date: formatDate(record.last_verified) }) })
    ]);
    if (monthsSince(record.last_verified) > CONFIG.staleAfterMonths) {
      footer.appendChild(el("strong", { class: "stale-note", text: t("results.stale") }));
    }

    var card = el("article", { class: "card" });
    if (record.placeholder) {
      card.appendChild(el("p", {
        class: "sample-badge", title: t("results.sampleTitle"), text: t("results.sampleBadge")
      }));
    }
    card.appendChild(el("h3", { class: "card-name", text: name }));
    card.appendChild(el("p", { class: "card-org", text: t("field.organization") + ": " + record.organization }));
    card.appendChild(chips);
    card.appendChild(el("p", { class: "card-desc", text: localized(record, "description") }));
    card.appendChild(actions);
    card.appendChild(details);
    card.appendChild(footer);
    return card;
  }

  function buildEmptyState() {
    var suggestions = el("ul");

    FILTERS.forEach(function (filter) {
      state.selected[filter.key].forEach(function (value) {
        var label = optionLabel(filter, value);
        var button = el("button", {
          type: "button", class: "btn btn-quiet",
          text: t("empty.remove", { label: label })
        });
        button.addEventListener("click", function () {
          var chosen = state.selected[filter.key];
          chosen.splice(chosen.indexOf(value), 1);
          writeUrl(false);
          render();
        });
        suggestions.appendChild(el("li", null, [button]));
      });
    });

    if (state.mod) {
      var modButton = el("button", {
        type: "button", class: "btn btn-quiet",
        text: t("empty.remove", { label: t("filter.moderatedOnly") })
      });
      modButton.addEventListener("click", function () {
        state.mod = false;
        writeUrl(false);
        render();
      });
      suggestions.appendChild(el("li", null, [modButton]));
    }

    var box = el("div", { class: "empty" }, [
      el("h3", { text: t("empty.heading") }),
      el("p", { text: t("empty.body") })
    ]);
    if (suggestions.childNodes.length) box.appendChild(suggestions);
    box.appendChild(el("p", null, [
      el("a", { href: CONFIG.resourcesUrl }, [el("span", { text: t("empty.resources") })])
    ]));
    return box;
  }

  function renderResults() {
    var list = document.getElementById("result-list");
    var countNode = document.getElementById("result-count");
    var matches = filtered();

    countNode.textContent = tCount("results.count", matches.length);

    clear(list);
    if (!matches.length) {
      list.appendChild(buildEmptyState());
      return;
    }
    matches.forEach(function (record) { list.appendChild(buildCard(record)); });
  }

  /* ------------------------------------------------- rendering: page chrome */

  function applyStaticText() {
    document.documentElement.lang = lang;
    document.title = t("site.title") + " | " + t("site.logoAlt");

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });

    var toggle = document.getElementById("lang-toggle");
    var params = new URLSearchParams(window.location.search);
    if (lang === "fr") params.delete("lang");
    else params.set("lang", "fr");
    var query = params.toString();
    toggle.setAttribute("href", window.location.pathname + (query ? "?" + query : ""));
    toggle.setAttribute("aria-label", t("lang.switchLabel"));
    toggle.setAttribute("lang", lang === "fr" ? "en" : "fr");

    document.getElementById("logo-link").setAttribute("href", CONFIG.homeUrl);
    document.querySelector(".logo").setAttribute("alt", "");

    var search = document.getElementById("search");
    search.setAttribute("placeholder", t("search.placeholder"));

    var suggest = document.getElementById("suggest-link");
    suggest.setAttribute("href", "mailto:" + CONFIG.contactEmail
      + "?subject=" + encodeURIComponent(t("suggest.subject"))
      + "&body=" + encodeURIComponent(t("suggest.body")));

    var updated = document.getElementById("footer-updated");
    updated.textContent = meta.last_updated ? t("footer.updated", { date: formatDate(meta.last_updated) }) : "";

    var filtersToggle = document.getElementById("filters-toggle");
    var open = filtersToggle.getAttribute("aria-expanded") === "true";
    filtersToggle.querySelector("span").textContent = open ? t("filters.hide") : t("filters.show");

    var badge = document.getElementById("filters-active-count");
    var count = activeFilterCount();
    if (count) {
      badge.hidden = false;
      badge.textContent = String(count);
      badge.setAttribute("aria-label", tCount("filters.activeCount", count));
    } else {
      badge.hidden = true;
    }
  }

  function render() {
    applyStaticText();
    renderFilters();
    renderResults();
  }

  /* ------------------------------------------------------------------ setup */

  function wireEvents() {
    var search = document.getElementById("search");
    var timer = null;
    search.addEventListener("input", function () {
      state.q = search.value;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        writeUrl(true);
        render();
      }, 200);
    });

    document.getElementById("filters-panel").addEventListener("submit", function (event) {
      event.preventDefault();
    });

    document.getElementById("clear-all").addEventListener("click", function () {
      state.q = "";
      state.mod = false;
      FILTERS.forEach(function (filter) { state.selected[filter.key] = []; });
      search.value = "";
      writeUrl(false);
      render();
      search.focus();
    });

    var filtersToggle = document.getElementById("filters-toggle");
    var panel = document.getElementById("filters-panel");
    filtersToggle.addEventListener("click", function () {
      var open = filtersToggle.getAttribute("aria-expanded") === "true";
      filtersToggle.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
      filtersToggle.querySelector("span").textContent = open ? t("filters.show") : t("filters.hide");
    });

    document.getElementById("lang-toggle").addEventListener("click", function (event) {
      event.preventDefault();
      lang = lang === "fr" ? "en" : "fr";
      writeUrl(false);
      render();
    });

    window.addEventListener("popstate", function () {
      readUrl();
      document.getElementById("search").value = state.q;
      syncPanelToViewport();
      render();
    });

    window.matchMedia("(min-width: 56rem)").addEventListener("change", syncPanelToViewport);
  }

  /** On desktop the filter panel is always visible; on mobile it starts collapsed. */
  function syncPanelToViewport() {
    var wide = window.matchMedia("(min-width: 56rem)").matches;
    var panel = document.getElementById("filters-panel");
    var toggle = document.getElementById("filters-toggle");
    if (wide) {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    } else if (toggle.getAttribute("aria-expanded") !== "true") {
      panel.hidden = true;
    }
  }

  function showLoadError() {
    var list = document.getElementById("result-list");
    clear(list);
    document.getElementById("result-count").textContent = "";
    list.appendChild(el("div", { class: "empty" }, [
      el("h3", { text: t("empty.noData") }),
      el("p", { text: t("empty.noDataHelp") })
    ]));
  }

  function init() {
    readUrl();
    document.getElementById("search").value = state.q;
    syncPanelToViewport();
    wireEvents();
    applyStaticText();
    document.getElementById("result-count").textContent = t("results.loading");

    fetch(CONFIG.dataUrl, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        meta = { last_updated: payload.last_updated, version: payload.version };
        records = payload.records || [];
        render();
      })
      .catch(function (error) {
        window.console && console.error("Could not load listings:", error);
        showLoadError();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
