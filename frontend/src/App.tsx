import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Loader2,
  LogOut,
  MapPin,
  Play,
  RefreshCcw,
  Search,
  Send,
  Store,
  UserPlus,
  UserRound,
  X,
  XCircle
} from "lucide-react";
import { ApiConfig, ApiError, apiRequest } from "./api";
import { GooglePlaceCandidate, NearbyRestaurant, Reservation, Restaurant, RestaurantMenu, TokenResponse, UserRole, UserSummary } from "./types";

type Section = "dashboard" | "users" | "reservations" | "restaurants";

const initialConfig: ApiConfig = {
  baseUrl: "http://localhost:8080",
  token: localStorage.getItem("runout.admin.token") ?? ""
};

export function App() {
  const [config, setConfig] = useState(initialConfig);
  const [section, setSection] = useState<Section>("dashboard");
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
          {allowedSections(authenticatedRole).includes("dashboard") && <NavButton active={section === "dashboard"} icon={<Gauge size={18} />} label="Dashboard" onClick={() => setSection("dashboard")} />}
          {allowedSections(authenticatedRole).includes("users") && <NavButton active={section === "users"} icon={<UserRound size={18} />} label="Users" onClick={() => setSection("users")} />}
          {allowedSections(authenticatedRole).includes("reservations") && <NavButton active={section === "reservations"} icon={<CalendarCheck size={18} />} label="Reservations" onClick={() => setSection("reservations")} />}
          {allowedSections(authenticatedRole).includes("restaurants") && <NavButton active={section === "restaurants"} icon={<Store size={18} />} label="Restaurants" onClick={() => setSection("restaurants")} />}
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
          <div>
            <div className="eyebrow">Runout Operations</div>
            <h1>{sectionTitle(section)}</h1>
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
        {!currentUserError && currentUser && section === "restaurants" && <RestaurantsPanel config={config} />}
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const tokens = await apiRequest<TokenResponse>({ baseUrl: "http://localhost:8080", token: "" }, "/api/v1/auth/login", {
        method: "POST",
        body: { email, password }
      });
      onLogin({ baseUrl: "http://localhost:8080", token: tokens.accessToken });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
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

  const activeReservations = reservations.filter((reservation) =>
    ["PAID", "ASSIGNED", "IN_PROGRESS"].includes(reservation.status)
  ).length;

  return (
    <section className="panel">
      <PanelHeader title="Dashboard" loading={loading} onRefresh={load} />
      {error && <div className="error">{error}</div>}
      <div className="statsGrid">
        <Stat label="Active reservations" value={activeReservations} />
        <Stat label="Users" value={users.length} />
        <Stat label="Restaurants" value={restaurants.length} />
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
    externalReference: "",
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
          externalReference: confirmForm.externalReference,
          reservedAt: new Date(confirmForm.reservedAt).toISOString()
        }
      });
      setConfirmForm({ restaurantId: "", externalReference: "", reservedAt: "" });
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
    ? ["ALL", "IN_PROGRESS", "CONFIRMED", "REJECTED", "SENT_TO_USER", "COMPLETED"]
    : ["ALL", "PAYMENT_PENDING", "PAID", "ASSIGNED", "IN_PROGRESS", "CONFIRMED", "REJECTED", "SENT_TO_USER", "COMPLETED"];

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
                  <div className="nearbyRestaurant" key={restaurant.id}>
                    <div>
                      <div className="nearbyRestaurantName">{restaurant.name}</div>
                      <div className="muted">{restaurant.formattedAddress ?? "Address unavailable"}</div>
                    </div>
                    <div className="nearbyRestaurantMeta">
                      {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                      {restaurant.rating !== null && <span>{restaurant.rating.toFixed(1)} / 5</span>}
                      <strong>{formatDistance(restaurant.distanceMeters)}</strong>
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

              <div className="actions">
                <button onClick={() => transition(`/api/admin/reservations/${selected.id}/start`)}>
                  <Play size={17} /> Start
                </button>
                <button onClick={() => transition(`/api/admin/reservations/${selected.id}/rejection`)}>
                  <XCircle size={17} /> Reject
                </button>
                {role === "SUPER_ADMIN" && <button onClick={() => transition(`/api/admin/reservations/${selected.id}/delivery`)}>
                  <Send size={17} /> Send
                </button>}
                {role === "SUPER_ADMIN" && <button onClick={() => transition(`/api/admin/reservations/${selected.id}/completion`)}>
                  <CheckCircle2 size={17} /> Complete
                </button>}
              </div>

              <form className="form elevated" onSubmit={confirm}>
                <label>
                  Restaurant ID
                  <input
                    value={confirmForm.restaurantId}
                    onChange={(event) => setConfirmForm({ ...confirmForm, restaurantId: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Reference
                  <input
                    value={confirmForm.externalReference}
                    onChange={(event) => setConfirmForm({ ...confirmForm, externalReference: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Reservation time
                  <input
                    type="datetime-local"
                    value={confirmForm.reservedAt}
                    onChange={(event) => setConfirmForm({ ...confirmForm, reservedAt: event.target.value })}
                    required
                  />
                </label>
                <button type="submit">
                  <CheckCircle2 size={17} /> Confirm
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function RestaurantsPanel({ config }: { config: ApiConfig }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [form, setForm] = useState<RestaurantForm>(emptyRestaurantForm());
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<GooglePlaceCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(form.id);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRestaurants(await apiRequest<Restaurant[]>(config, "/api/admin/restaurants"));
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
        query: placeQuery,
        languageCode: "en",
        regionCode: "AE"
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
        body: place
      });
      setPlaceResults([]);
      setPlaceQuery("");
      await load();
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

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="panel">
      <PanelHeader title="Restaurants" loading={loading} onRefresh={load} />
      {error && <div className="error">{error}</div>}
      <div className="restaurantTools">
        <form className="form elevated googlePlacesForm" onSubmit={searchPlaces}>
          <label>
            Search Google Maps
            <div className="inlineSearch">
              <input
                value={placeQuery}
                placeholder="e.g. sushi in Dubai"
                onChange={(event) => setPlaceQuery(event.target.value)}
                required
              />
              <button type="submit" disabled={searchingPlaces}>
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
              <button type="button" className="secondary" onClick={() => setForm(emptyRestaurantForm())}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="restaurantTable">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Google</th>
                <th>Rating</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td>
                    <strong>{restaurant.name}</strong>
                    <div className="muted">{restaurant.formattedAddress ?? ""}</div>
                  </td>
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
                  <td className="buttonCell">
                    <button
                      className="secondary"
                      onClick={() => setForm(restaurantToForm(restaurant))}
                    >
                      Edit
                    </button>
                    <button className="secondary" onClick={() => setActive(restaurant.id, true)}>
                      Activate
                    </button>
                    <button className="secondary" onClick={() => setActive(restaurant.id, false)}>
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
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

function emptyRestaurantForm(): RestaurantForm {
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
    PAYMENT_PENDING: "Payment pending",
    PAID: "Paid · pending",
    PAYMENT_FAILED: "Payment failed",
    CANCELLED: "Cancelled",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In progress",
    CONFIRMED: "Confirmed",
    REJECTED: "Rejected",
    SENT_TO_USER: "Sent to user",
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
  if (role === "MANAGER") return ["restaurants"];
  if (role === "WORKER") return ["reservations"];
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

function formatDistance(distanceMeters: number) {
  return distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}
