import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  List,
  Loader2,
  LogOut,
  MapPin,
  Play,
  RefreshCcw,
  Search,
  Store,
  UserPlus,
  UserRound,
  X,
  XCircle
} from "lucide-react";
import { ApiConfig, ApiError, apiRequest } from "./api";
import { City, GooglePlaceCandidate, NearbyRestaurant, Reservation, Restaurant, RestaurantMenu, TokenResponse, UserRole, UserSummary } from "./types";

type Section = "dashboard" | "users" | "reservations" | "restaurants";

const initialConfig: ApiConfig = {
  baseUrl: "http://localhost:8080",
  token: localStorage.getItem("runout.admin.token") ?? ""
};

export function App() {
  const [config, setConfig] = useState(initialConfig);
  const [section, setSection] = useState<Section>("dashboard");
  const [sectionHistory, setSectionHistory] = useState<Section[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [currentUserError, setCurrentUserError] = useState("");
  const authenticated = Boolean(config.token);
  const authenticatedRole = roleFromToken(config.token);

  useEffect(() => {
    localStorage.setItem("runout.admin.token", config.token);
  }, [config]);

  useEffect(() => {
    const unauthorized = () => {
      localStorage.removeItem("runout.admin.token");
      setConfig((current) => ({ ...current, token: "" }));
      setCurrentUser(null);
      setCurrentUserError("");
      setSection("dashboard");
      setSectionHistory([]);
    };
    window.addEventListener("runout:unauthorized", unauthorized);
    return () => window.removeEventListener("runout:unauthorized", unauthorized);
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setCurrentUser(null);
      setCurrentUserError("");
      return;
    }

    void loadCurrentUser(config)
      .then((user) => {
        setCurrentUser(user);
        setCurrentUserError("");
      })
      .catch((err) => {
        setCurrentUser(null);
        setCurrentUserError(errorMessage(err));
      });
  }, [authenticated, config.baseUrl, config.token]);

  function logout() {
    void apiRequest<void>(config, "/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    setConfig({ ...config, token: "" });
    setSection("dashboard");
    setSectionHistory([]);
  }

  function navigateTo(nextSection: Section) {
    if (nextSection === section) return;
    setSectionHistory((current) => [...current, section]);
    setSection(nextSection);
  }

  function goBack() {
    const allowed = allowedSections(authenticatedRole);
    const remaining = [...sectionHistory];
    let previous = remaining.pop();
    while (previous && !allowed.includes(previous)) previous = remaining.pop();
    if (!previous) return;
    setSectionHistory(remaining);
    setSection(previous);
  }

  useEffect(() => {
    if (!currentUser) return;
    const allowed = allowedSections(authenticatedRole);
    if (allowed.length === 0) {
      setConfig((current) => ({ ...current, token: "" }));
      return;
    }
    if (!allowed.includes(section)) setSection(allowed[0]);
  }, [currentUser, authenticatedRole, section]);

  if (!authenticated) {
    return <LoginScreen config={config} onLogin={setConfig} />;
  }

  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <div className="sidebarTop">
          <div className="brandMark">R</div>
          <div>
            <div className="brand">Runout</div>
            <div className="muted">Admin panel</div>
          </div>
        </div>

        <nav className="sideNav" aria-label="Admin navigation">
          {allowedSections(authenticatedRole).includes("dashboard") && <NavButton active={section === "dashboard"} icon={<Gauge size={18} />} label="Dashboard" onClick={() => navigateTo("dashboard")} />}
          {allowedSections(authenticatedRole).includes("users") && <NavButton active={section === "users"} icon={<UserRound size={18} />} label="Users" onClick={() => navigateTo("users")} />}
          {allowedSections(authenticatedRole).includes("reservations") && <NavButton active={section === "reservations"} icon={<CalendarCheck size={18} />} label="Reservations" onClick={() => navigateTo("reservations")} />}
          {allowedSections(authenticatedRole).includes("restaurants") && <NavButton active={section === "restaurants"} icon={<Store size={18} />} label="Restaurants" onClick={() => navigateTo("restaurants")} />}
        </nav>

        <div className="sidebarUser">
          <div className="avatar">{currentUser?.displayName?.charAt(0).toUpperCase() ?? "A"}</div>
          <div>
            <div className="userName">{currentUser?.displayName ?? "Admin"}</div>
            <div className="muted">{currentUser?.email ?? (currentUserError ? "Local profile unavailable" : "Active session")}</div>
            {authenticatedRole && <div className="sidebarRole">{roleLabel(authenticatedRole)}</div>}
          </div>
        </div>
      </aside>

      <section className="adminContent">
        <header className="topbar">
          <div className="topbarHeading">
            <button
              type="button"
              className="secondary backButton"
              onClick={goBack}
              disabled={sectionHistory.length === 0}
              title={sectionHistory.length === 0 ? "No previous page" : "Go back"}
            >
              <ArrowLeft size={18} /> Back
            </button>
            <div>
            <div className="eyebrow">Runout Operations</div>
            <h1>{sectionTitle(section)}</h1>
            </div>
          </div>
          <div className="topbarActions">
            <button className="iconButton" title="Sign out" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {currentUserError && <ProfileLoadError message={currentUserError} onLogout={logout} />}
        {!currentUserError && currentUser && section === "dashboard" && <DashboardPanel config={config} />}
        {!currentUserError && currentUser && section === "users" && <UsersPanel config={config} />}
        {!currentUserError && currentUser && authenticatedRole && section === "reservations" && <ReservationsPanel config={config} role={authenticatedRole} currentUser={currentUser} />}
        {!currentUserError && currentUser && authenticatedRole && section === "restaurants" && <RestaurantsPanel config={config} role={authenticatedRole} />}
      </section>
    </main>
  );
}

function ProfileLoadError({ message, onLogout }: { message: string; onLogout: () => void }) {
  return (
    <section className="panel statePanel">
      <div className="stateIcon"><XCircle size={24} /></div>
      <h2>Could not load the local profile</h2>
      <p>
        The token has an administrative role, but the backend could not find or return the
        local Runout user for this account.
      </p>
      <div className="error compact">{message}</div>
      <button type="button" onClick={onLogout}>
        <LogOut size={18} />
        Back to sign in
      </button>
    </section>
  );
}

function LoginScreen({ config, onLogin }: { config: ApiConfig; onLogin: (config: ApiConfig) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(loginEmail: string, loginPassword: string) {
    setLoading(true);
    setError("");
    try {
      const tokens = await apiRequest<TokenResponse>({ baseUrl: "http://localhost:8080", token: "" }, "/api/v1/auth/login", {
        method: "POST",
        body: { email: loginEmail, password: loginPassword }
      });
      onLogin({ baseUrl: "http://localhost:8080", token: tokens.accessToken });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signIn(email, password);
  }

  function signInAs(loginEmail: string, loginPassword: string) {
    setEmail(loginEmail);
    setPassword(loginPassword);
    void signIn(loginEmail, loginPassword);
  }

  return (
    <main className="loginPage">
      <section className="loginPanel">
        <div className="brandRow">
          <div className="brandMark">R</div>
          <div>
            <div className="brand">Runout</div>
            <div className="muted">Admin panel</div>
          </div>
        </div>

        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <div className="error compact">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
            Sign in
          </button>
        </form>
        <div className="quickLogin" aria-label="Demo accounts">
          <button type="button" className="secondary" onClick={() => signInAs("admin@admin.com", "Admin123456!")} disabled={loading}>
            Sign in as Admin
          </button>
          <button type="button" className="secondary" onClick={() => signInAs("personal@personal.com", "Admin123456!")} disabled={loading}>
            Sign in as Staff
          </button>
          <button type="button" className="secondary" onClick={() => signInAs("manager@manager.com", "Admin123456!")} disabled={loading}>
            Sign in as Manager
          </button>
        </div>
      </section>
    </main>
  );
}

function DashboardPanel({ config }: { config: ApiConfig }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [nextReservations, nextRestaurants, nextUsers] = await Promise.all([
        apiRequest<Reservation[]>(config, "/api/admin/reservations"),
        apiRequest<Restaurant[]>(config, "/api/admin/restaurants"),
        apiRequest<UserSummary[]>(config, "/api/admin/users")
      ]);
      setReservations(nextReservations);
      setRestaurants(nextRestaurants);
      setUsers(nextUsers);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const pendingReservations = reservations.filter((reservation) => reservation.status === "PAID").length;
  const activeReservations = reservations.filter((reservation) =>
    ["ASSIGNED", "IN_PROGRESS", "CONFIRMED"].includes(reservation.status)
  ).length;
  const completedReservations = reservations.filter((reservation) => reservation.status === "COMPLETED").length;
  const recentReservations = [...reservations]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6);
  const reservationStatusSummary = ["PAID", "ASSIGNED", "IN_PROGRESS", "CONFIRMED", "REJECTED", "COMPLETED"]
    .map((status) => ({ status, count: reservations.filter((reservation) => reservation.status === status).length }));

  return (
    <section className="panel">
      <PanelHeader title="Dashboard" loading={loading} onRefresh={load} />
      {error && <div className="error">{error}</div>}
      <div className="statsGrid">
        <Stat label="Active reservations" value={activeReservations} />
        <Stat label="Completed reservations" value={completedReservations} />
        <Stat label="Pending assignment" value={pendingReservations} />
        <Stat label="Users" value={users.length} />
        <Stat label="Restaurants" value={restaurants.length} />
      </div>
      <div className="dashboardTables">
        <section className="dashboardSection">
          <div className="dashboardSectionHeader">
            <div>
              <div className="formTitle">Recent reservations</div>
              <div className="muted">Latest captured reservations entering operations.</div>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr><th>Status</th><th>Date</th><th>Guests</th><th>Total</th></tr>
              </thead>
              <tbody>
                {recentReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td><StatusBadge value={reservation.status} /></td>
                    <td>{formatDate(reservation.reservationAt)}</td>
                    <td>{reservation.partySize}</td>
                    <td>{reservation.totalBudget.amount} {reservation.totalBudget.currency}</td>
                  </tr>
                ))}
                {recentReservations.length === 0 && <tr><td className="emptyTable" colSpan={4}>No reservations yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="dashboardSection">
          <div className="dashboardSectionHeader">
            <div>
              <div className="formTitle">Reservation pipeline</div>
              <div className="muted">Current workload grouped by status.</div>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead><tr><th>Status</th><th>Reservations</th></tr></thead>
              <tbody>
                {reservationStatusSummary.map(({ status, count }) => (
                  <tr key={status}>
                    <td><StatusBadge value={status} /></td>
                    <td className="pipelineCount">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function UsersPanel({ config }: { config: ApiConfig }) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    displayName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    role: "WORKER" as "MANAGER" | "WORKER"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setUsers(await apiRequest<UserSummary[]>(config, "/api/admin/users"));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, role: UserRole) {
    setError("");
    try {
      await apiRequest<UserSummary>(config, `/api/admin/users/${userId}/role`, { method: "PATCH", body: { role } });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (staffForm.password !== staffForm.passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

    setCreatingStaff(true);
    setError("");
    try {
      await apiRequest<UserSummary>(config, "/api/admin/users", {
        method: "POST",
        body: {
          displayName: staffForm.displayName,
          email: staffForm.email,
          password: staffForm.password,
          role: staffForm.role
        }
      });
      setStaffForm({ displayName: "", email: "", password: "", passwordConfirmation: "", role: "WORKER" });
      setShowStaffForm(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreatingStaff(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const normalizedQuery = query.trim().toLowerCase();
    return matchesRole && (!normalizedQuery
      || user.displayName.toLowerCase().includes(normalizedQuery)
      || user.email.toLowerCase().includes(normalizedQuery)
      || user.id.toLowerCase().includes(normalizedQuery));
  });

  return (
    <section className="panel">
      <PanelHeader title="Users" loading={loading} onRefresh={load} />
      {error && <div className="error">{error}</div>}
      <div className="filtersBar">
        <div className="filterTabs">
          {(["ALL", "SUPER_ADMIN", "MANAGER", "WORKER", "USER"] as const).map((role) => (
            <button key={role} className={roleFilter === role ? "active" : "secondary"} onClick={() => setRoleFilter(role)}>
              {role === "ALL" ? "All" : roleLabel(role)}
              <span className="count">{role === "ALL" ? users.length : users.filter((user) => user.role === role).length}</span>
            </button>
          ))}
        </div>
        <div className="row">
          <button onClick={() => setShowStaffForm(true)}><UserPlus size={17} /> Create staff member</button>
          <div className="searchField"><Search size={17} /><input value={query} placeholder="Search by name, email or ID" onChange={(event) => setQuery(event.target.value)} /></div>
        </div>
      </div>
      <DataTable
        headers={["Name", "Email", "Role", "ID"]}
        rows={filteredUsers.map((user) => [user.displayName, user.email,
          user.role === "SUPER_ADMIN"
            ? <span className="roleLabel super_admin">Super admin</span>
            : <select className={`roleSelect ${user.role.toLowerCase()}`} value={user.role} onChange={(event) => void updateRole(user.id, event.target.value as UserRole)}>
                <option value="MANAGER">Manager</option><option value="WORKER">Worker</option><option value="USER">User</option>
              </select>,
          <span className="mono">{user.id}</span>])}
      />
      {showStaffForm && (
        <div className="modalOverlay" role="presentation" onMouseDown={() => setShowStaffForm(false)}>
          <section className="reservationModal staffModal" role="dialog" aria-modal="true" aria-labelledby="staff-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="modalHeader">
              <div>
                <div className="label" id="staff-dialog-title">New team member</div>
                <div className="muted">This account will be created with administrative access.</div>
              </div>
              <button className="iconButton secondary" title="Close" onClick={() => setShowStaffForm(false)}><X size={18} /></button>
            </header>
            <form className="form modalBody staffForm" onSubmit={createStaff}>
              <label>
                Full name
                <input value={staffForm.displayName} onChange={(event) => setStaffForm({ ...staffForm, displayName: event.target.value })} required maxLength={120} />
              </label>
              <label>
                Email address
                <input type="email" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} required maxLength={320} />
              </label>
              <label>
                Role
                <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value as "MANAGER" | "WORKER" })}>
                  <option value="WORKER">Worker</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </label>
              <label>
                Password
                <input type="password" value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} required minLength={12} maxLength={128} />
              </label>
              <label>
                Confirm password
                <input type="password" value={staffForm.passwordConfirmation} onChange={(event) => setStaffForm({ ...staffForm, passwordConfirmation: event.target.value })} required minLength={12} maxLength={128} />
              </label>
              <button type="submit" disabled={creatingStaff}>
                {creatingStaff ? <Loader2 className="spin" size={17} /> : <UserPlus size={17} />}
                Create account
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function ReservationsPanel({ config, role, currentUser }: { config: ApiConfig; role: UserRole; currentUser: UserSummary }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [employees, setEmployees] = useState<UserSummary[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([]);
  const [loadingNearbyRestaurants, setLoadingNearbyRestaurants] = useState(false);
  const [nearbyRestaurantsError, setNearbyRestaurantsError] = useState("");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmForm, setConfirmForm] = useState({
    restaurantId: "",
    reservedAt: ""
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [rows, assignees] = await Promise.all([
        apiRequest<Reservation[]>(config, role === "WORKER" ? "/api/admin/my-reservations" : "/api/admin/reservations"),
        role === "WORKER" ? Promise.resolve([currentUser]) : apiRequest<UserSummary[]>(config, "/api/admin/employees")
      ]);
      setReservations(rows);
      setEmployees(assignees);
      if (selected) {
        const updated = rows.find((row) => row.id === selected.id) ?? null;
        setSelected(updated);
        setSelectedEmployeeId(updated?.assignedEmployeeId ?? "");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function transition(path: string) {
    if (!selected) return;
    setError("");
    try {
      await apiRequest<void>(config, path, { method: "POST" });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function openReservation(reservation: Reservation) {
    setSelected(reservation);
    setSelectedEmployeeId(reservation.assignedEmployeeId ?? "");
    setConfirmForm({
      restaurantId: reservation.restaurantId ?? "",
      reservedAt: futureDateTimeLocal(reservation.confirmedReservationAt ?? reservation.reservationAt)
    });
    setLoadingNearbyRestaurants(true);
    setNearbyRestaurantsError("");
    try {
      setNearbyRestaurants(await apiRequest<NearbyRestaurant[]>(config, `/api/admin/reservations/${reservation.id}/nearby-restaurants`));
    } catch (err) {
      setNearbyRestaurants([]);
      setNearbyRestaurantsError(errorMessage(err));
    } finally {
      setLoadingNearbyRestaurants(false);
    }
  }

  async function assignEmployee() {
    if (!selected || !selectedEmployeeId) return;
    setError("");
    try {
      await apiRequest<void>(config, `/api/admin/reservations/${selected.id}/assignment`, {
        method: "POST",
        body: { employeeId: selectedEmployeeId }
      });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setError("");
    try {
      await apiRequest(config, `/api/admin/reservations/${selected.id}/confirmation`, {
        method: "POST",
        body: {
          restaurantId: confirmForm.restaurantId,
          externalReference: `RUNOUT-${selected.id.slice(0, 8)}-${Date.now()}`,
          reservedAt: new Date(confirmForm.reservedAt).toISOString()
        }
      });
      setConfirmForm({ restaurantId: "", reservedAt: "" });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleReservations = statusFilter === "ALL"
    ? reservations
    : reservations.filter((reservation) => reservation.status === statusFilter);

  const statusOptions = role === "WORKER"
    ? ["ALL", "IN_PROGRESS", "CONFIRMED", "REJECTED", "COMPLETED"]
    : ["ALL", "PAID", "ASSIGNED", "IN_PROGRESS", "CONFIRMED", "REJECTED", "COMPLETED"];
  const canStartSelected = role !== "MANAGER" && (selected?.status === "ASSIGNED" || selected?.status === "REJECTED");
  const canRejectSelected = role !== "MANAGER" && selected?.status === "IN_PROGRESS";
  const canCompleteSelected = role === "SUPER_ADMIN" && selected?.status === "CONFIRMED";
  const hasWorkflowAction = canStartSelected || canRejectSelected || canCompleteSelected;

  return (
    <section className="panel">
      <PanelHeader title="Reservations" loading={loading} onRefresh={load} />
      {error && <div className="error">{error}</div>}
      <div className="filtersBar reservationFilters">
        <div className="filterTabs">
          {statusOptions.map((status) => (
            <button key={status} className={statusFilter === status ? "active" : "secondary"} onClick={() => setStatusFilter(status)}>
              {status === "ALL" ? "All" : statusLabel(status)}
              <span className="count">{status === "ALL" ? reservations.length : reservations.filter((reservation) => reservation.status === status).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Date</th>
              <th>Guests</th>
              <th>Employee</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleReservations.map((reservation) => (
              <tr
                key={reservation.id}
                className="reservationRow"
                onClick={() => void openReservation(reservation)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") void openReservation(reservation);
                }}
                role="button"
                tabIndex={0}
              >
                <td><StatusBadge value={reservation.status} /></td>
                <td>{formatDate(reservation.reservationAt)}</td>
                <td>{reservation.partySize}</td>
                <td>{employeeName(reservation.assignedEmployeeId, employees)}</td>
                <td>{reservation.totalBudget.amount} {reservation.totalBudget.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modalOverlay" role="presentation" onMouseDown={() => setSelected(null)}>
          <section className="reservationModal" role="dialog" aria-modal="true" aria-labelledby="reservation-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="modalHeader">
              <div className="detailTop">
                <div>
                  <div className="label" id="reservation-dialog-title">Reservation details</div>
                  <div className="mono">{selected.id}</div>
                </div>
                <StatusBadge value={selected.status} />
              </div>
              <button className="iconButton secondary" title="Close details" onClick={() => setSelected(null)}><X size={18} /></button>
            </header>

            <div className="modalBody">
              <div className="facts">
                <span>{formatDate(selected.reservationAt)}</span>
                <span>{selected.partySize} guests</span>
                <span>{selected.searchArea.radiusMeters} m</span>
              </div>

              <div className="detailGrid">
                <DetailItem label="Budget per guest" value={`${selected.budgetPerPerson.amount} ${selected.budgetPerPerson.currency}`} />
                <DetailItem label="Total budget" value={`${selected.totalBudget.amount} ${selected.totalBudget.currency}`} />
                <DetailItem label="Payment" value={selected.payment.status} />
                <DetailItem label="Payment reference" value={selected.payment.reference ?? "No reference"} />
                <DetailItem label="Assigned employee" value={employeeName(selected.assignedEmployeeId, employees)} />
                <DetailItem label="Restaurant" value={selected.restaurantId ?? "Pending assignment"} mono />
                <DetailItem label="External reference" value={selected.externalReference ?? "No reference"} />
                <DetailItem label="Confirmed reservation time" value={formatDate(selected.confirmedReservationAt) || "Pending"} />
                <DetailItem label="Created" value={formatDate(selected.createdAt)} />
                <DetailItem label="Location" value={`${selected.searchArea.latitude}, ${selected.searchArea.longitude}`} />
                <DetailItem label="Excluded cuisines" value={selected.excludedCuisineTypes.join(", ") || "None"} />
              </div>

              <section className="nearbyRestaurants" aria-labelledby="nearby-restaurants-title">
                <div className="sectionHeading">
                  <div>
                    <div className="label" id="nearby-restaurants-title">Restaurants within the radius</div>
                    <div className="muted">{selected.searchArea.radiusMeters} m from the reservation location</div>
                  </div>
                </div>
                {loadingNearbyRestaurants && <div className="nearbyState"><Loader2 className="spin" size={18} /> Searching restaurants</div>}
                {!loadingNearbyRestaurants && nearbyRestaurantsError && <div className="error compact">{nearbyRestaurantsError}</div>}
                {!loadingNearbyRestaurants && !nearbyRestaurantsError && nearbyRestaurants.length === 0 && <div className="nearbyState">No active restaurants within this radius.</div>}
                {!loadingNearbyRestaurants && nearbyRestaurants.map((restaurant) => (
                  <div className={`nearbyRestaurant${confirmForm.restaurantId === restaurant.id ? " selected" : ""}`} key={restaurant.id}>
                    <div>
                      <div className="nearbyRestaurantName">{restaurant.name}</div>
                      <div className="muted">{restaurant.formattedAddress ?? "Address unavailable"}</div>
                    </div>
                    <div className="nearbyRestaurantMeta">
                      {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                      {restaurant.rating !== null && <span>{restaurant.rating.toFixed(1)} / 5</span>}
                      <strong>{formatDistance(restaurant.distanceMeters)}</strong>
                      {selected.status === "IN_PROGRESS" && (
                        <button
                          type="button"
                          className="secondary selectRestaurantButton"
                          onClick={() => setConfirmForm({ ...confirmForm, restaurantId: restaurant.id })}
                        >
                          {confirmForm.restaurantId === restaurant.id ? "Selected" : "Select"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>

              <div className="assignmentControl">
                <label>
                  Assign to employee
                  <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} disabled={selected.status !== "PAID" && selected.status !== "ASSIGNED"}>
                    <option value="">Select an employee</option>
                    {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.displayName} · {employee.email}</option>)}
                  </select>
                </label>
                <button onClick={() => void assignEmployee()} disabled={!selectedEmployeeId || (selected.status !== "PAID" && selected.status !== "ASSIGNED")}>
                  <ClipboardCheck size={17} /> {selected.status === "ASSIGNED" ? "Reassign" : "Assign"}
                </button>
              </div>

              {hasWorkflowAction && <div className="actions">
                {canStartSelected && <button onClick={() => transition(`/api/admin/reservations/${selected.id}/start`)}>
                  <Play size={17} /> Start
                </button>}
                {canRejectSelected && <button onClick={() => transition(`/api/admin/reservations/${selected.id}/rejection`)}>
                  <XCircle size={17} /> Reject
                </button>}
                {canCompleteSelected && <button onClick={() => transition(`/api/admin/reservations/${selected.id}/completion`)}>
                  <CheckCircle2 size={17} /> Complete
                </button>}
              </div>}

              {selected.status === "IN_PROGRESS" && <form className="form elevated confirmationForm" onSubmit={confirm}>
                <div className="formTitle">Confirm restaurant and time</div>
                <label>
                  Restaurant
                  <select
                    value={confirmForm.restaurantId}
                    onChange={(event) => setConfirmForm({ ...confirmForm, restaurantId: event.target.value })}
                    required
                  >
                    <option value="">Select a restaurant</option>
                    {nearbyRestaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name} · {formatDistance(restaurant.distanceMeters)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date and time
                  <input
                    type="datetime-local"
                    value={confirmForm.reservedAt}
                    min={futureDateTimeLocal(null)}
                    onChange={(event) => setConfirmForm({ ...confirmForm, reservedAt: event.target.value })}
                    required
                  />
                </label>
                <button type="submit" disabled={!confirmForm.restaurantId || !confirmForm.reservedAt}>
                  <CheckCircle2 size={17} /> Confirm
                </button>
              </form>}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function RestaurantsPanel({ config, role }: { config: ApiConfig; role: UserRole }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [view, setView] = useState<"create" | "list">("create");
  const [cityFilter, setCityFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [cityForm, setCityForm] = useState({ name: "", countryCode: "" });
  const [form, setForm] = useState<RestaurantForm>(emptyRestaurantForm());
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<GooglePlaceCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(form.id);
  const canManageRestaurants = role === "SUPER_ADMIN" || role === "MANAGER";
  const selectedFormCity = cities.find((city) => city.id === form.cityId);
  const selectedListCity = cities.find((city) => city.id === cityFilter);
  const restaurantsByCity = cityFilter === "ALL"
    ? restaurants
    : restaurants.filter((restaurant) => restaurant.cityId === cityFilter);
  const restaurantsByArea = areaFilter === "ALL"
    ? restaurantsByCity
    : restaurantsByCity.filter((restaurant) => restaurantAreaFor(restaurant) === areaFilter);
  const areaOptions = selectedListCity?.name === "Dubai"
    ? [...DUBAI_AREAS.map(({ name }) => name), "Other Dubai"]
    : [...new Set(restaurantsByCity.map(restaurantAreaFor))].sort();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [nextRestaurants, nextCities] = await Promise.all([
        apiRequest<Restaurant[]>(config, "/api/admin/restaurants"),
        apiRequest<City[]>(config, "/api/admin/cities")
      ]);
      setRestaurants(nextRestaurants);
      setCities(nextCities);
      const defaultCityId = nextCities.find((city) => city.name === "Dubai")?.id ?? nextCities[0]?.id ?? "";
      setForm((current) => current.cityId ? current : { ...current, cityId: defaultCityId });
      setCityFilter((current) => current || defaultCityId || "ALL");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const payload = restaurantPayload(form);
      if (editing) {
        await apiRequest<Restaurant>(config, `/api/admin/restaurants/${form.id}`, {
          method: "PATCH",
          body: payload
        });
      } else {
        await apiRequest<Restaurant>(config, "/api/admin/restaurants", {
          method: "POST",
          body: payload
        });
      }
      setForm(emptyRestaurantForm());
      await load();
      setView("list");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function searchPlaces(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchingPlaces(true);
    setError("");
    try {
      const params = new URLSearchParams({
        query: `${placeQuery} in ${selectedFormCity?.name ?? ""}`.trim(),
        languageCode: "en",
        regionCode: selectedFormCity?.countryCode ?? "AE"
      });
      setPlaceResults(await apiRequest<GooglePlaceCandidate[]>(config, `/api/admin/restaurants/google-places/search?${params}`));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSearchingPlaces(false);
    }
  }

  async function importPlace(place: GooglePlaceCandidate) {
    setError("");
    try {
      await apiRequest<Restaurant>(config, "/api/admin/restaurants/google-places/import", {
        method: "POST",
        body: {
          ...place,
          cityId: form.cityId,
          area: selectedFormCity?.name === "Dubai" ? dubaiAreaFor(place.formattedAddress) : form.area
        }
      });
      setPlaceResults([]);
      setPlaceQuery("");
      await load();
      setView("list");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function setActive(id: string, active: boolean) {
    setError("");
    try {
      await apiRequest<void>(config, `/api/admin/restaurants/${id}/${active ? "activation" : "deactivation"}`, {
        method: "POST"
      });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function createCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const city = await apiRequest<City>(config, "/api/admin/cities", {
        method: "POST",
        body: cityForm
      });
      setCities((current) => [...current, city].sort((left, right) => left.name.localeCompare(right.name)));
      setCityForm({ name: "", countryCode: "" });
      setForm((current) => ({ ...current, cityId: city.id, area: "" }));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="panel">
      <PanelHeader title="Restaurants" loading={loading} onRefresh={load} />
      {error && <div className="error">{error}</div>}
      <div className="restaurantViewTabs" role="tablist" aria-label="Restaurant views">
        <button
          type="button"
          className={view === "create" ? "active" : "secondary"}
          role="tab"
          aria-selected={view === "create"}
          onClick={() => setView("create")}
        >
          <Store size={17} /> Create restaurant
        </button>
        <button
          type="button"
          className={view === "list" ? "active" : "secondary"}
          role="tab"
          aria-selected={view === "list"}
          onClick={() => setView("list")}
        >
          <List size={17} /> Restaurant list
        </button>
      </div>

      {view === "create" && <div className="restaurantTools">
        {role === "SUPER_ADMIN" && (
          <form className="form elevated cityCreator" onSubmit={createCity}>
            <div>
              <div className="formTitle">Add city</div>
              <div className="muted">New cities become available when creating and filtering restaurants.</div>
            </div>
            <label>
              City name
              <input value={cityForm.name} onChange={(event) => setCityForm({ ...cityForm, name: event.target.value })} required />
            </label>
            <label>
              Country code
              <input
                value={cityForm.countryCode}
                maxLength={2}
                placeholder="AE"
                onChange={(event) => setCityForm({ ...cityForm, countryCode: event.target.value.toUpperCase() })}
                required
              />
            </label>
            <button type="submit"><MapPin size={17} /> Add city</button>
          </form>
        )}

        <form className="form elevated googlePlacesForm" onSubmit={searchPlaces}>
          <label>
            Search Google Maps
            <div className="inlineSearch">
              <input
                value={placeQuery}
                placeholder={`e.g. sushi in ${selectedFormCity?.name ?? "city"}`}
                onChange={(event) => setPlaceQuery(event.target.value)}
                required
              />
              <button type="submit" disabled={searchingPlaces || !form.cityId}>
                {searchingPlaces ? <Loader2 className="spin" size={17} /> : <Search size={17} />}
                Search
              </button>
            </div>
          </label>
          <div className="placeResults">
            {placeResults.map((place) => (
              <article className="placeResult" key={place.googlePlaceId}>
                <div>
                  <strong>{place.name}</strong>
                  <div className="muted">{place.formattedAddress ?? "No address"}</div>
                  <div className="facts compactFacts">
                    {place.rating && <span>{place.rating} · {place.userRatingCount ?? 0} reviews</span>}
                    {place.phone && <span>{place.phone}</span>}
                    {place.primaryType && <span>{place.primaryType}</span>}
                  </div>
                </div>
                <div className="placeActions">
                  {place.googleMapsUri && (
                    <a className="linkButton" href={place.googleMapsUri} target="_blank" rel="noreferrer">
                      <MapPin size={16} /> Maps
                    </a>
                  )}
                  <button type="button" onClick={() => importPlace(place)}>
                    <Store size={16} /> Import
                  </button>
                </div>
              </article>
            ))}
          </div>
        </form>

        <form className="form elevated restaurantEditorForm" onSubmit={save}>
          <div className="formTitle">{editing ? "Edit restaurant" : "Create restaurant manually"}</div>
          <div className="formGrid">
          <label>
            City
            <select
              value={form.cityId}
              onChange={(event) => {
                const city = cities.find((candidate) => candidate.id === event.target.value);
                setForm({ ...form, cityId: event.target.value, area: city?.name === "Dubai" ? "Other Dubai" : "" });
              }}
              required
            >
              <option value="" disabled>Select city</option>
              {cities.map((city) => <option key={city.id} value={city.id}>{city.name} ({city.countryCode})</option>)}
            </select>
          </label>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>Cuisine<input value={form.cuisine} placeholder="Mediterranean" onChange={(event) => setForm({ ...form, cuisine: event.target.value })} /></label>
          <label>Price tier<select value={form.priceTier ?? ""} onChange={(event) => setForm({ ...form, priceTier: event.target.value ? Number(event.target.value) : null })}><option value="">Not specified</option><option value="1">€</option><option value="2">€€</option><option value="3">€€€</option><option value="4">€€€€</option></select></label>
          <label className="spanTwo">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="spanTwo">Opening hours<input value={form.openingHours} placeholder="Mon-Sun 13:00-00:00" onChange={(event) => setForm({ ...form, openingHours: event.target.value })} /></label>
          {selectedFormCity?.name === "Dubai" ? (
            <label>
              Dubai area
              <select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} required>
                {DUBAI_AREAS.map(({ name }) => <option key={name} value={name}>{name}</option>)}
                <option value="Other Dubai">Other Dubai</option>
              </select>
            </label>
          ) : (
            <label>Area<input value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} required /></label>
          )}
          <label className="spanTwo">Address<input value={form.formattedAddress} onChange={(event) => setForm({ ...form, formattedAddress: event.target.value })} /></label>
          <label>Latitude<input type="number" step="any" value={form.latitude ?? ""} onChange={(event) => setForm({ ...form, latitude: event.target.value ? Number(event.target.value) : null })} /></label>
          <label>Longitude<input type="number" step="any" value={form.longitude ?? ""} onChange={(event) => setForm({ ...form, longitude: event.target.value ? Number(event.target.value) : null })} /></label>
          <label className="spanTwo">Tags (comma separated)<input value={form.tags.join(", ")} onChange={(event) => setForm({ ...form, tags: commaList(event.target.value) })} /></label>
          <label>Google Place ID<input value={form.googlePlaceId} onChange={(event) => setForm({ ...form, googlePlaceId: event.target.value })} /></label>
          <label>Primary type<input value={form.primaryType} onChange={(event) => setForm({ ...form, primaryType: event.target.value })} /></label>
          <label className="spanTwo">Google types (comma separated)<input value={form.types.join(", ")} onChange={(event) => setForm({ ...form, types: commaList(event.target.value) })} /></label>
          <label>Rating<input type="number" min="0" max="5" step="0.1" value={form.rating ?? ""} onChange={(event) => setForm({ ...form, rating: event.target.value ? Number(event.target.value) : null })} /></label>
          <label>Review count<input type="number" min="0" value={form.userRatingCount ?? ""} onChange={(event) => setForm({ ...form, userRatingCount: event.target.value ? Number(event.target.value) : null })} /></label>
          <label className="spanTwo">Web<input type="url" value={form.websiteUri} onChange={(event) => setForm({ ...form, websiteUri: event.target.value })} /></label>
          <label className="spanTwo">Google Maps URL<input type="url" value={form.googleMapsUri} onChange={(event) => setForm({ ...form, googleMapsUri: event.target.value })} /></label>
          <label className="spanTwo">Menus JSON<textarea value={form.menusJson} placeholder={'[{ "id": 1, "entries": { "starter": "Hummus", "main": "Grilled fish" } }]'} onChange={(event) => setForm({ ...form, menusJson: event.target.value })} /></label>
          </div>
          <div className="row">
            <button type="submit">
              <Store size={17} /> {editing ? "Update" : "Create manually"}
            </button>
            {editing && (
              <button type="button" className="secondary" onClick={() => setForm(emptyRestaurantForm(form.cityId))}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>}

      {view === "list" && <div className="restaurantTable">
        <div className="restaurantListToolbar">
          <div>
            <div className="formTitle">Restaurant list</div>
            <div className="muted">Browse restaurants by city and area.</div>
          </div>
          <div className="restaurantListFilters">
          <label className="areaFilter">
            City
            <select
              value={cityFilter}
              onChange={(event) => {
                setCityFilter(event.target.value);
                setAreaFilter("ALL");
              }}
            >
              <option value="ALL">All cities ({restaurants.length})</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({restaurants.filter((restaurant) => restaurant.cityId === city.id).length})
                </option>
              ))}
            </select>
          </label>
          <label className="areaFilter">
            Area
            <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
              <option value="ALL">All areas ({restaurantsByCity.length})</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area} ({restaurantsByCity.filter((restaurant) => restaurantAreaFor(restaurant) === area).length})
                </option>
              ))}
            </select>
          </label>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Area</th>
                <th>Phone</th>
                <th>Google</th>
                <th>Rating</th>
                <th>Active</th>
                {canManageRestaurants && <th></th>}
              </tr>
            </thead>
            <tbody>
              {restaurantsByArea.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td>
                    <strong>{restaurant.name}</strong>
                    <div className="muted">{restaurant.formattedAddress ?? ""}</div>
                  </td>
                  <td>{restaurant.cityName}</td>
                  <td>{restaurantAreaFor(restaurant)}</td>
                  <td>{restaurant.phone ?? ""}</td>
                  <td>
                    {restaurant.googleMapsUri ? (
                      <a href={restaurant.googleMapsUri} target="_blank" rel="noreferrer">Open Maps</a>
                    ) : (
                      ""
                    )}
                  </td>
                  <td>{restaurant.rating ? `${restaurant.rating} (${restaurant.userRatingCount ?? 0})` : ""}</td>
                  <td>{restaurant.active ? "Yes" : "No"}</td>
                  {canManageRestaurants && <td className="buttonCell">
                    <button
                      className="secondary"
                      onClick={() => {
                        setForm(restaurantToForm(restaurant));
                        setView("create");
                      }}
                    >
                      Edit
                    </button>
                    {restaurant.active ? (
                      <button className="secondary dangerButton" onClick={() => setActive(restaurant.id, false)}>
                        Delete
                      </button>
                    ) : (
                      <button className="secondary" onClick={() => setActive(restaurant.id, true)}>
                        Restore
                      </button>
                    )}
                  </td>}
                </tr>
              ))}
              {restaurantsByArea.length === 0 && (
                <tr>
                  <td className="emptyTable" colSpan={canManageRestaurants ? 8 : 7}>
                    No restaurants found in this area.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}
    </section>
  );
}

const DUBAI_AREAS = [
  { name: "Downtown Dubai", aliases: ["downtown dubai", "downtown"] },
  { name: "Business Bay", aliases: ["business bay"] },
  { name: "DIFC", aliases: ["difc", "dubai international financial centre"] },
  { name: "Dubai Marina", aliases: ["dubai marina", "marina"] },
  { name: "JBR", aliases: ["jbr", "jumeirah beach residence"] },
  { name: "Palm Jumeirah", aliases: ["palm jumeirah"] },
  { name: "Jumeirah", aliases: ["jumeirah"] },
  { name: "Dubai Hills", aliases: ["dubai hills"] },
  { name: "JVC", aliases: ["jvc", "jumeirah village circle"] },
  { name: "Al Barsha", aliases: ["al barsha"] },
  { name: "Deira", aliases: ["deira"] },
  { name: "Bur Dubai", aliases: ["bur dubai"] },
  { name: "Dubai Creek", aliases: ["dubai creek", "creek harbour"] },
  { name: "City Walk", aliases: ["city walk"] },
  { name: "Bluewaters Island", aliases: ["bluewaters"] }
] as const;

function dubaiAreaFor(formattedAddress: string | null): string {
  const address = formattedAddress?.toLocaleLowerCase("en") ?? "";
  return DUBAI_AREAS.find(({ aliases }) => aliases.some((alias) => address.includes(alias)))?.name ?? "Other Dubai";
}

function restaurantAreaFor(restaurant: Restaurant): string {
  return restaurant.area || dubaiAreaFor(restaurant.formattedAddress);
}

type RestaurantForm = {
  id: string;
  name: string;
  phone: string;
  cuisine: string;
  priceTier: number | null;
  description: string;
  openingHours: string;
  tags: string[];
  googlePlaceId: string;
  formattedAddress: string;
  cityId: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  userRatingCount: number | null;
  websiteUri: string;
  googleMapsUri: string;
  primaryType: string;
  types: string[];
  menusJson: string;
};

function emptyRestaurantForm(cityId = ""): RestaurantForm {
  return {
    id: "",
    name: "",
    phone: "",
    cuisine: "",
    priceTier: null,
    description: "",
    openingHours: "",
    tags: [],
    googlePlaceId: "",
    formattedAddress: "",
    cityId,
    area: "Other Dubai",
    latitude: null,
    longitude: null,
    rating: null,
    userRatingCount: null,
    websiteUri: "",
    googleMapsUri: "",
    primaryType: "",
    types: [],
    menusJson: "[]"
  };
}

function restaurantToForm(restaurant: Restaurant): RestaurantForm {
  return {
    id: restaurant.id,
    name: restaurant.name,
    phone: restaurant.phone ?? "",
    cuisine: restaurant.cuisine ?? "",
    priceTier: restaurant.priceTier,
    description: restaurant.description ?? "",
    openingHours: restaurant.openingHours ?? "",
    tags: restaurant.tags ?? [],
    googlePlaceId: restaurant.googlePlaceId ?? "",
    formattedAddress: restaurant.formattedAddress ?? "",
    cityId: restaurant.cityId,
    area: restaurantAreaFor(restaurant),
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    rating: restaurant.rating,
    userRatingCount: restaurant.userRatingCount,
    websiteUri: restaurant.websiteUri ?? "",
    googleMapsUri: restaurant.googleMapsUri ?? "",
    primaryType: restaurant.primaryType ?? "",
    types: restaurant.types,
    menusJson: JSON.stringify(restaurant.menus ?? [], null, 2)
  };
}

function restaurantPayload(form: RestaurantForm) {
  const menus = parseMenus(form.menusJson);
  return {
    name: form.name,
    phone: form.phone || null,
    cuisine: form.cuisine || null,
    priceTier: form.priceTier,
    description: form.description || null,
    openingHours: form.openingHours || null,
    tags: form.tags,
    googlePlaceId: form.googlePlaceId || null,
    formattedAddress: form.formattedAddress || null,
    cityId: form.cityId,
    area: form.area,
    latitude: form.latitude,
    longitude: form.longitude,
    rating: form.rating,
    userRatingCount: form.userRatingCount,
    websiteUri: form.websiteUri || null,
    googleMapsUri: form.googleMapsUri || null,
    primaryType: form.primaryType || null,
    types: form.types,
    menus
  };
}

function parseMenus(value: string): RestaurantMenu[] {
  if (!value.trim()) return [];
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Menus JSON must be an array");
  }
  return parsed.map((menu) => {
    if (!menu || typeof menu !== "object") {
      throw new Error("Every menu must be an object");
    }
    const candidate = menu as { id?: unknown; entries?: unknown };
    if (candidate.id !== null && candidate.id !== undefined && typeof candidate.id !== "number") {
      throw new Error("Menu id must be a number");
    }
    if (!candidate.entries || typeof candidate.entries !== "object" || Array.isArray(candidate.entries)) {
      throw new Error("Menu entries must be an object");
    }
    return {
      id: candidate.id ?? null,
      entries: Object.fromEntries(Object.entries(candidate.entries).map(([key, entry]) => [key, String(entry)]))
    };
  });
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function PanelHeader({ title, loading, onRefresh }: { title: string; loading: boolean; onRefresh: () => void }) {
  return (
    <header className="panelHeader">
      <h2>{title}</h2>
      <button className="iconButton" title="Refresh" onClick={onRefresh} disabled={loading}>
        {loading ? <Loader2 className="spin" size={18} /> : <RefreshCcw size={18} />}
      </button>
    </header>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="statValue">{value}</div>
      <div className="statLabel">{label}</div>
    </div>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="detailItem"><div className="label">{label}</div><div className={mono ? "mono" : ""}>{value}</div></div>;
}

function employeeName(employeeId: string | null, employees: UserSummary[]) {
  if (!employeeId) return "Unassigned";
  return employees.find((employee) => employee.id === employeeId)?.displayName ?? employeeId;
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status ${value.toLowerCase()}`}>{statusLabel(value)}</span>;
}

function statusLabel(value: string) {
  return {
    PAYMENT_PENDING: "Checkout incomplete",
    PAID: "Pending assignment",
    PAYMENT_FAILED: "Payment failed",
    CANCELLED: "Cancelled",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In progress",
    CONFIRMED: "Confirmed",
    REJECTED: "Rejected",
    COMPLETED: "Completed"
  }[value] ?? value.replaceAll("_", " ");
}

function commaList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function sectionTitle(section: Section) {
  return {
    dashboard: "Dashboard",
    users: "Users",
    reservations: "Reservations",
    restaurants: "Restaurants"
  }[section];
}

function allowedSections(role?: UserRole): Section[] {
  if (role === "SUPER_ADMIN") return ["dashboard", "users", "reservations", "restaurants"];
  if (role === "MANAGER") return ["reservations", "restaurants"];
  if (role === "WORKER") return ["reservations", "restaurants"];
  return [];
}

async function loadCurrentUser(config: ApiConfig) {
  try {
    return await apiRequest<UserSummary>(config, "/api/v1/users/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 422 && error.message.includes("Active user not found")) {
      return apiRequest<UserSummary>(config, "/api/v1/users/me/provision", { method: "POST" });
    }
    throw error;
  }
}

function roleLabel(role: UserRole) {
  return {
    SUPER_ADMIN: "Super admin",
    MANAGER: "Manager",
    WORKER: "Worker",
    USER: "User"
  }[role];
}

function roleFromToken(token: string): UserRole | undefined {
  try {
    const encodedPayload = token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(paddedPayload)) as {
      realm_access?: { roles?: string[] };
    };
    const roles = payload.realm_access?.roles ?? [];
    return (["SUPER_ADMIN", "MANAGER", "WORKER", "USER"] as UserRole[]).find((role) => roles.includes(role));
  } catch {
    return undefined;
  }
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function futureDateTimeLocal(value: string | null) {
  const minimum = new Date(Date.now() + 5 * 60_000);
  const requested = value ? new Date(value) : minimum;
  return toDateTimeLocal((requested > minimum ? requested : minimum).toISOString());
}

function formatDistance(distanceMeters: number) {
  return distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}
