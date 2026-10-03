const DEFAULT_API_BASE_URL = 'https://zoo-sentinel-server.onrender.com';

export const API_BASE_URL = (() => {
  const envBase = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : '';
  const base = (import.meta.env?.DEV || import.meta.env?.PROD ? '/api' : envBase || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  return base || DEFAULT_API_BASE_URL;
})();

function normalizeErrorMessage(payload, fallback) {
  if (!payload) return fallback;

  if (typeof payload === 'string') return payload;
  if (payload.detail) {
    if (typeof payload.detail === 'string') return payload.detail;
    if (Array.isArray(payload.detail)) {
      const first = payload.detail[0];
      const field = first?.loc?.[first.loc.length - 1];
      if (first?.msg === 'Field required' && field) return `${field} is required`;
      return first?.msg || first?.message || fallback;
    }
  }

  return payload.message || payload.error || payload.error_message || fallback;
}

async function requestJson(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();

  if (!(options.body instanceof FormData) && options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store'
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = normalizeErrorMessage(payload, `Request failed (${response.status})`);
    throw new Error(message);
  }

  return payload;
}

function asNumber(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function valueOr(...candidates) {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== '') return candidate;
  }
  return undefined;
}

export function normalizeObservation(item = {}) {
  const rawHazardProbability = valueOr(
    item.hazard_probability,
    item.hazardProbability,
    item.probability,
    item.hazard_prob,
    item.risk_score
  );
  const hazardProbability = rawHazardProbability === undefined
    ? null
    : asNumber(rawHazardProbability, null);

  return {
    id: valueOr(item.id, item._id, `obs-${Date.now()}-${Math.random()}`),
    keeper_id: valueOr(item.keeper_id, item.keeperId),
    zoo_id: valueOr(item.zoo_id, item.zooId),
    animal: valueOr(item.animal_name, item.animal, item.animalName, 'Unknown animal'),
    observedBehaviour: valueOr(item.behaviour, item.observed_behaviour, item.observedBehaviour, 'No behaviour recorded'),
    abnormalityPercentage: asNumber(
      valueOr(item.animal_percentage, item.abnormality_percentage, item.abnormalityPercentage, item.animalPercentage, 0),
      0
    ),
    intensity: valueOr(item.intensity, '5 - Moderate'),
    durationMinutes: asNumber(
      valueOr(item.duration, item.duration_minutes, item.durationMinutes, 0),
      0
    ),
    hazardProbability,
    createdAt: valueOr(item.created_at, item.createdAt, new Date().toISOString())
  };
}

export function normalizeKeeper(item = {}) {
  return {
    id: valueOr(item.id, item.keeper_id, item.keeperId, item.username, 'unknown'),
    username: valueOr(item.username, item.name, 'unknown'),
    keeper_id: valueOr(item.keeper_id, item.keeperId, item.id, 'unknown'),
    zoo_id: valueOr(item.zoo_id, item.zooId, 'unknown'),
    name: valueOr(item.name, item.username, item.keeper_id, 'Unknown Keeper')
  };
}

export async function checkBackendHealth() {
  return requestJson('/');
}

export async function getObservations() {
  const payload = await requestJson('/observations');
  const list = Array.isArray(payload) ? payload : payload?.observations || payload?.data || [];
  return list.map(normalizeObservation);
}

export async function getZooKeepers(zooId) {
  if (!zooId) return [];
  const payload = await requestJson(`/zoo_keepers?zoo_id=${encodeURIComponent(zooId)}`);
  const list = Array.isArray(payload) ? payload : payload?.keepers || payload?.data || [];
  return list.map(normalizeKeeper);
}

export async function keeperLogin(payload) {
  return requestJson('/keeper_login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function addObservation(payload) {
  return requestJson('/add_observation', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function predictHazard(payload) {
  return requestJson('/predict', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function citizenRegister(payload) {
  return requestJson('/citizen_register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function citizenLogin(payload) {
  return requestJson('/citizen_login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function adminLogin(payload) {
  return requestJson('/admin_login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function addZooKeeper(payload) {
  return requestJson('/add_zoo_keeper', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function sendEmergencyEmail() {
  return requestJson('/sendEmail');
}

export async function getHealthStatus() {
  try {
    await checkBackendHealth();
    return true;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
