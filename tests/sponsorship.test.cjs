const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const postcss = require("postcss");

const repo = path.resolve(__dirname, "..");

function styleDeclarations(relativePath, selector, media = null) {
  const declarations = {};
  const stylesheet = postcss.parse(fs.readFileSync(path.join(repo, relativePath), "utf8"));
  stylesheet.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    let parent = rule.parent;
    let ruleMedia = null;
    while (parent) {
      if (parent.type === "atrule" && parent.name === "media") ruleMedia = parent.params;
      parent = parent.parent;
    }
    if (ruleMedia !== media) return;
    rule.walkDecls((declaration) => { declarations[declaration.prop] = declaration.value; });
  });
  return declarations;
}

test("sponsorship hero follows homepage typography on desktop, tablet and mobile", () => {
  const sponsor = (media) => styleDeclarations("src/app/sponsor-a-child/sponsorship.css", ".sponsor-hero__title", media);
  const home = (media) => styleDeclarations("src/app/globals.css", ".documentary-home .doc-hero h1", media);
  for (const property of ["font-size", "font-weight", "line-height", "letter-spacing"]) {
    assert.equal(sponsor()[property], home()[property], property);
  }
  assert.equal(sponsor("(max-width: 1100px)")["font-size"], home("(max-width: 1100px)")["font-size"]);
  for (const property of ["font-size", "line-height"]) {
    assert.equal(sponsor("(max-width: 720px)")[property], home("(max-width: 720px)")[property]);
  }
  for (const media of ["(max-width: 800px)", "(max-width: 600px)"]) {
    assert.equal(sponsor(media)["font-size"], undefined, "layout breakpoints must not introduce larger heading sizes");
    assert.equal(sponsor(media)["letter-spacing"], undefined);
  }
});

test("sponsorship section and card sizes match the existing site without restoring heavy names", () => {
  for (const selector of [".sponsor-section__title", ".sponsor-final-panel h2"]) {
    for (const media of [null, "(max-width: 720px)"]) {
      const sponsor = styleDeclarations("src/app/sponsor-a-child/sponsorship.css", selector, media);
      const site = styleDeclarations("src/app/globals.css", ".doc-section-heading h2", media);
      for (const property of ["font-size", "font-weight", "line-height", "letter-spacing"]) {
        if (site[property] !== undefined) assert.equal(sponsor[property], site[property], `${selector}: ${property}`);
      }
    }
  }
  const card = styleDeclarations("src/app/sponsor-a-child/sponsorship.css", ".sponsor-card__title");
  const existingCard = styleDeclarations("src/app/globals.css", ".our-work-card h3");
  assert.equal(card["font-size"], existingCard["font-size"]);
  assert.equal(card["line-height"], existingCard["line-height"]);
  assert.equal(card["font-weight"], "600");
  assert.equal(card["letter-spacing"], "normal");
});

test("sponsorship links and buttons share typography above the inherited button reset", () => {
  // Two class selectors outrank `.sponsor-page button { font: inherit; }`.
  const button = styleDeclarations("src/app/sponsor-a-child/sponsorship.css", ".sponsor-page .sponsor-button");
  assert.equal(button["font-size"], "1rem");
  assert.equal(button["font-weight"], "600");
  assert.equal(button["line-height"], "1.5");
  assert.equal(button["letter-spacing"], styleDeclarations("src/app/globals.css", ".btn")["letter-spacing"]);
  assert.deepEqual(Object.keys(button).sort(), ["font-size", "font-weight", "letter-spacing", "line-height"], "stronger selector must not override button variants or reduced-motion preferences");
});

function loadSource(relativePath, overrides = {}) {
  const source = fs.readFileSync(path.join(repo, relativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => Object.hasOwn(overrides, id) ? overrides[id] : require(id), module, module.exports,
  );
  return module.exports;
}

const content = loadSource("src/lib/sponsorship/content.ts");
const Action = loadSource("src/components/ui/SponsorshipAction.tsx").default;

function fixture(run) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "annur-sponsorship-test-"));
  const previousCwd = process.cwd();
  const previousMode = process.env.NODE_ENV;
  try {
    fs.mkdirSync(path.join(temp, "content", "sponsorships"), { recursive: true });
    process.chdir(temp);
    process.env.NODE_ENV = "production";
    const write = (name, value) => fs.writeFileSync(path.join(temp, "content", "sponsorships", name), JSON.stringify(value));
    run({ temp, write });
  } finally {
    process.chdir(previousCwd);
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function profile(changes = {}) {
  return {
    slug: "test-profile", displayName: "Approved Alias", ageGroup: "8–10 years", programme: "Education", region: "Malawi",
    summary: "A public-safe summary.", story: "A public-safe narrative.\n\nA second paragraph.", aspiration: "To keep learning.",
    supportAreas: ["Learning materials"], image: "", imageAlt: "", publicationStatus: "published", publicationApproved: true,
    sponsorshipStatus: "available", featured: false, order: 100, paymentUrl: "", ...changes,
  };
}

test("empty collection stays empty in every environment", () => fixture(() => {
  for (const mode of [undefined, "development", "production", "test"]) {
    if (mode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = mode;
    assert.deepEqual(content.getSponsorshipProfiles(), [], `no fabricated profiles in ${mode ?? "an unset environment"}`);
    assert.equal(content.getSponsorshipProfileBySlug("test-profile"), null);
  }
}));

test("publication requires both explicit published status and literal boolean approval", () => fixture(({ write }) => {
  for (const changes of [
    { publicationStatus: "draft" }, { publicationStatus: undefined }, { publicationApproved: false },
    { publicationApproved: "true" }, { publicationApproved: undefined }, { isDemo: true },
  ]) {
    write("test-profile.json", profile(changes));
    assert.deepEqual(content.getSponsorshipProfiles(), []);
  }
  write("test-profile.json", profile());
  assert.equal(content.getSponsorshipProfiles().length, 1);
  assert.equal(Object.hasOwn(content.getSponsorshipProfiles()[0], "isDemo"), false);
}));

test("invalid content, identifiers and filenames fail closed", () => fixture(({ write, temp }) => {
  for (const changes of [
    { slug: "../case" }, { slug: "wrong-name" }, { ageGroup: "8 years old" }, { programme: "Unknown" },
    { sponsorshipStatus: "invalid" }, { story: "a".repeat(6001) }, { story: 123 }, { story: "Unsafe\u0000text" }, { supportAreas: [] },
    { image: "/uploads/photo.jpg", imageAlt: "" }, { image: "//example.com/child.jpg", imageAlt: "Photo" },
    { image: "/../private.jpg", imageAlt: "Photo" }, { image: "/%2e%2e/private.jpg", imageAlt: "Photo" },
  ]) {
    write("test-profile.json", profile(changes));
    assert.deepEqual(content.getSponsorshipProfiles(), []);
  }
  fs.writeFileSync(path.join(temp, "content", "sponsorships", "test-profile.json"), "invalid JSON");
  assert.deepEqual(content.getSponsorshipProfiles(), []);
  assert.equal(content.getSponsorshipProfileBySlug("../test-profile"), null);
}));

test("stored ASCII slug case normalizes only when the filename is already canonical", () => fixture(({ write, temp }) => {
  for (const slug of ["test-profile", "Test-Profile", "TEST-PROFILE", " Test-Profile "]) {
    write("test-profile.json", profile({ slug }));
    assert.deepEqual(content.getSponsorshipProfiles().map((value) => value.slug), ["test-profile"]);
    assert.equal(content.getSponsorshipProfileBySlug("test-profile").slug, "test-profile");
    assert.equal(content.getSponsorshipProfileBySlug("Test-Profile"), null, "lookups and generated URLs stay canonical");
  }

  // Remove our fixture before creating the other spelling so this works on
  // both case-sensitive and case-insensitive filesystems.
  fs.unlinkSync(path.join(temp, "content", "sponsorships", "test-profile.json"));
  write("Test-Profile.json", profile({ slug: "Test-Profile" }));
  assert.deepEqual(content.getSponsorshipProfiles(), [], "noncanonical filenames must not acquire a new URL");
  fs.unlinkSync(path.join(temp, "content", "sponsorships", "Test-Profile.json"));
  write("test-profile.json", profile({ slug: "Test-Profile" }));
  assert.equal(content.getSponsorshipProfiles().length, 1);
}));

test("slug normalization rejects traversal, malformed identifiers and Unicode lookalikes", () => fixture(({ write }) => {
  for (const slug of [
    "../test-profile", "test/profile", "test\\profile", "test%2fprofile", "test--profile",
    "-test-profile", "test-profile-", "test_profile", "test profile", "test-profile\u0000", "a".repeat(81),
  ]) {
    write("test-profile.json", profile({ slug }));
    assert.deepEqual(content.getSponsorshipProfiles(), [], slug);
    assert.equal(content.getSponsorshipProfileBySlug(slug), null);
  }
  write("test-k.json", profile({ slug: "Test-\u212a" }));
  assert.deepEqual(content.getSponsorshipProfiles(), [], "the Kelvin sign must not become an accepted ASCII k");
}));

test("one story drives the card summary regardless of legacy summary content", () => fixture(({ write }) => {
  const story = "  Approved interests and support needs.\r\n\r\nA second paragraph.  ";
  for (const summary of [undefined, null, "", "Stale legacy card copy.", "a".repeat(501), 123, "Unsafe\u0000legacy text"]) {
    write("test-profile.json", profile({ story, summary }));
    const [value] = content.getSponsorshipProfiles();
    assert.ok(value, "valid story must not require a separately valid legacy summary");
    assert.equal(value.story, story.trim());
    assert.equal(value.summary, "Approved interests and support needs. A second paragraph.");
  }
}));

test("legacy summary-only profiles work without concealing an invalid nonempty story", () => fixture(({ write }) => {
  for (const story of [undefined, null, "", " \t\r\n "]) {
    write("test-profile.json", profile({ story, summary: "  Approved legacy description.  " }));
    const [value] = content.getSponsorshipProfiles();
    assert.equal(value.story, "Approved legacy description.");
    assert.equal(value.summary, "Approved legacy description.");
  }
  for (const summary of [undefined, null, "", " \t\n", "a".repeat(501), 123, "Unsafe\u0000text"]) {
    write("test-profile.json", profile({ story: undefined, summary }));
    assert.deepEqual(content.getSponsorshipProfiles(), [], "fallback still requires a valid legacy description");
  }
  for (const story of ["a".repeat(6001), 123, {}, "Unsafe\u0000story"]) {
    write("test-profile.json", profile({ story, summary: "A valid legacy summary." }));
    assert.deepEqual(content.getSponsorshipProfiles(), [], "invalid nonempty story must not silently fall back");
  }
}));

test("derived card descriptions stay bounded, preserve words and keep Unicode intact", () => fixture(({ write }) => {
  const readSummary = (story) => {
    write("test-profile.json", profile({ story, summary: undefined }));
    const [value] = content.getSponsorshipProfiles();
    assert.ok(value);
    assert.ok(Array.from(value.summary).length <= 240, "summary length includes its ellipsis");
    return value.summary;
  };
  assert.equal(readSummary(" First paragraph.\r\n\r\nSecond\t paragraph. "), "First paragraph. Second paragraph.");
  assert.equal(readSummary("a".repeat(240)), "a".repeat(240), "exactly 240 characters need no ellipsis");
  assert.equal(readSummary("a".repeat(241)), `${"a".repeat(239)}…`, "long words remain bounded");
  const wholeWords = "Approved interests and learning materials ".repeat(12).trim();
  const wordsSummary = readSummary(wholeWords);
  assert.ok(wordsSummary.endsWith("…"));
  assert.ok(wholeWords.startsWith(`${wordsSummary.slice(0, -1)} `), "truncated prose ends at a complete word");
  const sparseSpaces = `Short ${"a".repeat(300)}`;
  assert.equal(readSummary(sparseSpaces), `${sparseSpaces.slice(0, 239)}…`, "an early space must not produce an unhelpfully short excerpt");
  assert.equal(readSummary("😀".repeat(240)), "😀".repeat(240));
  assert.equal(readSummary("😀".repeat(241)), `${"😀".repeat(239)}…`, "truncation must not split a surrogate pair");
}));

test("hopes and interests are optional while invalid nonempty text remains excluded", () => fixture(({ write }) => {
  for (const aspiration of [undefined, null, "", " \t\r\n "]) {
    write("test-profile.json", profile({ aspiration }));
    assert.equal(content.getSponsorshipProfiles()[0].aspiration, "");
  }
  write("test-profile.json", profile({ aspiration: "  Drawing and reading.  " }));
  assert.equal(content.getSponsorshipProfiles()[0].aspiration, "Drawing and reading.");
  for (const aspiration of [123, {}, "a".repeat(501), "Unsafe\u0000text"]) {
    write("test-profile.json", profile({ aspiration }));
    assert.deepEqual(content.getSponsorshipProfiles(), []);
  }
}));

test("reading normalized and summary-only profiles preserves the stored JSON", () => fixture(({ write, temp }) => {
  write("test-profile.json", profile({ slug: "Test-Profile", summary: "Legacy text retained on disk.", aspiration: undefined }));
  write("legacy-profile.json", profile({ slug: "Legacy-Profile", story: undefined, summary: "Older description.", aspiration: null }));
  const files = ["test-profile.json", "legacy-profile.json"].map((name) => path.join(temp, "content", "sponsorships", name));
  const original = files.map((file) => fs.readFileSync(file));
  assert.deepEqual(content.getSponsorshipProfiles().map((value) => value.slug), ["legacy-profile", "test-profile"]);
  assert.equal(content.getSponsorshipProfileBySlug("test-profile").summary, "A public-safe narrative. A second paragraph.");
  assert.equal(content.getSponsorshipProfileBySlug("legacy-profile").story, "Older description.");
  files.forEach((file, index) => assert.deepEqual(fs.readFileSync(file), original[index], "content reads must not migrate or rewrite JSON"));
}));

test("CMS photo filenames with spaces work; absent photo uses a safe placeholder", () => fixture(({ write }) => {
  write("test-profile.json", profile({ image: "/uploads/Approved Photo (1).jpeg", imageAlt: "Approved photograph" }));
  assert.equal(content.getSponsorshipProfiles()[0].image, "/uploads/Approved Photo (1).jpeg");
  write("test-profile.json", profile());
  assert.equal(content.getSponsorshipProfiles()[0].image, "");
}));

test("photo descriptions are required only when an approved image is selected", () => fixture(({ write }) => {
  for (const imageAlt of [undefined, null, "", " \t\r\n "]) {
    write("test-profile.json", profile({ image: "", imageAlt }));
    assert.equal(content.getSponsorshipProfiles()[0].imageAlt, "Photograph not displayed");
    write("test-profile.json", profile({ image: "/uploads/Approved Photo (1).jpeg", imageAlt }));
    assert.deepEqual(content.getSponsorshipProfiles(), [], "selected photo must not publish without a description");
  }
  for (const imageAlt of ["a".repeat(301), "Unsafe\u0000text", 123]) {
    write("test-profile.json", profile({ image: "/uploads/Approved Photo (1).jpeg", imageAlt }));
    assert.deepEqual(content.getSponsorshipProfiles(), []);
  }
  write("test-profile.json", profile({ image: "/uploads/Approved Photo (1).jpeg", imageAlt: "  Approved photograph.  " }));
  assert.equal(content.getSponsorshipProfiles()[0].imageAlt, "Approved photograph.");
}));

test("Bilal-shaped content still needs a photo description after slug normalization", () => fixture(({ write }) => {
  const bilal = {
    slug: "Bilal", displayName: "Bilal", ageGroup: "8–10 years", programme: "Education", region: "Malawi",
    summary: "Bilal enjoys reading, drawing and exploring new ideas and is very smart",
    story: "Bilal enjoys storybooks, drawing pictures and solving number puzzles. ",
    aspiration: "Learning new words and creating illustrated stories.", supportAreas: ["Learning materials"],
    image: "/uploads/Sponsor a child.webp", publicationStatus: "published", publicationApproved: true,
    sponsorshipStatus: "available", featured: false, order: 1,
  };
  write("bilal.json", bilal);
  assert.deepEqual(content.getSponsorshipProfiles(), []);
  write("bilal.json", { ...bilal, imageAlt: "An approved photograph of Bilal." });
  const [value] = content.getSponsorshipProfiles();
  assert.equal(value.slug, "bilal");
  assert.equal(value.summary, bilal.story.trim());
}));

test("payment links accept HTTPS only, without credentials or executable schemes", () => fixture(({ write }) => {
  for (const value of ["", "javascript:alert(1)", "data:text/html,test", "http://example.com/pay", "//example.com/pay", "https://user:secret@example.com/pay", "https://example.com/ pay"]) {
    write("test-profile.json", profile({ paymentUrl: value }));
    assert.equal(content.getSponsorshipProfiles()[0].paymentUrl, null);
  }
  write("test-profile.json", profile({ paymentUrl: "https://payments.example.com/sponsor?reference=public-alias" }));
  assert.equal(content.getSponsorshipProfiles()[0].paymentUrl, "https://payments.example.com/sponsor?reference=public-alias");
}));

test("settings image fallbacks retain their matching alt description", () => fixture(({ temp }) => {
  fs.writeFileSync(path.join(temp, "content", "sponsor-a-child.json"), JSON.stringify({ heroImage: "//invalid.example/photo.jpg", heroImageAlt: "Unrelated custom description" }));
  const settings = content.getSponsorshipSettings();
  assert.equal(settings.heroImage, "/editorial/education-story.png");
  assert.notEqual(settings.heroImageAlt, "Unrelated custom description");
}));

test("profile order is deterministic and featured profiles are presented first", () => fixture(({ write }) => {
  write("second.json", profile({ slug: "second", order: 1 }));
  write("first.json", profile({ slug: "first", featured: true, order: 20 }));
  assert.deepEqual(content.getSponsorshipProfiles().map((p) => p.slug), ["first", "second"]);
}));

test("external payment handoff requires a link and open status; missing links invite enquiries", () => fixture(() => {
  const settings = { ...content.getSponsorshipSettings(), paymentUrl: "https://payments.example.com/global" };
  const p = { ...profile(), paymentUrl: null };
  const render = (value, config = settings) => renderToStaticMarkup(React.createElement(Action, { profile: value, settings: config }));
  assert.match(render(p), /href="https:\/\/payments\.example\.com\/global"/);
  assert.match(render(p), /rel="noopener noreferrer"/);
  assert.match(render({ ...p, paymentUrl: "https://payments.example.com/specific" }), /href="https:\/\/payments\.example\.com\/specific"/);
  for (const value of [{ ...p, sponsorshipStatus: "supported" }, { ...p, sponsorshipStatus: "paused" }]) {
    const html = render(value);
    assert.doesNotMatch(html, /href="https:\/\/payments/);
    assert.match(html, /disabled=""/);
    assert.match(html, /Not open for sponsorship/);
  }
  for (const value of [p, undefined]) {
    const unconfigured = render(value, { ...settings, paymentUrl: null });
    assert.match(unconfigured, /Enquire about sponsorship/);
    assert.match(unconfigured, /<a class="sponsor-button sponsor-button--primary" href="mailto:info@annurmw\.com\?subject=/);
    assert.doesNotMatch(unconfigured, /href="https:\/\/payments/);
    assert.doesNotMatch(unconfigured, /disabled=|preview|fictional|coming soon/i);
  }
}));

test("profile detail renders the full story once and shows hopes only when supplied", async () => {
  const story = "The approved child enjoys reading and drawing during learning sessions.";
  const summary = "Separate card excerpt that should not appear on the detail page.";
  let currentProfile = profile({ story, summary, aspiration: "", paymentUrl: null });
  const page = loadSource("src/app/sponsor-a-child/[slug]/page.tsx", {
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "next/navigation": { notFound: () => { throw new Error("Unexpected missing profile"); } },
    "@/components/layout/SiteHeader": { __esModule: true, default: () => null },
    "@/components/layout/SiteFooter": { __esModule: true, default: () => null },
    "@/components/ui/Icon": { __esModule: true, default: () => null },
    "@/components/ui/SponsorshipAction": { __esModule: true, default: () => null },
    "@/components/sections/SponsorshipBrowser": { SponsorshipPortrait: () => null },
    "@/lib/sponsorship/content": {
      getSponsorshipProfiles: () => [currentProfile],
      getSponsorshipProfileBySlug: (slug) => slug === currentProfile.slug ? currentProfile : null,
      getSponsorshipSettings: () => ({ paymentUrl: null, paymentNote: "" }),
    },
    "@/lib/site-data": { site: { url: "https://annurmw.com" } },
  });
  const render = async () => renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: currentProfile.slug }) }));
  const withoutHopes = await render();
  assert.equal(withoutHopes.split(story).length - 1, 1, "the unified description must appear once");
  assert.ok(!withoutHopes.includes(summary), "the card excerpt must not duplicate the detail narrative");
  assert.doesNotMatch(withoutHopes, /Looking ahead|sponsor-aspiration|sponsor-hero__lead/);

  currentProfile = { ...currentProfile, aspiration: "Learning to illustrate stories." };
  const withHopes = await render();
  assert.equal(withHopes.split(story).length - 1, 1);
  assert.ok(!withHopes.includes(summary));
  assert.match(withHopes, /<h2>Looking ahead<\/h2><p>Learning to illustrate stories\.<\/p>/);
});

const browserProfiles = [
  profile({ slug: "test-profile-one", displayName: "Test Profile One", programme: "Education", ageGroup: "8–10 years" }),
  profile({ slug: "test-profile-two", displayName: "Test Profile Two", programme: "Education & care", ageGroup: "11–13 years" }),
  profile({ slug: "test-profile-three", displayName: "Test Profile Three", programme: "Care & wellbeing", ageGroup: "5–7 years" }),
];

function renderBrowser(profiles, query = "", programme = "all", age = "all") {
  const values = [query, programme, age];
  let index = 0;
  const Browser = loadSource("src/components/sections/SponsorshipBrowser.tsx", {
    react: { ...React, useState: () => [values[index++], () => {}], useDeferredValue: (value) => value, useMemo: (fn) => fn() },
    "next/image": { __esModule: true, default: () => null },
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "@/components/ui/Icon": { __esModule: true, default: () => null },
  }).default;
  return renderToStaticMarkup(React.createElement(Browser, { profiles }));
}

test("profile browser combines search, programme and age filters without leaking nonmatches", () => {
  const renderFilters = (query, programme, age) => renderBrowser(browserProfiles, query, programme, age);
  const unfiltered = renderFilters("", "all", "all");
  assert.match(unfiltered, /3 profiles to explore/);
  assert.doesNotMatch(unfiltered, /preview|fictional|sample profile/i);
  const combined = renderFilters(" PROFILE ONE ", "Education", "8–10 years");
  assert.match(combined, /1 profile to explore/);
  assert.match(combined, /Meet Test Profile One/);
  assert.doesNotMatch(combined, /Meet Test Profile Two|Meet Test Profile Three/);
  assert.match(renderFilters("Profile One", "Care & wellbeing", "all"), /No profiles match just yet/);
  assert.match(renderFilters("", "all", "5–7 years"), /Meet Test Profile Three/);
  assert.doesNotMatch(renderFilters("", "all", "5–7 years"), /Meet Test Profile One/);
});

test("empty collection displays current contact guidance without preview content", () => {
  const html = renderBrowser([]);
  assert.match(html, /Contact An Nur to discuss current child sponsorship options and how you can help\./);
  assert.match(html, /mailto:info@annurmw.com/);
  assert.doesNotMatch(html, /sponsor-card|preview|fictional|first approved|coming soon/i);
});
