import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Zoo,
  Zookeeper,
  Observation,
  RiskAnalysis,
  Alert,
  AuditLog,
  TruthRatingData,
} from '../src/types.js';
import { createGeofenceBox } from './geo.js';

export interface StoredAccessCode {
  id: string;
  zooId: string;
  zookeeperId: string;
  codeHash: string;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface DatabaseSchema {
  users: User[];
  zoos: Zoo[];
  zookeepers: Zookeeper[];
  accessCodes: StoredAccessCode[];
  observations: Observation[];
  riskAnalyses: RiskAnalysis[];
  alerts: Alert[];
  auditLogs: AuditLog[];
  truthRatings: TruthRatingData[];
  credentials: Record<string, { passwordHash: string; salt: string }>; // userId or zooId -> hash
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sentinel_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

// Initial verified institutions (Master institution database)
const INITIAL_ZOOS: Zoo[] = [
  {
    id: 'zoo-sd-01',
    identifier: 'ZOO-SD-001',
    name: 'San Diego Wildlife Alliance & Zoo',
    country: 'United States',
    city: 'San Diego, CA',
    latitude: 32.7353,
    longitude: -117.149,
    geofenceRadiusMeters: 1500,
    geofencePolygon: createGeofenceBox(32.7353, -117.149, 1500),
    verified: true,
    truthRating: 0,
    totalReports: 0,
    confirmedCorrelations: 0,
    falseAlarms: 0,
    createdAt: '2026-01-10T00:00:00.000Z',
    contactEmail: 'admin@sandiegozoo.org',
  },
  {
    id: 'zoo-sg-02',
    identifier: 'ZOO-SG-002',
    name: 'Mandai Wildlife Reserve / Singapore Zoo',
    country: 'Singapore',
    city: 'Mandai',
    latitude: 1.4043,
    longitude: 103.793,
    geofenceRadiusMeters: 1800,
    geofencePolygon: createGeofenceBox(1.4043, 103.793, 1800),
    verified: true,
    truthRating: 0,
    totalReports: 0,
    confirmedCorrelations: 0,
    falseAlarms: 0,
    createdAt: '2026-01-12T00:00:00.000Z',
    contactEmail: 'admin@mandai.sg',
  },
  {
    id: 'zoo-berlin-03',
    identifier: 'ZOO-BER-003',
    name: 'Zoologischer Garten Berlin',
    country: 'Germany',
    city: 'Berlin',
    latitude: 52.5079,
    longitude: 13.3378,
    geofenceRadiusMeters: 1200,
    geofencePolygon: createGeofenceBox(52.5079, 13.3378, 1200),
    verified: true,
    truthRating: 0,
    totalReports: 0,
    confirmedCorrelations: 0,
    falseAlarms: 0,
    createdAt: '2026-01-15T00:00:00.000Z',
    contactEmail: 'admin@zoo-berlin.de',
  },
  {
    id: 'zoo-tokyo-04',
    identifier: 'ZOO-TKO-004',
    name: 'Tokyo Ueno Zoological Gardens',
    country: 'Japan',
    city: 'Tokyo',
    latitude: 35.7165,
    longitude: 139.7712,
    geofenceRadiusMeters: 1400,
    geofencePolygon: createGeofenceBox(35.7165, 139.7712, 1400),
    verified: true,
    truthRating: 0,
    totalReports: 0,
    confirmedCorrelations: 0,
    falseAlarms: 0,
    createdAt: '2026-01-20T00:00:00.000Z',
    contactEmail: 'admin@ueno-zoo.jp',
  },
  {
    id: 'zoo-syd-05',
    identifier: 'ZOO-SYD-005',
    name: 'Taronga Conservation Society Australia',
    country: 'Australia',
    city: 'Sydney',
    latitude: -33.8433,
    longitude: 151.2413,
    geofenceRadiusMeters: 1600,
    geofencePolygon: createGeofenceBox(-33.8433, 151.2413, 1600),
    verified: true,
    truthRating: 0,
    totalReports: 0,
    confirmedCorrelations: 0,
    falseAlarms: 0,
    createdAt: '2026-01-22T00:00:00.000Z',
    contactEmail: 'admin@taronga.org.au',
  },
];

function getInitialDatabase(): DatabaseSchema {
  const salt = 'sentinel-fixed-salt-2026';

  // Seed default institutional admin and master authority accounts
  // Note: NO FAKE OBSERVATIONS OR ALERTS. Observations and alerts are strictly empty arrays!
  const adminUser: User = {
    id: 'user-admin-sd',
    email: 'admin@sandiegozoo.org',
    role: 'ZOO_ADMIN',
    fullName: 'Dr. Evelyn Martinez (Director)',
    zooId: 'zoo-sd-01',
    createdAt: '2026-01-10T00:00:00.000Z',
  };

  const masterAdmin: User = {
    id: 'user-master-01',
    email: 'authority@zoosentinel.int',
    role: 'MASTER_ADMIN',
    fullName: 'Global Sentinel Master Controller',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const credentials: Record<string, { passwordHash: string; salt: string }> = {
    'user-admin-sd': {
      passwordHash: hashPassword('SentinelAdmin2026!', salt),
      salt,
    },
    'user-master-01': {
      passwordHash: hashPassword('MasterSentinel2026!', salt),
      salt,
    },
  };

  const truthRatings: TruthRatingData[] = INITIAL_ZOOS.map((zoo) => ({
    zooId: zoo.id,
    zooName: zoo.name,
    truthRating: zoo.truthRating,
    totalReports: 0,
    confirmedCorrelations: 0,
    falseAlarmRate: 0,
    hasEnoughHistory: false, // Per prompt: "Not enough verified history yet"
    history: [],
  }));

  return {
    users: [adminUser, masterAdmin],
    zoos: INITIAL_ZOOS,
    zookeepers: [],
    accessCodes: [],
    observations: [], // ABSOLUTELY ZERO FAKE OBSERVATIONS
    riskAnalyses: [], // ZERO FAKE RISK
    alerts: [], // ZERO FAKE ALERTS
    auditLogs: [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorRole: 'SYSTEM',
        actorId: 'system-init',
        actorName: 'Zoo Sentinel Engine',
        action: 'SYSTEM_BOOT',
        details: 'Zoo Sentinel Production Database initialized with 5 verified institutional registries. Zero prior observations.',
      },
    ],
    truthRatings,
    credentials,
  };
}

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[DB] Failed to load DB file, reinitializing default:', err);
    }
    const initial = getInitialDatabase();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to write database file:', err);
    }
  }

  // --- Auth & Users ---
  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  verifyUserPassword(userId: string, passwordAttempt: string): boolean {
    const cred = this.data.credentials[userId];
    if (!cred) return false;
    const attemptHash = hashPassword(passwordAttempt, cred.salt);
    return attemptHash === cred.passwordHash;
  }

  createUser(
    user: Omit<User, 'id' | 'createdAt'>,
    password?: string
  ): User {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);

    if (password) {
      const salt = crypto.randomBytes(16).toString('hex');
      this.data.credentials[id] = {
        passwordHash: hashPassword(password, salt),
        salt,
      };
    }

    this.save();
    return newUser;
  }

  updateUserLocation(userId: string, lat: number, lng: number, permission = true) {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.latitude = lat;
      user.longitude = lng;
      user.locationPermission = permission;
      this.save();
    }
  }

  // --- Zoos & Institutional Verification ---
  getZoos(): Zoo[] {
    return this.data.zoos;
  }

  getZooById(id: string): Zoo | undefined {
    return this.data.zoos.find((z) => z.id === id);
  }

  getZooByIdentifier(identifier: string): Zoo | undefined {
    return this.data.zoos.find(
      (z) => z.identifier.toLowerCase() === identifier.trim().toLowerCase()
    );
  }

  addZoo(zoo: Omit<Zoo, 'id' | 'createdAt'>): Zoo {
    const id = `zoo-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newZoo: Zoo = {
      ...zoo,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.zoos.push(newZoo);
    this.save();
    return newZoo;
  }

  updateZooGeofence(
    zooId: string,
    polygon: [number, number][],
    centerLat?: number,
    centerLng?: number,
    radiusMeters?: number
  ): Zoo | undefined {
    const zoo = this.data.zoos.find((z) => z.id === zooId);
    if (!zoo) return undefined;

    zoo.geofencePolygon = polygon;
    if (centerLat !== undefined && centerLng !== undefined) {
      zoo.latitude = centerLat;
      zoo.longitude = centerLng;
    }
    if (radiusMeters !== undefined) {
      zoo.geofenceRadiusMeters = radiusMeters;
    }
    this.save();
    return zoo;
  }

  updateZooVerification(zooId: string, verified: boolean): Zoo | undefined {
    const zoo = this.data.zoos.find((z) => z.id === zooId);
    if (zoo) {
      zoo.verified = verified;
      this.save();
    }
    return zoo;
  }

  // --- Zookeepers & Access Codes ---
  getAllZookeepers(): Zookeeper[] {
    return this.data.zookeepers || [];
  }

  getZookeepersByZoo(zooId: string): Zookeeper[] {
    return this.data.zookeepers.filter((zk) => zk.zooId === zooId);
  }

  getZookeeperById(id: string): Zookeeper | undefined {
    return this.data.zookeepers.find((zk) => zk.id === id);
  }

  getZookeeperByBadgeOrEmail(zooId: string, identifier: string): Zookeeper | undefined {
    const term = identifier.trim().toLowerCase();
    return this.data.zookeepers.find(
      (zk) =>
        zk.zooId === zooId &&
        (zk.badgeNumber.toLowerCase() === term || zk.email.toLowerCase() === term)
    );
  }

  createZookeeper(
    zooId: string,
    fullName: string,
    badgeNumber: string,
    email: string
  ): { zookeeper: Zookeeper; rawAccessCode: string } {
    const zookeeperId = `zk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const rawAccessCode = `ZS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const codeHash = hashCode(rawAccessCode);

    const newZk: Zookeeper = {
      id: zookeeperId,
      zooId,
      fullName,
      badgeNumber,
      email,
      active: true,
      createdAt: new Date().toISOString(),
      hasActiveAccessCode: true,
    };

    const newCode: StoredAccessCode = {
      id: `code-${Date.now()}`,
      zooId,
      zookeeperId,
      codeHash,
      active: true,
      createdAt: new Date().toISOString(),
    };

    this.data.zookeepers.push(newk(newZk));
    this.data.accessCodes.push(newCode);

    // Also register user entry for zookeeper so auth recognizes them
    this.data.users.push({
      id: zookeeperId,
      email,
      role: 'ZOOKEEPER',
      fullName,
      zooId,
      createdAt: new Date().toISOString(),
    });

    this.save();
    return { zookeeper: newZk, rawAccessCode };
  }

  revokeAccessCode(zookeeperId: string): boolean {
    const code = this.data.accessCodes.find((c) => c.zookeeperId === zookeeperId && c.active);
    const zk = this.data.zookeepers.find((z) => z.id === zookeeperId);
    if (code) {
      code.active = false;
      code.revokedAt = new Date().toISOString();
    }
    if (zk) {
      zk.hasActiveAccessCode = false;
      zk.active = false;
    }
    this.save();
    return true;
  }

  regenerateAccessCode(zooId: string, zookeeperId: string): string {
    // Revoke existing
    for (const c of this.data.accessCodes) {
      if (c.zookeeperId === zookeeperId && c.active) {
        c.active = false;
        c.revokedAt = new Date().toISOString();
      }
    }

    const rawAccessCode = `ZS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const codeHash = hashCode(rawAccessCode);

    this.data.accessCodes.push({
      id: `code-${Date.now()}`,
      zooId,
      zookeeperId,
      codeHash,
      active: true,
      createdAt: new Date().toISOString(),
    });

    const zk = this.data.zookeepers.find((z) => z.id === zookeeperId);
    if (zk) {
      zk.active = true;
      zk.hasActiveAccessCode = true;
    }

    this.save();
    return rawAccessCode;
  }

  verifyZookeeperAccessCode(
    zooId: string,
    zookeeperIdentifier: string,
    rawCodeAttempt: string
  ): { valid: boolean; zookeeper?: Zookeeper; reason?: string } {
    const zoo = this.getZooById(zooId);
    if (!zoo || !zoo.verified) {
      return { valid: false, reason: 'Institution does not exist or is not verified.' };
    }

    const zk = this.getZookeeperByBadgeOrEmail(zooId, zookeeperIdentifier);
    if (!zk) {
      return { valid: false, reason: 'Zookeeper identity not found for this institution.' };
    }

    if (!zk.active) {
      return { valid: false, reason: 'Zookeeper account is currently deactivated.' };
    }

    const attemptHash = hashCode(rawCodeAttempt);
    const codeRecord = this.data.accessCodes.find(
      (c) => c.zookeeperId === zk.id && c.zooId === zooId && c.active && c.codeHash === attemptHash
    );

    if (!codeRecord) {
      return { valid: false, reason: 'Invalid or revoked Zoo Access Code.' };
    }

    // Check expiration if any
    if (codeRecord.expiresAt && new Date(codeRecord.expiresAt).getTime() < Date.now()) {
      return { valid: false, reason: 'Zoo Access Code has expired.' };
    }

    zk.lastActiveAt = new Date().toISOString();
    this.save();

    return { valid: true, zookeeper: zk };
  }

  // --- Observations ---
  getObservations(limit = 100): Observation[] {
    return [...this.data.observations]
      .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime())
      .slice(0, limit);
  }

  getObservationsByZoo(zooId: string): Observation[] {
    return this.data.observations.filter((o) => o.zooId === zooId);
  }

  addObservation(obs: Omit<Observation, 'id' | 'createdAt'>): Observation {
    const id = `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newObs: Observation = {
      ...obs,
      id,
      createdAt: new Date().toISOString(),
    };

    this.data.observations.unshift(newObs);

    // Update zoo report count
    const zoo = this.data.zoos.find((z) => z.id === obs.zooId);
    if (zoo && obs.verificationStatus === 'VERIFIED_IN_GEOFENCE') {
      zoo.totalReports += 1;
    }

    this.save();
    return newObs;
  }

  // --- Risk Analyses & Alerts ---
  getLatestRiskAnalysis(): RiskAnalysis | null {
    if (this.data.riskAnalyses.length === 0) return null;
    return this.data.riskAnalyses[0];
  }

  saveRiskAnalysis(analysis: RiskAnalysis) {
    this.data.riskAnalyses.unshift(analysis);
    if (this.data.riskAnalyses.length > 50) {
      this.data.riskAnalyses.pop();
    }
    this.save();
  }

  getAlerts(limit = 50): Alert[] {
    return this.data.alerts.slice(0, limit);
  }

  addAlert(alert: Alert) {
    this.data.alerts.unshift(alert);
    if (this.data.alerts.length > 50) {
      this.data.alerts.pop();
    }
    this.save();
  }

  // --- Citizens & Geo Query ---
  getCitizensWithLocation(): User[] {
    return this.data.users.filter(
      (u) =>
        u.role === 'CITIZEN' &&
        u.locationPermission &&
        u.latitude !== undefined &&
        u.longitude !== undefined &&
        Boolean(u.phoneNumber)
    );
  }

  // --- Truth Ratings ---
  getTruthRatings(): TruthRatingData[] {
    return this.data.truthRatings;
  }

  recordTruthCorrelation(
    zooId: string,
    outcome: 'CORRELATED' | 'UNVERIFIED' | 'FALSE_ALARM',
    notes: string,
    eventType: string
  ) {
    let tr = this.data.truthRatings.find((t) => t.zooId === zooId);
    const zoo = this.data.zoos.find((z) => z.id === zooId);
    if (!tr && zoo) {
      tr = {
        zooId: zoo.id,
        zooName: zoo.name,
        truthRating: 85,
        totalReports: zoo.totalReports,
        confirmedCorrelations: 0,
        falseAlarmRate: 0,
        hasEnoughHistory: false,
        history: [],
      };
      this.data.truthRatings.push(tr);
    }

    if (tr && zoo) {
      tr.history.unshift({
        id: `trh-${Date.now()}`,
        date: new Date().toISOString(),
        eventType,
        outcome,
        notes,
      });

      if (outcome === 'CORRELATED') {
        tr.confirmedCorrelations += 1;
        zoo.confirmedCorrelations += 1;
      } else if (outcome === 'FALSE_ALARM') {
        zoo.falseAlarms += 1;
      }

      tr.hasEnoughHistory = tr.history.length >= 3;
      // Formula: base truth rating calibrated by accuracy
      if (tr.history.length > 0) {
        const falseAlarms = tr.history.filter((h) => h.outcome === 'FALSE_ALARM').length;
        tr.falseAlarmRate = Math.round((falseAlarms / tr.history.length) * 100);
        const correlationRate = (tr.confirmedCorrelations / tr.history.length) * 100;
        tr.truthRating = Math.max(50, Math.min(99, Math.round(70 + correlationRate * 0.3 - tr.falseAlarmRate * 0.2)));
        zoo.truthRating = tr.truthRating;
      }

      this.save();
    }
  }

  // --- Audit Logs ---
  getAuditLogs(limit = 100): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  logAudit(
    actorRole: string,
    actorId: string,
    actorName: string,
    action: string,
    details: string,
    ipAddress?: string
  ) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorRole,
      actorId,
      actorName,
      action,
      details,
      ipAddress,
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 300) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  resetCleanDatabase(): DatabaseSchema {
    const clean = getInitialDatabase();
    this.data = clean;
    this.save(clean);
    return clean;
  }
}

function newk(z: Zookeeper): Zookeeper {
  return { ...z };
}

export const db = new DatabaseService();
