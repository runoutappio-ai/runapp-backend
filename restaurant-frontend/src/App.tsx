import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  BadgePercent,
  Check,
  CheckCircle2,
  ChefHat,
  CircleAlert,
  Gauge,
  Loader2,
  LogOut,
  Plus,
  Save,
  Store,
  Trash2,
  UtensilsCrossed
} from "lucide-react";
import { ApiConfig, apiRequest } from "./api";
import { filledDemoRestaurant } from "./demo-fixture";
import { MenuItem, MenuSection, Restaurant, RestaurantMenu, TokenResponse } from "./types";

type Page = "overview" | "details" | "menus";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? "";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "";
const TOKEN_KEY = "runout.restaurant.token";
const MENU_SECTIONS: { id: MenuSection; label: string; helper: string }[] = [
  { id: "STARTERS", label: "Starters", helper: "Small plates and dishes to begin" },
  { id: "MAINS", label: "Mains", helper: "The centre of the experience" },
  { id: "DESSERTS", label: "Desserts", helper: "Something sweet to finish" },
  { id: "DRINKS", label: "Drinks · per person", helper: "Specify the drinks and quantities included per person" }
];
const CATEGORIES = [
  "Middle Eastern", "Emirati", "Mediterranean", "Italian", "French", "Japanese",
  "Chinese", "Korean", "Indian", "Thai", "Mexican", "American", "Steakhouse",
  "Seafood", "Greek", "Vegan", "Café", "Bakery"
];
const PRICE_RANGES = [50, 100, 150, 200, 250, 300, 350, 400].map((amount, index) => ({
  value: index + 1, label: `AED ${amount}`, note: "per guest"
}));

type RestaurantForm = {
  name: string;
  phone: string;
  description: string;
  openingHours: string;
  formattedAddress: string;
  parkingInstructions: string;
  area: string;
  websiteUri: string;
  priceTier: number;
  categories: string[];
};

export function App() {
  const [fillingDemo, setFillingDemo] = useState(false);
  const [fillVersion, setFillVersion] = useState(0);
  const [demoMessage, setDemoMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [config, setConfig] = useState<ApiConfig>({ baseUrl: API_URL, token: localStorage.getItem(TOKEN_KEY) ?? "" });
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [page, setPage] = useState<Page>("overview");
  const [loading, setLoading] = useState(Boolean(config.token));
  const [error, setError] = useState("");

  useEffect(() => {
    const unauthorized = () => logout(false);
    window.addEventListener("runout:restaurant-unauthorized", unauthorized);
    return () => window.removeEventListener("runout:restaurant-unauthorized", unauthorized);
  }, []);

  useEffect(() => {
    if (!config.token) return;
    localStorage.setItem(TOKEN_KEY, config.token);
    void loadRestaurant(config);
  }, [config.token]);

  async function loadRestaurant(nextConfig = config) {
    setLoading(true);
    setError("");
    try {
      const role = roleFromToken(nextConfig.token);
      if (role !== "RESTAURANT") throw new Error("This account does not have restaurant portal access.");
      setRestaurant(await apiRequest<Restaurant>(nextConfig, "/api/restaurant-portal/me"));
    } catch (cause) {
      setRestaurant(null);
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }

  async function cancelSubmission() {
    if (cancelling) return;
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await apiRequest<Restaurant>(config, "/api/restaurant-portal/me/menus/cancel-submission", { method: "POST" });
      setRestaurant(updated);
    } catch (cause) { setCancelError(messageOf(cause)); }
    finally { setCancelling(false); }
  }

  async function fillDemo() {
    if (!DEMO_EMAIL || !DEMO_PASSWORD || fillingDemo || restaurant?.menuStatus === "PENDING_APPROVAL") return;
    setFillingDemo(true);
    setDemoMessage("");
    try {
      const updated = await apiRequest<Restaurant>(config, "/api/restaurant-portal/me", {
        method: "PATCH", body: JSON.stringify(filledDemoRestaurant())
      });
      setRestaurant(updated);
      setFillVersion(version => version + 1);
      setPage("menus");
      setDemoMessage("All restaurant details and five menus filled. Review them, then submit for approval when ready.");
    } catch (cause) { setDemoMessage(messageOf(cause)); }
    finally { setFillingDemo(false); }
  }

  function logout(callApi = true) {
    if (callApi && config.token) void apiRequest<void>(config, "/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    setConfig({ baseUrl: API_URL, token: "" });
    setRestaurant(null);
    setError("");
    setPage("overview");
  }

  if (!config.token) return <LoginScreen onLogin={(token) => setConfig({ baseUrl: API_URL, token })} />;

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <div className="sidebarTop">
          <div className="brandMark">R</div>
          <div><div className="brand">Run Out</div><div className="muted">Restaurant portal</div></div>
        </div>
        <nav className="sideNav" aria-label="Restaurant navigation">
          <NavButton active={page === "overview"} icon={<Gauge size={18} />} label="Overview" onClick={() => setPage("overview")} />
          <NavButton active={page === "details"} icon={<Store size={18} />} label="Restaurant details" onClick={() => setPage("details")} />
          <NavButton active={page === "menus"} icon={<ChefHat size={18} />} label="Menus" onClick={() => setPage("menus")} />
        </nav>
        <div className="sidebarUser">
          <div className="avatar">{restaurant?.name.charAt(0).toUpperCase() ?? "R"}</div>
          <div className="sidebarUserCopy">
            <div className="userName">{restaurant?.name ?? "Restaurant account"}</div>
            <div className="muted">{restaurant?.area ?? "Run Out partner"}</div>
            <div className="sidebarRole">Restaurant</div>
          </div>
        </div>
      </aside>

      <section className="adminContent">
        <header className="topbar">
          <div>
            <div className="eyebrow">Run Out Partners</div>
            <h1>{pageTitle(page)}</h1>
          </div>
          <button className="secondary" onClick={() => logout()}><LogOut size={17} /> Sign out</button>
        </header>

        {loading && <StatePanel icon={<Loader2 className="spin" />} title="Loading your restaurant" text="Retrieving the latest profile and menus." />}
        {!loading && error && <StatePanel icon={<CircleAlert />} title="Portal unavailable" text={error} action={<button onClick={() => void loadRestaurant()}>Try again</button>} />}
        {!loading && restaurant && DEMO_EMAIL && DEMO_PASSWORD && <div className="reviewLockNotice">
          <p>Demo tools: fill restaurant details and all five menus with example data. This replaces the current draft.</p>
          <button type="button" className="secondary" disabled={fillingDemo || cancelling || restaurant.menuStatus === "PENDING_APPROVAL"} onClick={() => void fillDemo()}>{fillingDemo ? "Filling…" : "Fill everything automatically"}</button>
          {restaurant.menuStatus === "PENDING_APPROVAL" && <p>Cancel the pending submission first to enable autofill.</p>}
          {demoMessage && <p role="status">{demoMessage}</p>}
        </div>}
        {!loading && restaurant?.menuStatus === "PENDING_APPROVAL" && <div className="reviewLockNotice">
          <p>Your submission is pending approval. Cancel it to unlock editing; your menus will be kept.</p>
          <button type="button" className="secondary" disabled={cancelling} onClick={() => void cancelSubmission()}>{cancelling ? "Cancelling…" : "Cancel submission & edit"}</button>
          {cancelError && <p className="error" role="alert">{cancelError}</p>}
        </div>}
        {!loading && restaurant && page === "overview" && <Overview restaurant={restaurant} onNavigate={setPage} />}
        {!loading && restaurant && page === "details" && <Details key={fillVersion} restaurant={restaurant} config={config} onSaved={setRestaurant} />}
        {!loading && restaurant && page === "menus" && <Menus key={fillVersion} restaurant={restaurant} config={config} onSaved={setRestaurant} />}
      </section>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const tokens = await apiRequest<TokenResponse>({ baseUrl: API_URL, token: "" }, "/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (roleFromToken(tokens.accessToken) !== "RESTAURANT") throw new Error("Use the restaurant account provided by Run Out.");
      onLogin(tokens.accessToken);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginPanel">
        <div className="brandRow">
          <div className="brandMark">R</div>
          <div><div className="brand">Run Out</div><div className="muted">Restaurant partner portal</div></div>
        </div>
        <div><h1>Welcome back</h1><p className="muted">Manage your restaurant details and the five menus offered to Run Out guests.</p></div>
        <form className="form" onSubmit={submit}>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <div className="error">{error}</div>}
          <button disabled={loading}>{loading ? <Loader2 className="spin" size={17} /> : <Store size={17} />} Sign in</button>
        </form>
        {DEMO_EMAIL && DEMO_PASSWORD && <div className="demoAccess">
          <div><strong>Demo access</strong><span>{DEMO_EMAIL}</span><span>{DEMO_PASSWORD}</span></div>
          <button type="button" className="secondary" onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); }}>Use demo login</button>
        </div>}
        <div className="loginHelp"><strong>Need access?</strong><span>Your Run Out contact creates one secure account for your restaurant.</span></div>
      </section>
    </main>
  );
}

function Overview({ restaurant, onNavigate }: { restaurant: Restaurant; onNavigate: (page: Page) => void }) {
  const menus = normalizeMenus(restaurant.pendingMenus?.length ? restaurant.pendingMenus : restaurant.menus);
  const completeMenus = menus.filter(menuComplete).length;
  const profileComplete = Boolean(restaurant.name && restaurant.area && restaurant.priceTier && restaurant.categories.length);
  return (
    <div className="pageGrid">
      <section className="welcomeCard">
        <div>
          <div className="statusLine"><span className={restaurant.active ? "status active" : "status"}>{restaurant.active ? "Active partner" : "Currently inactive"}</span></div>
          <h2>{restaurant.name}</h2>
          <p>Keep your information and menus current. Run Out operations sees every saved change immediately.</p>
        </div>
        <div className="restaurantGlyph"><UtensilsCrossed size={34} /></div>
      </section>
      <section className="metricGrid">
        <Metric icon={<Store />} label="Restaurant profile" value={profileComplete ? "Ready" : "Needs attention"} tone={profileComplete ? "good" : "warn"} />
        <Metric icon={<ChefHat />} label="Menus complete" value={`${completeMenus} / 5`} tone={completeMenus === 5 ? "good" : "warn"} />
        <Metric icon={<BadgePercent />} label="Average discount" value={`${Math.round(menus.reduce((sum, menu) => sum + menu.discountPercentage, 0) / 5)}%`} />
      </section>
      <section className="panel checklistPanel">
        <div className="panelHeader"><div><h2>Setup checklist</h2><p>Everything required before Run Out can confidently route guests.</p></div></div>
        <ChecklistRow done={profileComplete} title="Restaurant details" text="One price range and at least one category are required." action="Review details" onClick={() => onNavigate("details")} />
        <ChecklistRow done={completeMenus === 5} title="Five table-size menus" text="Create one menu each for 2, 3, 4, 5 and 6 guests." action="Edit menus" onClick={() => onNavigate("menus")} />
      </section>
    </div>
  );
}

function Details({ restaurant, config, onSaved }: { restaurant: Restaurant; config: ApiConfig; onSaved: (restaurant: Restaurant) => void }) {
  const pending = restaurant.menuStatus === "PENDING_APPROVAL";
  const [form, setForm] = useState<RestaurantForm>(() => toForm(restaurant));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toggleCategory(category: string) {
    setForm(current => ({ ...current, categories: current.categories.includes(category) ? current.categories.filter(item => item !== category) : [...current.categories, category] }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setMessage(""); setError("");
    if (!form.categories.length) { setError("Choose at least one category."); return; }
    setSaving(true);
    try {
      const updated = await apiRequest<Restaurant>(config, "/api/restaurant-portal/me", { method: "PATCH", body: JSON.stringify(form) });
      onSaved(updated); setForm(toForm(updated)); setMessage("Restaurant details saved.");
    } catch (cause) { setError(messageOf(cause)); }
    finally { setSaving(false); }
  }

  return (
    <form className="panel editPanel" onSubmit={save}>
      <div className="panelHeader"><div><h2>Restaurant details</h2><p>These details are shared with Run Out operations and used when preparing reservations.</p></div><span className={restaurant.active ? "status active" : "status"}>{restaurant.active ? "Active" : "Inactive"}</span></div>
      {pending && <p className="reviewLockNotice" role="status">Your submission is awaiting management approval. Restaurant details and menus are read-only until it is approved or rejected.</p>}
      <fieldset className="portalFields" disabled={pending || saving} aria-label="Restaurant details">
      <div className="formGrid">
        <label>Restaurant name<input value={form.name} maxLength={160} onChange={event => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Phone<input value={form.phone} maxLength={40} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
        <label>Area<input value={form.area} maxLength={80} onChange={event => setForm({ ...form, area: event.target.value })} required /></label>
        <label>Opening hours<input value={form.openingHours} maxLength={200} placeholder="Daily, 12:00–23:30" onChange={event => setForm({ ...form, openingHours: event.target.value })} /></label>
        <label className="spanTwo">Full address<textarea value={form.formattedAddress} maxLength={500} onChange={event => setForm({ ...form, formattedAddress: event.target.value })} /></label>
        <label className="spanTwo">How to park<textarea value={form.parkingInstructions} maxLength={1000} placeholder="Explain where guests can park, the entrance to use, valet options, costs and any validation." onChange={event => setForm({ ...form, parkingInstructions: event.target.value })} required /></label>
        <label className="spanTwo">Description<textarea value={form.description} maxLength={500} placeholder="What makes your restaurant special?" onChange={event => setForm({ ...form, description: event.target.value })} /></label>
        <label className="spanTwo">Website<input type="url" value={form.websiteUri} maxLength={500} placeholder="https://" onChange={event => setForm({ ...form, websiteUri: event.target.value })} /></label>
      </div>


      <div className="choiceBlock">
        <div className="fieldHeading"><div><h3>Restaurant categories</h3><p>Select one or as many categories as fit your food.</p></div><span>{form.categories.length} selected</span></div>
        <div className="chipGrid">{CATEGORIES.map(category => <button key={category} type="button" className={form.categories.includes(category) ? "chip selected" : "chip"} onClick={() => toggleCategory(category)}>{form.categories.includes(category) && <Check size={14} />}{category}</button>)}</div>
      </div>

      {error && <div className="error">{error}</div>}{message && <div className="success"><CheckCircle2 size={17} />{message}</div>}
      <div className="stickyActions"><span className="muted">Changes are visible in the Run Out backoffice after saving.</span><button disabled={saving}>{saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />} Save details</button></div>
      </fieldset>
    </form>
  );
}

function Menus({ restaurant, config, onSaved }: { restaurant: Restaurant; config: ApiConfig; onSaved: (restaurant: Restaurant) => void }) {
  const [menus, setMenus] = useState(() => normalizeMenus(restaurant.pendingMenus?.length ? restaurant.pendingMenus : restaurant.menus));
  const [priceTier, setPriceTier] = useState(restaurant.priceTier ?? 0);
  const pending = restaurant.menuStatus === "PENDING_APPROVAL";
  const profileChecks = [
    { label: "Restaurant name", done: Boolean(restaurant.name?.trim()) },
    { label: "Contact phone", done: Boolean(restaurant.phone?.trim()) },
    { label: "Full address", done: Boolean(restaurant.formattedAddress?.trim()) },
    { label: "Area", done: Boolean(restaurant.area?.trim()) },
    { label: "Opening hours", done: Boolean(restaurant.openingHours?.trim()) },
    { label: "Parking instructions", done: Boolean(restaurant.parkingInstructions?.trim()) },
    { label: "At least one category", done: restaurant.categories.length > 0 }
  ];
  const profileReady = profileChecks.every(check => check.done);
  const priceReady = PRICE_RANGES.some(range => range.value === priceTier);
  const [partySize, setPartySize] = useState(2);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const current = menus.find(menu => menu.partySize === partySize)!;
  const complete = menus.filter(menuComplete).length;
  const requirements = [
    ...profileChecks,
    { label: "Select one price per person", done: priceReady },
    ...menus.flatMap(menu => menuRequirements(menu))
  ];
  const remaining = requirements.filter(check => !check.done).length;
  const canSubmit = remaining === 0 && !pending && !saving;

  function patchMenu(patch: Partial<RestaurantMenu>) {
    if (pending || saving) return;
    setMenus(items => items.map(menu => {
      if (menu.partySize !== partySize) return menu;
      const updated = { ...menu, ...patch };
      updated.discountPercentage = updated.priceBeforePerPerson > 0 ? Math.round((1 - updated.priceAfterPerPerson / updated.priceBeforePerPerson) * 100) : 0;
      return updated;
    }));
  }
  function patchItems(section: MenuSection, items: MenuItem[]) {
    patchMenu({ sections: { ...current.sections, [section]: items } });
  }
  function addItem(section: MenuSection) { patchItems(section, [...current.sections[section], { name: "", description: "" }]); }
  function updateItem(section: MenuSection, index: number, patch: Partial<MenuItem>) { patchItems(section, current.sections[section].map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
  function removeItem(section: MenuSection, index: number) { patchItems(section, current.sections[section].filter((_, itemIndex) => itemIndex !== index)); }

  async function save() {
    setMessage(""); setError("");
    if (!canSubmit) { setError("Complete every checklist requirement before submitting."); return; }
    const invalid = menus.find(menu => !menuComplete(menu));
    if (!profileReady) { setError("Complete and save restaurant details, contact, opening hours, address, parking and categories first."); return; }
    const invalidPrice = menus.find(menu => menu.priceBeforePerPerson <= 0 || menu.priceAfterPerPerson < 0 || menu.priceAfterPerPerson > menu.priceBeforePerPerson);
    if (invalidPrice) { setPartySize(invalidPrice.partySize); setError("Enter a valid original price and a discounted price no higher than the original."); return; }
    if (invalid) { setPartySize(invalid.partySize); setError(`Complete starters, mains, desserts and drinks for ${invalid.partySize} guests.`); return; }
    setSaving(true);
    try {
      const payload = { priceTier, menus: menus.map(menu => ({ ...menu, sections: Object.fromEntries(Object.entries(menu.sections).map(([key, items]) => [key, items.map(item => ({ name: item.name.trim(), description: item.description.trim() || null }))])) })) };
      const updated = await apiRequest<Restaurant>(config, "/api/restaurant-portal/me/menus", { method: "PUT", body: JSON.stringify(payload) });
      setMenus(normalizeMenus(updated.pendingMenus)); onSaved(updated); setMessage("All five menus submitted for management approval.");
    } catch (cause) { setError(messageOf(cause)); }
    finally { setSaving(false); }
  }

  return (
    <section className="panel menuPanel">
      <div className="panelHeader"><div><h2>Menus by table size</h2><p>Create exactly five offers: one each for 2, 3, 4, 5 and 6 guests.</p></div><div className="completionBadge"><ChefHat size={17} /> {complete} / 5 ready</div></div>
      <section className="submissionChecklist" aria-labelledby="submission-checklist-title">
        <div className="fieldHeading">
          <div><h3 id="submission-checklist-title">Before you submit</h3><p>Complete the saved restaurant details and each table-size menu. Descriptions are optional. Drinks must specify what is included per person.</p></div>
          <span role="status" aria-live="polite">{remaining === 0 ? "Ready to submit" : `${remaining} requirements remaining`}</span>
        </div>
        <div className="requirementsGrid">
          <div className="requirementsCard">
            <h4>Restaurant setup</h4>
            <ul>{[...profileChecks, { label: "Select one price per person below", done: priceReady }].map(check => <Requirement key={check.label} {...check} />)}</ul>
            {!profileReady && <p>Open Restaurant details, fill the missing fields and save.</p>}
          </div>
          {menus.map(menu => <div className={`requirementsCard ${menu.partySize === partySize ? "current" : ""}`} key={menu.partySize}>
            <button type="button" className="secondary" onClick={() => setPartySize(menu.partySize)}>Table for {menu.partySize} · {menuComplete(menu) ? "Complete" : "To complete"}</button>
            <ul>{menuRequirements(menu).map(check => <Requirement key={check.label} {...check} />)}</ul>
          </div>)}
        </div>
      </section>
      <div className="choiceBlock">
        <div className="fieldHeading"><div><h3>Price per person</h3><p>Select one budget for your menus.</p></div><span>{(restaurant.menuStatus ?? "DRAFT").replaceAll("_", " ")}</span></div>
        <div className="priceGrid">{PRICE_RANGES.map(range => <button disabled={pending} key={range.value} type="button" className={`choiceCard ${priceTier === range.value ? "selected" : ""}`} onClick={() => setPriceTier(range.value)}><strong>{range.label}</strong><span>{range.note}</span>{priceTier === range.value && <Check size={16} />}</button>)}</div>
        {!profileReady && <p className="error">Complete and save all required restaurant details before submitting.</p>}
        {pending && <p className="success">Pending management approval. These menus are not published yet.</p>}
      </div>
      <div className="menuTabs" role="tablist">{menus.map(menu => <button type="button" role="tab" aria-selected={menu.partySize === partySize} className={menu.partySize === partySize ? "active" : ""} onClick={() => { setPartySize(menu.partySize); setError(""); }} key={menu.partySize}><span>Table for</span><strong>{menu.partySize}</strong>{menuComplete(menu) && <CheckCircle2 size={15} />}</button>)}</div>

      <fieldset className="portalFields" disabled={pending || saving} aria-label="Menu prices">
      <div className="menuIntro">
        <div className="menuPricing">
          <label>Estimated bill for {partySize} guests · AED<input type="number" min="0.01" step="0.01" value={Number((current.priceBeforePerPerson * partySize).toFixed(2))} onChange={event => patchMenu({ priceBeforePerPerson: Number(event.target.value) / partySize })} /></label>
          <label>After discount · total AED for {partySize} guests<input type="number" min="0" step="0.01" max={Number((current.priceBeforePerPerson * partySize).toFixed(2))} value={Number((current.priceAfterPerPerson * partySize).toFixed(2))} onChange={event => patchMenu({ priceAfterPerPerson: Number(event.target.value) / partySize })} /></label>
          <div className="success">Total savings for {partySize} guests: AED {((current.priceBeforePerPerson - current.priceAfterPerPerson) * partySize).toFixed(2)}</div>
          <small>Before: AED {current.priceBeforePerPerson.toFixed(2)} per person.<br />After: <strong>AED {current.priceAfterPerPerson.toFixed(2)} per person.</strong></small>
        </div>
        <div className="budgetSummary">
          <strong>Selected budget: AED {priceTier * 50} per person</strong>
          <span>{partySize} guests × AED {priceTier * 50} = AED {partySize * priceTier * 50} for the table.</span>
          <span>{Math.abs(current.priceAfterPerPerson - priceTier * 50) < 0.005
            ? "The discounted bill matches the selected budget."
            : `The discounted bill is AED ${Math.abs((current.priceAfterPerPerson - priceTier * 50) * partySize).toFixed(2)} ${current.priceAfterPerPerson > priceTier * 50 ? "above" : "below"} this table budget.`}</span>
        </div>
      </div>

      <div className="sectionsGrid">{MENU_SECTIONS.map(section => <MenuSectionEditor key={section.id} section={section} items={current.sections[section.id]} onAdd={() => addItem(section.id)} onUpdate={(index, patch) => updateItem(section.id, index, patch)} onRemove={index => removeItem(section.id, index)} />)}</div>
      </fieldset>

      {error && <div className="error">{error}</div>}{message && <div className="success"><CheckCircle2 size={17} />{message}</div>}
      <div className="stickyActions"><span className="muted">{pending ? "Submitted. Awaiting management approval." : remaining ? `Complete ${remaining} remaining requirements to submit.` : "Everything is complete. Submit all five menus for management approval."}</span><button type="button" disabled={!canSubmit} onClick={() => void save()}>{saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />} Submit for approval</button></div>
    </section>
  );
}

function MenuSectionEditor({ section, items, onAdd, onUpdate, onRemove }: { section: typeof MENU_SECTIONS[number]; items: MenuItem[]; onAdd: () => void; onUpdate: (index: number, patch: Partial<MenuItem>) => void; onRemove: (index: number) => void }) {
  return <article className="menuSection"><div className="menuSectionHead"><div><h4>{section.label}</h4><p>{section.helper}</p></div><button type="button" className="secondary iconText" onClick={onAdd}><Plus size={15} /> Add</button></div><div className="dishList">{items.map((item, index) => <div className="dishRow" key={index}><span className="dishNumber">{index + 1}</span><div className="dishFields"><input aria-label={`${section.label} item ${index + 1}`} value={item.name} maxLength={120} placeholder="Dish name" onChange={event => onUpdate(index, { name: event.target.value })} /><input aria-label={`${section.label} item ${index + 1} description`} value={item.description} maxLength={500} placeholder="Short description (optional)" onChange={event => onUpdate(index, { description: event.target.value })} /></div><button type="button" className="removeButton" aria-label={`Remove ${item.name || "item"}`} onClick={() => onRemove(index)}><Trash2 size={16} /></button></div>)}{items.length === 0 && <button type="button" className="emptySection" onClick={onAdd}><Plus size={18} /><span>Add the first {section.label.toLowerCase()} item</span></button>}</div></article>;
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) { return <button className={active ? "active" : ""} onClick={onClick}>{icon}{label}</button>; }
function StatePanel({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) { return <section className="panel statePanel"><div className="stateIcon">{icon}</div><h2>{title}</h2><p>{text}</p>{action}</section>; }
function Metric({ icon, label, value, tone = "" }: { icon: ReactNode; label: string; value: string; tone?: string }) { return <div className={`metric ${tone}`}><div className="metricIcon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function ChecklistRow({ done, title, text, action, onClick }: { done: boolean; title: string; text: string; action: string; onClick: () => void }) { return <div className="checklistRow"><div className={done ? "checkIcon done" : "checkIcon"}>{done ? <Check size={17} /> : <CircleAlert size={17} />}</div><div><strong>{title}</strong><p>{text}</p></div><button type="button" className="secondary" onClick={onClick}>{action}</button></div>; }
function pageTitle(page: Page) { return ({ overview: "Overview", details: "Restaurant details", menus: "Menus" })[page]; }
function messageOf(cause: unknown) { return cause instanceof Error ? cause.message : "Something went wrong. Please try again."; }

function roleFromToken(token: string): string | undefined {
  try {
    const encoded = token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="))) as { realm_access?: { roles?: string[] } };
    return payload.realm_access?.roles?.find(role => ["RESTAURANT", "SUPER_ADMIN", "MANAGER", "WORKER", "USER"].includes(role));
  } catch { return undefined; }
}

function toForm(restaurant: Restaurant): RestaurantForm {
  return {
    name: restaurant.name, phone: restaurant.phone ?? "", description: restaurant.description ?? "",
    openingHours: restaurant.openingHours ?? "", formattedAddress: restaurant.formattedAddress ?? "",
    parkingInstructions: restaurant.parkingInstructions ?? "",
    area: restaurant.area ?? "", websiteUri: restaurant.websiteUri ?? "", priceTier: restaurant.priceTier ?? 1,
    categories: restaurant.categories?.length ? restaurant.categories : restaurant.cuisine ? [restaurant.cuisine] : []
  };
}

function emptySections(): Record<MenuSection, MenuItem[]> { return { STARTERS: [], MAINS: [], DESSERTS: [], DRINKS: [] }; }
function normalizeMenus(input: RestaurantMenu[] | null | undefined): RestaurantMenu[] {
  return [2, 3, 4, 5, 6].map(size => {
    const found = input?.find(menu => menu.partySize === size);
    const sections = emptySections();
    if (found?.sections) for (const section of MENU_SECTIONS) sections[section.id] = found.sections[section.id] ?? [];
    return { id: found?.id ?? size, partySize: size, discountPercentage: found?.discountPercentage ?? 0, priceBeforePerPerson: found?.priceBeforePerPerson ?? 0, priceAfterPerPerson: found?.priceAfterPerPerson ?? 0, sections };
  });
}
function menuRequirements(menu: RestaurantMenu) {
  return [
    { label: "Estimated total before discount", done: Number.isFinite(menu.priceBeforePerPerson) && menu.priceBeforePerPerson > 0 },
    { label: "Valid total after discount (no higher than original)", done: Number.isFinite(menu.priceAfterPerPerson) && menu.priceBeforePerPerson > 0 && menu.priceAfterPerPerson >= 0 && menu.priceAfterPerPerson <= menu.priceBeforePerPerson },
    ...MENU_SECTIONS.map(section => ({ label: `${section.label}: at least one item, all names filled`, done: menu.sections[section.id].length > 0 && menu.sections[section.id].every(item => Boolean(item.name.trim())) }))
  ];
}
function menuComplete(menu: RestaurantMenu) { return menuRequirements(menu).every(check => check.done); }
function Requirement({ label, done }: { label: string; done: boolean }) {
  return <li className={done ? "done" : ""}>{done ? <CheckCircle2 size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}<span><span className="requirementState">{done ? "Complete: " : "Missing: "}</span>{label}</span></li>;
}
