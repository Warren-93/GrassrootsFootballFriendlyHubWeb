// A local, in-memory stand-in for the API, for previewing the league fixtures
// screens without a backend. Only loaded by `npm run dev:mock` (vite --mode
// mock): it signs you in as a sample manager and answers /api/v1/* from the
// sample data below. Changes last until the dev server restarts.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

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

const COMPETITION = 'Glasgow & District U13 League - Division 1';
const OUR_TEAM = 't1';

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
    archived: false, createdAt: '2026-09-01T10:00:00Z', readyForRequests: true, profileChecklist: [],
    cometContactEmail: null, cometCompetitionName: null, ...extra,
  };
}

const teams: Record<string, Json> = {
  t1: team('t1', 'c1', 'Hillhead Juniors U13', {
    managerName: 'Sample Manager', contactPhone: '07700 900001', canManage: true, canManageClub: true,
    cometContactEmail: 'fixtures@hillheadjuniors.example', cometCompetitionName: COMPETITION,
  }),
  t2: team('t2', 'c2', 'Kelvinside Rovers U13', {
    managerName: 'Jamie Reid', contactPhone: '07700 900002', cometContactEmail: 'comet@kelvinsiderovers.example',
    cometCompetitionName: COMPETITION,
  }),
  t3: team('t3', 'c3', 'Govan Thistle U13', { managerName: 'Sam Kerr', contactPhone: '07700 900003' }),
  t4: team('t4', 'c4', 'Bearsden Colts U13', { managerName: 'Alex Shaw', contactPhone: '07700 900004', league: 'West of Scotland' }),
  t5: team('t5', 'c5', 'Clydebank Athletic U13', {
    managerName: 'Chris Boyd', contactPhone: '07700 900005', cometContactEmail: 'fixtures@clydebankathletic.example',
  }),
  t6: team('t6', 'c6', 'Partick Park U13', { verification: 'PENDING', readyForRequests: false }),
  t7: team('t7', 'c2', 'Kelvinside Rovers U14', { ageGroup: 'U14' }),
};

function teamRef(id: string): Json {
  const t = teams[id];
  return { id, name: t.name, clubName: t.clubName, badgeUrl: null };
}

function teamSummary(t: Json): Json {
  return {
    id: t.id, name: t.name, clubName: t.clubName, badgeUrl: null, ageGroup: t.ageGroup, gender: t.gender,
    format: t.format, abilityLevel: t.abilityLevel, organisation: t.organisation, league: t.league,
    description: null, generalArea: 'Glasgow West', verified: t.verification === 'VERIFIED',
  };
}

function venueSummary(id: string | null | undefined): Json | null {
  const v = venues.find((x) => x.id === id);
  if (!v) return null;
  return {
    id: v.id, name: v.name, address: v.address, postcode: v.postcode, pitchSurface: v.pitchSurface,
    accessNotes: v.accessNotes, parkingNotes: v.parkingNotes, latitude: v.latitude, longitude: v.longitude,
  };
}

function contact(id: string): Json {
  const t = teams[id];
  return { teamId: id, teamName: t.name, managerName: t.managerName, contactPhone: t.contactPhone, venueId: t.defaultVenueId };
}

function request(id: string, fields: Json): Json {
  const senderTeamId = fields.senderTeamId as string;
  const recipientTeamId = fields.recipientTeamId as string;
  return {
    id, status: 'SENT', venueId: null, homeTeamId: senderTeamId, awayTeamId: recipientTeamId, costShare: 'NONE',
    refereeArrangement: 'NONE', message: null, actionReason: null, availableActions: [], proposedStartTime: null,
    proposedEndTime: null, proposedVenueId: null, proposedDate: null, type: 'FRIENDLY', competitionName: null,
    ...fields,
  };
}

// The requests and fixtures the sample team starts with: an incoming league
// fixture to answer, an outgoing one the away team asked to move, and a
// friendly for comparison.
const requests: Json[] = [
  request('r1', {
    type: 'LEAGUE', senderTeamId: 't2', recipientTeamId: OUR_TEAM, date: saturday(1), startTime: '10:30:00',
    endTime: '12:00:00', venueId: 'v3', competitionName: COMPETITION,
    message: 'Pitch 2, behind the pavilion. Please arrive 30 minutes before kick-off.',
    availableActions: ['accept', 'suggestChanges', 'decline'],
  }),
  request('r2', {
    type: 'LEAGUE', senderTeamId: OUR_TEAM, recipientTeamId: 't3', status: 'CHANGES_REQUESTED', date: saturday(2),
    startTime: '10:00:00', endTime: '11:30:00', venueId: 'v1', competitionName: COMPETITION,
    proposedDate: saturday(2, 1), proposedStartTime: '11:00:00', proposedEndTime: '12:30:00',
    actionReason: "Half the squad are at a school tournament that Saturday. Could we play on the Sunday instead?",
    availableActions: ['acceptChanges', 'counter', 'withdraw'],
  }),
  request('r3', {
    senderTeamId: 't4', recipientTeamId: OUR_TEAM, date: saturday(3), startTime: '13:00:00', endTime: '14:30:00',
    venueId: 'v5', costShare: 'SPLIT', refereeArrangement: 'CLUB_SUPPLIED', message: 'Fancy a game before the winter break?',
    availableActions: ['accept', 'suggestChanges', 'decline'],
  }),
];

function fixture(id: string, fields: Json): Json {
  const home = fields.homeTeamId as string;
  const away = fields.awayTeamId as string;
  const side = (tid: string) => ({ ...contact(tid), id: tid, name: teams[tid].name, clubName: teams[tid].clubName, badgeUrl: null });
  return {
    id, friendlyRequestId: fields.friendlyRequestId ?? null, homeTeam: side(home), awayTeam: side(away),
    status: 'CONFIRMED', costShare: 'NONE', refereeArrangement: 'NONE', type: 'FRIENDLY', competitionName: null,
    cometContacts: null, ...fields, venue: venueSummary(fields.venueId as string),
  };
}

/** Who the confirmation goes to at the league: the home team's Comet contact, plus the away team's if it's different. */
function cometContacts(homeTeamId: string, awayTeamId: string): string[] {
  return [...new Set([teams[homeTeamId].cometContactEmail, teams[awayTeamId].cometContactEmail].filter(Boolean) as string[])];
}

const fixtures: Json[] = [
  fixture('f1', {
    type: 'LEAGUE', homeTeamId: OUR_TEAM, awayTeamId: 't5', date: saturday(0), startTime: '10:00:00', endTime: '11:30:00',
    venueId: 'v1', competitionName: COMPETITION, cometContacts: cometContacts(OUR_TEAM, 't5'),
  }),
  fixture('f2', {
    homeTeamId: 't4', awayTeamId: OUR_TEAM, date: saturday(0, 1), startTime: '11:00:00', endTime: '12:30:00',
    venueId: 'v5', costShare: 'SPLIT', refereeArrangement: 'CLUB_SUPPLIED',
  }),
  fixture('f3', {
    type: 'LEAGUE', homeTeamId: 't2', awayTeamId: OUR_TEAM, date: isoDate(-6), startTime: '10:30:00', endTime: '12:00:00',
    venueId: 'v3', status: 'COMPLETED', competitionName: COMPETITION, cometContacts: cometContacts('t2', OUR_TEAM),
  }),
];

const notifications: Json[] = [
  {
    id: 'n1', type: 'REQUEST_RECEIVED', title: 'New league fixture', body: 'Kelvinside Rovers U13 added a league fixture. Agree the venue and kick-off.',
    relatedTeamId: 't2', relatedRequestId: 'r1', relatedFixtureId: null, relatedConversationId: null, read: false,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: 'n2', type: 'REQUEST_CHANGES_REQUESTED', title: 'Change requested', body: 'Govan Thistle U13 asked to move your league fixture.',
    relatedTeamId: 't3', relatedRequestId: 'r2', relatedFixtureId: null, relatedConversationId: null, read: false,
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
];

/** A request as the API returns it: with the venue, team refs and contacts filled in. */
function requestView(r: Json): Json {
  const s = r.senderTeamId as string;
  const rc = r.recipientTeamId as string;
  return {
    ...r, venue: venueSummary((r.venueId as string) ?? teams[r.homeTeamId as string].defaultVenueId as string),
    proposedVenue: venueSummary(r.proposedVenueId as string), senderTeam: teamRef(s), recipientTeam: teamRef(rc),
    senderContact: contact(s), recipientContact: contact(rc),
  };
}

let nextId = 100;

/** The away team accepting turns the request into a confirmed fixture. */
function confirm(r: Json) {
  r.status = 'CONFIRMED';
  r.availableActions = [];
  const home = r.homeTeamId as string;
  const away = r.awayTeamId as string;
  const f = fixture(`f${nextId++}`, {
    type: r.type, friendlyRequestId: r.id, homeTeamId: home, awayTeamId: away, date: r.date, startTime: r.startTime,
    endTime: r.endTime, venueId: r.venueId, costShare: r.costShare, refereeArrangement: r.refereeArrangement,
    competitionName: r.competitionName, cometContacts: r.type === 'LEAGUE' ? cometContacts(home, away) : null,
  });
  fixtures.push(f);
  console.log(`[mock] fixture ${f.id} confirmed - would email managers, club contacts${r.type === 'LEAGUE' ? ` and Comet: ${(f.cometContacts as string[]).join(', ')}` : ''}`);
}

function applyProposal(r: Json) {
  if (r.proposedDate) r.date = r.proposedDate;
  if (r.proposedStartTime) r.startTime = r.proposedStartTime;
  if (r.proposedEndTime) r.endTime = r.proposedEndTime;
  if (r.proposedVenueId) r.venueId = r.proposedVenueId;
  clearProposal(r);
}

function clearProposal(r: Json) {
  r.proposedDate = null;
  r.proposedStartTime = null;
  r.proposedEndTime = null;
  r.proposedVenueId = null;
}

async function readBody(req: IncomingMessage): Promise<Json> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString();
  return text ? (JSON.parse(text) as Json) : {};
}

type Reply = [number, unknown];

function notFound(): Reply {
  return [404, { message: 'Not found in the preview data' }];
}

async function route(method: string, path: string, query: URLSearchParams, req: IncomingMessage): Promise<Reply> {
  const token = { accessToken: 'mock-access-token', tokenType: 'Bearer', expiresIn: 3600, user, verificationToken: null };
  if (path === '/api/v1/auth/refresh' || path === '/api/v1/auth/login') return [200, token];
  if (path === '/api/v1/auth/logout') return [204, null];
  if (path === '/api/v1/me') return [200, user];
  if (path === '/api/v1/config') return [200, { supportEmail: null, google: { enabled: false, clientId: null }, apple: { enabled: false, servicesId: null }, gifsEnabled: false }];

  if (path === '/api/v1/notifications/unread-count') return [200, { count: notifications.filter((n) => !n.read).length }];
  if (path === '/api/v1/notifications' && method === 'GET') return [200, notifications];
  if (path === '/api/v1/notifications/read-all') {
    notifications.forEach((n) => (n.read = true));
    return [204, null];
  }

  if (path === '/api/v1/teams/mine') return [200, [teams[OUR_TEAM]]];
  if (path === '/api/v1/teams/search') {
    const q = (query.get('q') ?? '').toLowerCase();
    const exclude = query.get('excludeTeamId');
    const found = Object.values(teams).filter(
      (t) => t.id !== exclude && `${t.name} ${t.clubName}`.toLowerCase().includes(q),
    );
    return [200, found.map(teamSummary)];
  }
  if (path === '/api/v1/teams' && method === 'GET') {
    return [200, Object.values(teams).filter((t) => t.clubId === query.get('clubId'))];
  }
  let m = path.match(/^\/api\/v1\/teams\/([^/]+)$/);
  if (m) {
    const t = teams[m[1]];
    if (!t) return notFound();
    if (method === 'PATCH') {
      const body = await readBody(req);
      for (const [key, value] of Object.entries(body)) t[key] = value === '' ? null : value;
    }
    return [200, t];
  }

  if (path === '/api/v1/venues') return [200, venues.filter((v) => v.clubId === query.get('clubId'))];
  m = path.match(/^\/api\/v1\/clubs\/([^/]+)$/);
  if (m) return clubs[m[1]] ? [200, { ...clubs[m[1]], badgeUrl: null, postcode: 'G12', website: null, createdAt: '2026-09-01T10:00:00Z' }] : notFound();

  if (path === '/api/v1/friendly-requests' && method === 'GET') {
    const teamId = query.get('teamId');
    return [200, requests.filter((r) => r.senderTeamId === teamId || r.recipientTeamId === teamId).map(requestView)];
  }
  if (path === '/api/v1/friendly-requests/league' && method === 'POST') {
    const body = await readBody(req);
    const home = body.homeTeamId as string;
    const away = body.awayTeamId as string;
    if (!teams[away]) return [400, { message: 'Pick an opponent on Kickabout.' }];
    const clash = requests.find(
      (r) => r.type === 'LEAGUE' && r.date === body.date && ['SENT', 'CHANGES_REQUESTED', 'UPDATED'].includes(r.status as string) &&
        [r.senderTeamId, r.recipientTeamId].includes(home) && [r.senderTeamId, r.recipientTeamId].includes(away),
    );
    if (clash) return [409, { message: 'There is already an open league fixture between these teams on that date.' }];
    const r = request(`r${nextId++}`, {
      type: 'LEAGUE', senderTeamId: home, recipientTeamId: away, date: body.date, startTime: body.startTime,
      endTime: body.endTime ?? addMinutes(body.startTime as string, 90), venueId: body.venueId, message: body.message ?? null,
      competitionName: teams[home].cometCompetitionName, availableActions: ['withdraw'],
    });
    requests.push(r);
    return [201, requestView(r)];
  }
  m = path.match(/^\/api\/v1\/friendly-requests\/([^/]+)$/);
  if (m) {
    const r = requests.find((x) => x.id === m![1]);
    return r ? [200, requestView(r)] : notFound();
  }
  m = path.match(/^\/api\/v1\/friendly-requests\/([^/]+)\/actions\/([^/]+)$/);
  if (m && method === 'POST') {
    const r = requests.find((x) => x.id === m![1]);
    if (!r) return notFound();
    const action = m[2];
    const body = await readBody(req);
    if (!(r.availableActions as string[]).includes(action)) return [409, { message: `Can't ${action} this request now.` }];
    if (action === 'accept') confirm(r);
    else if (action === 'acceptChanges') {
      applyProposal(r);
      confirm(r);
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
    return [200, requestView(r)];
  }

  if (path === '/api/v1/fixtures' && method === 'GET') {
    const teamId = query.get('teamId');
    return [200, fixtures.filter((f) => (f.homeTeam as Json).id === teamId || (f.awayTeam as Json).id === teamId)];
  }
  m = path.match(/^\/api\/v1\/fixtures\/([^/]+)(\/cancel)?$/);
  if (m) {
    const f = fixtures.find((x) => x.id === m![1]);
    if (!f) return notFound();
    if (m[2] && method === 'POST') {
      f.status = 'CANCELLED';
      console.log(`[mock] fixture ${f.id} cancelled - would email both teams${f.type === 'LEAGUE' ? ' and the Comet contact' : ''}`);
    } else if (method === 'PATCH') {
      const body = await readBody(req);
      for (const key of ['date', 'startTime', 'endTime', 'venueId']) if (body[key]) f[key] = body[key];
      f.venue = venueSummary(f.venueId as string);
      console.log(`[mock] fixture ${f.id} updated - would send "updated details" to both teams and ${(f.cometContacts as string[] | null)?.join(', ')}`);
    }
    return [200, f];
  }

  // Anything else the shell asks for (availability, conversations, members…) is empty in the preview.
  if (method === 'GET') return [200, []];
  return [204, null];
}

export function mockApi(): Plugin {
  return {
    name: 'kickabout-mock-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/api/')) return next();
        const url = new URL(req.url, 'http://localhost');
        try {
          const [status, body] = await route(req.method ?? 'GET', url.pathname, url.searchParams, req);
          res.statusCode = status;
          if (body === null) return res.end();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ message: String(error) }));
        }
      });
    },
  };
}
