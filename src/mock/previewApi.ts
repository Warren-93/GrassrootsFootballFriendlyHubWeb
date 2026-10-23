// A stand-in for the API that runs in the browser, for previewing the league
// fixtures screens without a backend. Only loaded when the build sets
// VITE_PREVIEW_MOCK (`npm run dev:mock`, or the league-fixtures branch's
// Vercel preview - see vite.config.ts): it answers every /api/v1/* fetch from
// the sample data below and signs you in as a sample manager. Changes are kept
// for the browser tab (sessionStorage) and never reach a real API.

type Json = Record<string, unknown>;

function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The next Saturday at least `weeks` weeks away, so the sample fixtures land on match days. */
function saturday(weeks: number, plusDays = 0): string {
  const d = new Date();
  const toSat = (6 - d.getDay() + 7) % 7 || 7;
  return isoDate(toSat + weeks * 7 + plusDays);
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`;
}

const LEAGUE = 'Glasgow & District U13 League - Division 1';
const CUP = 'Glasgow & District U13 Cup';
const OUR_TEAM = 't1';
const SAMPLE_LEAGUE = 'Sample League - Division 1';

const user = { id: 'u1', email: 'manager@hillheadjuniors.example', displayName: 'Sample Manager', emailVerified: true };

const clubs: Record<string, Json> = {
  c1: { id: 'c1', name: 'Hillhead Juniors FC', contactEmail: 'secretary@hillheadjuniors.example' },
  c2: { id: 'c2', name: 'Kelvinside Rovers', contactEmail: null },
  c3: { id: 'c3', name: 'Govan Thistle', contactEmail: null },
  c4: { id: 'c4', name: 'Bearsden Colts', contactEmail: null },
  c5: { id: 'c5', name: 'Clydebank Athletic', contactEmail: null },
  c6: { id: 'c6', name: 'Partick Park', contactEmail: null },
};

function venue(id: string, clubId: string, name: string, address: string, postcode: string, surface: string, isDefault: boolean): Json {
  return {
    id, clubId, name, address, postcode, longitude: -4.29, latitude: 55.87, pitchSurface: surface,
    facilities: ['CHANGING_ROOMS', 'PARKING'], accessNotes: null, parkingNotes: 'Car park off the main road',
    pitchNumber: null, isDefault, createdAt: '2026-09-01T10:00:00Z',
  };
}

const venues: Json[] = [
  venue('v1', 'c1', 'Hillhead Park 3G', '12 Park Road, Glasgow', 'G12 8QQ', 'THREE_G', true),
  venue('v2', 'c1', 'Hillhead Academy grass pitch', 'Oakfield Avenue, Glasgow', 'G12 8LP', 'GRASS', false),
  venue('v3', 'c2', 'Kelvin Park', '40 Kelvin Way, Glasgow', 'G3 7TA', 'GRASS', true),
  venue('v4', 'c3', 'Govan Community Pitches', '5 Langlands Road, Glasgow', 'G51 3BD', 'THREE_G', true),
  venue('v5', 'c4', 'Bearsden Sports Hub', 'Stockiemuir Road, Bearsden', 'G61 3RS', 'THREE_G', true),
  venue('v6', 'c5', 'Clydebank Recreation Ground', 'Kilbowie Road, Clydebank', 'G81 2PA', 'FOUR_G', true),
];

function team(id: string, clubId: string, name: string, extra: Json = {}): Json {
  return {
    id, clubId, name, clubName: clubs[clubId].name, badgeUrl: null, ageGroup: 'U13', gender: 'BOYS',
    format: 'ELEVEN_A_SIDE', abilityLevel: 'DIVISION_1', organisation: 'SYFA', league: 'Glasgow & District',
    postcode: 'G12', longitude: -4.29, latitude: 55.87, travelRadiusMiles: 15, homeAwayPreference: 'EITHER',
    managerName: null, contactPhone: null, description: null, verification: 'VERIFIED',
    defaultVenueId: venues.find((v) => v.clubId === clubId && v.isDefault)?.id ?? null, completenessPercent: 100,
    archived: false, createdAt: '2026-09-01T10:00:00Z', readyForRequests: true, profileChecklist: [], ...extra,
  };
}

/** The sample opponents and their venues, shared by both modes. */
function baseStore() {
  const teams: Record<string, Json> = {
    t1: team('t1', 'c1', 'Hillhead Juniors U13', {
      managerName: 'Sample Manager', contactPhone: '07700 900001', canManage: true, canManageClub: true,
    }),
    t2: team('t2', 'c2', 'Kelvinside Rovers U13', { managerName: 'Jamie Reid', contactPhone: '07700 900002' }),
    t3: team('t3', 'c3', 'Govan Thistle U13', { managerName: 'Sam Kerr', contactPhone: '07700 900003' }),
    t4: team('t4', 'c4', 'Bearsden Colts U13', { managerName: 'Alex Shaw', contactPhone: '07700 900004', league: 'West of Scotland' }),
    t5: team('t5', 'c5', 'Clydebank Athletic U13', { managerName: 'Chris Boyd', contactPhone: '07700 900005' }),
    t6: team('t6', 'c6', 'Partick Park U13', { verification: 'PENDING', readyForRequests: false }),
    t7: team('t7', 'c2', 'Kelvinside Rovers U14', { ageGroup: 'U14' }),
  };
  // The other teams' copies of a league only matter for whose Comet contact
  // gets copied in on a fixture between them.
  const leagues: Json[] = [
    { id: 'l3', teamId: 't2', name: LEAGUE, cometContactEmail: 'comet@kelvinsiderovers.example' },
    { id: 'l5', teamId: 't5', name: LEAGUE, cometContactEmail: 'fixtures@clydebankathletic.example' },
  ];
  return {
    teams, leagues, venues: [...venues], requests: [] as Json[], fixtures: [] as Json[], notifications: [] as Json[],
    seededTeams: [] as string[], nextId: 100,
  };
}

type Store = ReturnType<typeof baseStore>;

/**
 * Gives a team its sample leagues and league fixtures: an incoming one to
 * answer, an outgoing one the away team asked to move, upcoming and played
 * ones, and a cup tie. `withFriendlies` adds a friendly request and fixture
 * for comparison - only in the all-sample mode, never mixed into real data.
 */
function seedTeam(store: Store, ourTeamId: string, withFriendlies: boolean) {
  if (!ourTeamId || store.seededTeams.includes(ourTeamId)) return;
  store.seededTeams.push(ourTeamId);
  // A real team the app hasn't loaded yet - named properly once it does.
  store.teams[ourTeamId] ??= { id: ourTeamId, name: 'Your team', clubName: null, defaultVenueId: null };
  const our = store.teams[ourTeamId];
  const ourVenue = (our?.defaultVenueId as string) ?? null;
  const l1 = `l${store.nextId++}`;
  const l2 = `l${store.nextId++}`;
  const id = (prefix: string) => `${prefix}${store.nextId++}`;
  // A real team gets clearly made-up league names, whatever its age group.
  store.leagues.push(
    { id: l1, teamId: ourTeamId, name: withFriendlies ? LEAGUE : SAMPLE_LEAGUE, cometContactEmail: withFriendlies ? 'fixtures@hillheadjuniors.example' : null },
    { id: l2, teamId: ourTeamId, name: withFriendlies ? CUP : 'Sample Cup', cometContactEmail: 'cup@sampleleague.example' },
  );
  store.requests.push(
    request(store, id('r'), {
      type: 'LEAGUE', leagueId: l1, senderTeamId: 't2', recipientTeamId: ourTeamId, date: saturday(1), startTime: '10:30:00',
      endTime: '12:00:00', venueId: 'v3', message: 'Pitch 2, behind the pavilion. Please arrive 30 minutes before kick-off.',
      availableActions: ['accept', 'suggestChanges', 'decline'],
    }),
    request(store, id('r'), {
      type: 'LEAGUE', leagueId: l1, senderTeamId: ourTeamId, recipientTeamId: 't3', status: 'CHANGES_REQUESTED', date: saturday(2),
      startTime: '10:00:00', endTime: '11:30:00', venueId: ourVenue, proposedDate: saturday(2, 1), proposedStartTime: '11:00:00',
      proposedEndTime: '12:30:00',
      actionReason: 'Half the squad are at a school tournament that Saturday. Could we play on the Sunday instead?',
      availableActions: ['acceptChanges', 'counter', 'withdraw'],
    }),
  );
  store.fixtures.push(
    fixture(store, id('f'), {
      type: 'LEAGUE', leagueId: l1, homeTeamId: ourTeamId, awayTeamId: 't5', date: saturday(0), startTime: '10:00:00',
      endTime: '11:30:00', venueId: ourVenue,
    }),
    fixture(store, id('f'), {
      type: 'LEAGUE', leagueId: l1, homeTeamId: 't2', awayTeamId: ourTeamId, date: isoDate(-6), startTime: '10:30:00',
      endTime: '12:00:00', venueId: 'v3', status: 'COMPLETED',
    }),
    fixture(store, id('f'), {
      type: 'LEAGUE', leagueId: l2, homeTeamId: ourTeamId, awayTeamId: 't3', date: saturday(4), startTime: '12:00:00',
      endTime: '13:30:00', venueId: ourVenue,
    }),
  );
  if (!withFriendlies) return;
  store.requests.push(
    request(store, id('r'), {
      senderTeamId: 't4', recipientTeamId: ourTeamId, date: saturday(3), startTime: '13:00:00', endTime: '14:30:00',
      venueId: 'v5', costShare: 'SPLIT', refereeArrangement: 'CLUB_SUPPLIED', message: 'Fancy a game before the winter break?',
      availableActions: ['accept', 'suggestChanges', 'decline'],
    }),
  );
  store.fixtures.push(
    fixture(store, id('f'), {
      homeTeamId: 't4', awayTeamId: ourTeamId, date: saturday(0, 1), startTime: '11:00:00', endTime: '12:30:00',
      venueId: 'v5', costShare: 'SPLIT', refereeArrangement: 'CLUB_SUPPLIED',
    }),
  );
  store.notifications.push(
    {
      id: 'n1', type: 'REQUEST_RECEIVED', title: 'New league fixture', body: 'Kelvinside Rovers U13 added a league fixture. Agree the venue and kick-off.',
      relatedTeamId: 't2', relatedRequestId: store.requests[0].id, relatedFixtureId: null, relatedConversationId: null, read: false,
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
  );
}



const STORAGE_KEY = 'kickabout.previewApi.v2';

function loadStore(): Store {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Store;
  } catch {
    // Storage blocked or corrupt - start from the sample data.
  }
  return baseStore();
}

function saveStore(store: Store) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Not kept across reloads then; the preview still works.
  }
}

function leagueName(store: Store, leagueId: unknown): string | null {
  return (store.leagues.find((l) => l.id === leagueId)?.name as string) ?? null;
}

function request(store: Store, id: string, fields: Json): Json {
  return {
    id, status: 'SENT', venueId: null, homeTeamId: fields.senderTeamId, awayTeamId: fields.recipientTeamId, costShare: 'NONE',
    refereeArrangement: 'NONE', message: null, actionReason: null, availableActions: [], proposedStartTime: null,
    proposedEndTime: null, proposedVenueId: null, proposedDate: null, type: 'FRIENDLY', leagueId: null,
    ...fields, competitionName: leagueName(store, fields.leagueId),
  };
}

/** Who the confirmation goes to at the league: the home team's Comet contact, plus the away team's for the same league if different. */
function cometContacts(store: Store, leagueId: unknown, homeTeamId: string, awayTeamId: string): string[] {
  const name = leagueName(store, leagueId);
  const contacts = store.leagues
    .filter((l) => l.name === name && (l.teamId === homeTeamId || l.teamId === awayTeamId))
    .sort((a) => (a.teamId === homeTeamId ? -1 : 1))
    .map((l) => l.cometContactEmail as string | null);
  return [...new Set(contacts.filter(Boolean) as string[])];
}

function fixture(store: Store, id: string, fields: Json): Json {
  const home = fields.homeTeamId as string;
  const away = fields.awayTeamId as string;
  const league = fields.type === 'LEAGUE';
  return {
    id, friendlyRequestId: null, status: 'CONFIRMED', costShare: 'NONE', refereeArrangement: 'NONE', type: 'FRIENDLY',
    leagueId: null, ...fields, homeTeam: side(store, home), awayTeam: side(store, away),
    competitionName: leagueName(store, fields.leagueId),
    cometContacts: league ? cometContacts(store, fields.leagueId, home, away) : null,
  };
}

function side(store: Store, teamId: string): Json {
  const t = store.teams[teamId];
  return { id: teamId, name: t.name, clubName: t.clubName, managerName: t.managerName, contactPhone: t.contactPhone, venueId: t.defaultVenueId, badgeUrl: null };
}

function venueSummary(store: Store, id: unknown): Json | null {
  const v = store.venues.find((x) => x.id === id);
  if (!v) return null;
  return {
    id: v.id, name: v.name, address: v.address, postcode: v.postcode, pitchSurface: v.pitchSurface,
    accessNotes: v.accessNotes, parkingNotes: v.parkingNotes, latitude: v.latitude, longitude: v.longitude,
  };
}

function teamRef(store: Store, id: string): Json {
  const t = store.teams[id];
  return { id, name: t.name, clubName: t.clubName, badgeUrl: null };
}

function contact(store: Store, id: string): Json {
  const t = store.teams[id];
  return { teamId: id, teamName: t.name, managerName: t.managerName, contactPhone: t.contactPhone, venueId: t.defaultVenueId };
}

/** A request as the API returns it: with the venue, team refs and contacts filled in. */
function requestView(store: Store, r: Json): Json {
  const s = r.senderTeamId as string;
  const rc = r.recipientTeamId as string;
  return {
    ...r, venue: venueSummary(store, r.venueId ?? store.teams[r.homeTeamId as string]?.defaultVenueId),
    proposedVenue: venueSummary(store, r.proposedVenueId), senderTeam: teamRef(store, s), recipientTeam: teamRef(store, rc),
    senderContact: contact(store, s), recipientContact: contact(store, rc),
  };
}

function fixtureView(store: Store, f: Json): Json {
  return { ...f, venue: venueSummary(store, f.venueId) };
}

function leagueView(store: Store, l: Json): Json {
  const open = new Set(['SENT', 'CHANGES_REQUESTED', 'UPDATED']);
  return {
    ...l,
    pendingCount: store.requests.filter((r) => r.leagueId === l.id && open.has(r.status as string)).length,
    upcomingCount: store.fixtures.filter((f) => f.leagueId === l.id && f.status === 'CONFIRMED').length,
  };
}

function teamSummary(t: Json): Json {
  return {
    id: t.id, name: t.name, clubName: t.clubName, badgeUrl: null, ageGroup: t.ageGroup, gender: t.gender,
    format: t.format, abilityLevel: t.abilityLevel, organisation: t.organisation, league: t.league,
    description: null, generalArea: 'Glasgow West', verified: t.verification === 'VERIFIED',
  };
}

/** The away team accepting turns the request into a confirmed fixture. */
function confirm(store: Store, r: Json) {
  r.status = 'CONFIRMED';
  r.availableActions = [];
  const f = fixture(store, `f${store.nextId++}`, {
    type: r.type, leagueId: r.leagueId, friendlyRequestId: r.id, homeTeamId: r.homeTeamId, awayTeamId: r.awayTeamId,
    date: r.date, startTime: r.startTime, endTime: r.endTime, venueId: r.venueId, costShare: r.costShare,
    refereeArrangement: r.refereeArrangement,
  });
  store.fixtures.push(f);
  console.info(
    `[preview] Fixture confirmed. The real API would email both managers, the club contacts${
      r.type === 'LEAGUE' ? ` and Comet (${(f.cometContacts as string[]).join(', ')})` : ''
    }.`,
  );
}

function clearProposal(r: Json) {
  r.proposedDate = null;
  r.proposedStartTime = null;
  r.proposedEndTime = null;
  r.proposedVenueId = null;
}

type Reply = [number, unknown];

const notFound = (): Reply => [404, { message: 'Not found in the preview data' }];

function route(store: Store, method: string, path: string, query: URLSearchParams, body: Json): Reply {
  const token = { accessToken: 'preview-access-token', tokenType: 'Bearer', expiresIn: 3600, user, verificationToken: null };
  if (path.startsWith('/api/v1/auth/')) return path.endsWith('/logout') ? [204, null] : [200, token];
  if (path === '/api/v1/me') return [200, user];
  if (path === '/api/v1/config') {
    return [200, { supportEmail: null, google: { enabled: false, clientId: null }, apple: { enabled: false, servicesId: null }, gifsEnabled: false }];
  }

  if (path === '/api/v1/notifications/unread-count') return [200, { count: store.notifications.filter((n) => !n.read).length }];
  if (path === '/api/v1/notifications' && method === 'GET') return [200, store.notifications];
  if (path === '/api/v1/notifications/read-all') {
    store.notifications.forEach((n) => (n.read = true));
    return [204, null];
  }

  if (path === '/api/v1/teams/mine') return [200, [store.teams[OUR_TEAM]]];
  if (path === '/api/v1/teams/search') {
    const q = (query.get('q') ?? '').toLowerCase();
    const exclude = query.get('excludeTeamId');
    return [
      200,
      Object.values(store.teams)
        .filter((t) => t.id !== exclude && `${t.name} ${t.clubName}`.toLowerCase().includes(q))
        .map(teamSummary),
    ];
  }
  if (path === '/api/v1/teams' && method === 'GET') {
    return [200, Object.values(store.teams).filter((t) => t.clubId === query.get('clubId'))];
  }

  let m = path.match(/^\/api\/v1\/teams\/([^/]+)\/leagues$/);
  if (m) {
    const teamId = m[1];
    if (method === 'POST') {
      if (!(body.name as string)?.trim()) return [400, { message: 'Give the league a name.' }];
      const l = { id: `l${store.nextId++}`, teamId, name: body.name, cometContactEmail: body.cometContactEmail ?? null };
      store.leagues.push(l);
      return [201, leagueView(store, l)];
    }
    return [200, store.leagues.filter((l) => l.teamId === teamId).map((l) => leagueView(store, l))];
  }
  m = path.match(/^\/api\/v1\/leagues\/([^/]+)$/);
  if (m) {
    const l = store.leagues.find((x) => x.id === m![1]);
    if (!l) return notFound();
    if (method === 'PATCH') {
      l.name = body.name ?? l.name;
      l.cometContactEmail = body.cometContactEmail ?? null;
    }
    return [200, leagueView(store, l)];
  }

  m = path.match(/^\/api\/v1\/teams\/([^/]+)$/);
  if (m) {
    const t = store.teams[m[1]];
    if (!t) return notFound();
    if (method === 'PATCH') Object.assign(t, body);
    return [200, t];
  }

  if (path === '/api/v1/venues') return [200, store.venues.filter((v) => v.clubId === query.get('clubId'))];
  m = path.match(/^\/api\/v1\/clubs\/([^/]+)$/);
  if (m) {
    const c = clubs[m[1]];
    return c ? [200, { ...c, badgeUrl: null, postcode: 'G12', website: null, createdAt: '2026-09-01T10:00:00Z' }] : notFound();
  }

  if (path === '/api/v1/friendly-requests' && method === 'GET') {
    const teamId = query.get('teamId');
    return [200, store.requests.filter((r) => r.senderTeamId === teamId || r.recipientTeamId === teamId).map((r) => requestView(store, r))];
  }
  if (path === '/api/v1/friendly-requests/league' && method === 'POST') {
    const home = body.homeTeamId as string;
    const away = body.awayTeamId as string;
    if (!store.teams[away]) return [400, { message: 'Pick an opponent on Kickabout.' }];
    const clash = store.requests.find(
      (r) => r.type === 'LEAGUE' && r.date === body.date && ['SENT', 'CHANGES_REQUESTED', 'UPDATED'].includes(r.status as string) &&
        [r.senderTeamId, r.recipientTeamId].includes(home) && [r.senderTeamId, r.recipientTeamId].includes(away),
    );
    if (clash) return [409, { message: 'There is already an open league fixture between these teams on that date.' }];
    const r = request(store, `r${store.nextId++}`, {
      type: 'LEAGUE', leagueId: body.leagueId, senderTeamId: home, recipientTeamId: away, date: body.date,
      startTime: body.startTime, endTime: body.endTime ?? addMinutes(body.startTime as string, 90), venueId: body.venueId,
      message: body.message ?? null, availableActions: ['withdraw'],
    });
    store.requests.push(r);
    return [201, requestView(store, r)];
  }
  m = path.match(/^\/api\/v1\/friendly-requests\/([^/]+)$/);
  if (m) {
    const r = store.requests.find((x) => x.id === m![1]);
    return r ? [200, requestView(store, r)] : notFound();
  }
  m = path.match(/^\/api\/v1\/friendly-requests\/([^/]+)\/actions\/([^/]+)$/);
  if (m && method === 'POST') {
    const r = store.requests.find((x) => x.id === m![1]);
    if (!r) return notFound();
    const action = m[2];
    if (!(r.availableActions as string[]).includes(action)) return [409, { message: `Can't ${action} this request now.` }];
    if (action === 'accept') confirm(store, r);
    else if (action === 'acceptChanges') {
      if (r.proposedDate) r.date = r.proposedDate;
      if (r.proposedStartTime) r.startTime = r.proposedStartTime;
      if (r.proposedEndTime) r.endTime = r.proposedEndTime;
      if (r.proposedVenueId) r.venueId = r.proposedVenueId;
      clearProposal(r);
      confirm(store, r);
    } else if (action === 'counter') {
      clearProposal(r);
      r.status = 'SENT';
      r.actionReason = null;
      r.availableActions = ['withdraw'];
    } else if (action === 'withdraw') {
      r.status = 'CANCELLED';
      r.availableActions = [];
    } else if (action === 'decline') {
      r.status = 'DECLINED';
      r.actionReason = body.reason ?? null;
      r.availableActions = [];
    } else if (action === 'suggestChanges') {
      r.status = 'CHANGES_REQUESTED';
      r.actionReason = body.reason ?? null;
      r.proposedDate = body.proposedDate ?? null;
      r.proposedStartTime = body.proposedStartTime ?? null;
      r.proposedEndTime = body.proposedEndTime ?? null;
      r.proposedVenueId = body.proposedVenueId ?? null;
      r.availableActions = [];
    }
    return [200, requestView(store, r)];
  }

  if (path === '/api/v1/fixtures' && method === 'GET') {
    const teamId = query.get('teamId');
    return [
      200,
      store.fixtures
        .filter((f) => (f.homeTeam as Json).id === teamId || (f.awayTeam as Json).id === teamId)
        .map((f) => fixtureView(store, f)),
    ];
  }
  m = path.match(/^\/api\/v1\/fixtures\/([^/]+)(\/cancel)?$/);
  if (m) {
    const f = store.fixtures.find((x) => x.id === m![1]);
    if (!f) return notFound();
    if (m[2] && method === 'POST') {
      f.status = 'CANCELLED';
      console.info(`[preview] Fixture cancelled. The real API would email both teams${f.type === 'LEAGUE' ? ' and the Comet contact' : ''}.`);
    } else if (method === 'PATCH') {
      for (const key of ['date', 'startTime', 'endTime', 'venueId']) if (body[key]) f[key] = body[key];
      console.info(`[preview] Fixture updated. The real API would send "updated details" to both teams and ${(f.cometContacts as string[] | null)?.join(', ')}.`);
    }
    return [200, fixtureView(store, f)];
  }

  // Anything else the app asks for (availability, conversations, members…) is empty in the preview.
  if (method === 'GET') return [200, []];
  return [204, null];
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(payload === null ? null : JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The real team, kept so a league fixture can show its name, contacts and venue. */
function rememberTeam(store: Store, t: Json) {
  if (t && typeof t.id === 'string') store.teams[t.id] = { ...store.teams[t.id], ...t };
}

/**
 * The league fixtures overlay, for the Vercel preview: everything goes to the
 * real API (real sign-in, real teams, friendlies, messages), except the league
 * parts, which the API doesn't have yet. Those come from sample data kept in
 * this browser tab, seeded for whichever real team is signed in. Nothing
 * league-related reaches the real API or emails anyone.
 */
async function overlay(store: Store, realFetch: typeof fetch, input: RequestInfo | URL, init: RequestInit | undefined, url: URL, method: string, body: Json): Promise<Response> {
  const path = url.pathname;
  const local = (status: number, payload: unknown) => {
    if (method !== 'GET') saveStore(store);
    return jsonResponse(status, payload);
  };
  const passJson = async (): Promise<[Response, unknown]> => {
    const response = await realFetch(input, init);
    if (!response.ok) return [response, null];
    return [response, await response.clone().json().catch(() => null)];
  };

  // Learn the real teams and venues as the app loads them.
  const isTeamPath = /^\/api\/v1\/teams\/[^/]+$/.test(path) && path !== '/api/v1/teams/search';
  if (method === 'GET' && (isTeamPath || path === '/api/v1/venues')) {
    const [response, data] = await passJson();
    if (path === '/api/v1/venues' && Array.isArray(data)) {
      for (const v of data as Json[]) if (!store.venues.some((x) => x.id === v.id)) store.venues.push(v);
    } else if (Array.isArray(data)) (data as Json[]).forEach((t) => rememberTeam(store, t));
    else if (data) rememberTeam(store, data as Json);
    saveStore(store);
    return response;
  }

  // Opponents: real teams from Discover (same age group and gender), plus the sample ones.
  if (path === '/api/v1/teams/search') {
    const teamId = url.searchParams.get('excludeTeamId');
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    let real: Json[] = [];
    if (teamId) {
      const response = await realFetch(new URL('/api/v1/matches/search', url).toString(), {
        ...init,
        method: 'POST',
        headers: { ...(init?.headers as Record<string, string>), 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, ignoreTravelRadius: true, limit: 50 }),
      });
      if (response.ok) {
        const data = (await response.json()) as { results?: { team: Json }[] };
        real = (data.results ?? []).map((r) => r.team);
        for (const t of real) {
          const known = store.teams[t.id as string];
          store.teams[t.id as string] = { ...t, ...known, id: t.id, name: t.name, clubName: t.clubName };
        }
      }
    }
    const sample = Object.values(store.teams).filter((t) => /^t\d$/.test(t.id as string) && t.id !== 't1').map(teamSummary);
    const matches = [...real, ...sample].filter((t) => `${t.name} ${t.clubName}`.toLowerCase().includes(q));
    return local(200, matches);
  }

  const leagueTeam = path.match(/^\/api\/v1\/teams\/([^/]+)\/leagues$/)?.[1];
  if (leagueTeam) seedTeam(store, leagueTeam, false);

  // Lists: the real ones, with the sample league items added.
  if (method === 'GET' && (path === '/api/v1/friendly-requests' || path === '/api/v1/fixtures')) {
    const teamId = url.searchParams.get('teamId') ?? '';
    seedTeam(store, teamId, false);
    saveStore(store);
    const [response, data] = await passJson();
    if (!response.ok) return response;
    const real = Array.isArray(data) ? (data as Json[]) : [];
    const [, extra] = route(store, method, path, url.searchParams, body) as [number, Json[]];
    return jsonResponse(200, [...real, ...extra]);
  }

  const itemId = path.match(/^\/api\/v1\/(?:friendly-requests|fixtures)\/([^/]+)/)?.[1];
  const isLocalItem =
    !!itemId && (store.requests.some((r) => r.id === itemId) || store.fixtures.some((f) => f.id === itemId));
  if (leagueTeam || path.startsWith('/api/v1/leagues/') || path === '/api/v1/friendly-requests/league' || isLocalItem) {
    const [status, payload] = route(store, method, path, url.searchParams, body);
    return local(status, payload);
  }
  return realFetch(input, init);
}

/** Puts a small strip at the bottom of every page, so nobody mistakes the preview for the live site. */
function showPreviewStrip(text: string) {
  const strip = document.createElement('div');
  strip.textContent = text;
  strip.setAttribute('role', 'note');
  Object.assign(strip.style, {
    position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '2000', padding: '6px 12px',
    background: '#A85E10', color: '#fff', font: '600 12px/1.4 system-ui, sans-serif', textAlign: 'center',
  });
  document.body.appendChild(strip);
}

/**
 * Answers the app's API calls for the league fixtures preview. "full" answers
 * everything from sample data and signs you in as a sample manager (for
 * `npm run dev:mock`, with no API). "overlay" uses the real API and only fills
 * in the league parts (the Vercel preview).
 */
export function installPreviewApi(mode: 'full' | 'overlay') {
  const store = loadStore();
  if (mode === 'full') seedTeam(store, OUR_TEAM, true);
  else {
    // Alongside real teams, the made-up opponents say so.
    for (const t of Object.values(store.teams)) {
      if (/^t\d$/.test(t.id as string) && !(t.name as string).endsWith('(sample)')) t.name = `${t.name} (sample)`;
    }
    // The sample opponents are in this league too, so their Comet contacts get copied in.
    for (const l of store.leagues) if (l.teamId === 't2' || l.teamId === 't5') l.name = SAMPLE_LEAGUE;
  }
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input.toString() : input.url, window.location.origin);
    if (!url.pathname.startsWith('/api/v1/')) return realFetch(input, init);
    const method = (init?.method ?? 'GET').toUpperCase();
    let body: Json = {};
    try {
      body = typeof init?.body === 'string' && init.body ? (JSON.parse(init.body) as Json) : {};
    } catch {
      // Not JSON - the preview's routes don't need it.
    }
    if (mode === 'overlay') return overlay(store, realFetch, input, init, url, method, body);
    const [status, payload] = route(store, method, url.pathname, url.searchParams, body);
    if (method !== 'GET') saveStore(store);
    // A short pause, so loading states show as they would against the real API.
    await new Promise((resolve) => setTimeout(resolve, 150));
    return jsonResponse(status, payload);
  };
  showPreviewStrip(
    mode === 'overlay'
      ? 'Preview: league fixtures use sample data in this browser only. Nothing league-related is saved or emailed.'
      : 'Preview: sample data only, no real API.',
  );
}
