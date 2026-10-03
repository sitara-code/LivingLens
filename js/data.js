import {
  getObservations as fetchObservations,
  getZooKeepers as fetchZooKeepers,
  addObservation as createObservation,
  predictHazard as fetchPrediction,
  sendEmergencyEmail as triggerEmergencyEmail,
  checkBackendHealth,
  addZooKeeper as addKeeperToBackend,
  keeperLogin,
  citizenLogin,
  citizenRegister,
  adminLogin
} from './api.js';

export const ZOOS = [
  { id: 'ZOO-LON-01', name: 'Metropolitan City Zoological Gardens' },
  { id: 'ZOO-SGP-02', name: 'Central Wildlife Conservation Park' },
  { id: 'ZOO-SDG-03', name: 'Highland Biosphere & Safari Sanctuary' },
  { id: 'ZOO-BER-04', name: 'Riverside Zoological Park' }
];

export const ZOO_ALERTS = [
  {
    animal: 'Giraffe',
    observedBehaviour: 'Repeated directional movement and agitation',
    hazardLikelihood: '81%',
    dateTime: '02 Oct 2026, 09:10 PM',
    advisory: 'Elevated environmental anomaly detected. Continue monitoring the enclosure and follow zoo safety procedures.'
  },
  {
    animal: 'Elephant',
    observedBehaviour: 'Sudden freeze and vocal agitation',
    hazardLikelihood: '78%',
    dateTime: '02 Oct 2026, 08:42 PM',
    advisory: 'Increased alertness required near the enclosure perimeter. Maintain visitor distance and observe animal movement.'
  },
  {
    animal: 'Crocodile',
    observedBehaviour: 'Rapid movement and water thrashing',
    hazardLikelihood: '86%',
    dateTime: '02 Oct 2026, 07:55 PM',
    advisory: 'Hazard severity elevated. Restrict public access to the viewing edge and escalate monitoring.'
  }
];

const FALLBACK_ALERTS = [
  {
    id: 'alt-001',
    animal: 'Elephant',
    observedBehaviour: 'Sudden freezing',
    distanceKm: 2.4,
    advisory: 'Stay indoors',
    hazardProbability: 84.12,
    zone: 'North Enclosure',
    updatedAgo: '2 min ago',
    riskLevel: 'high'
  },
  {
    id: 'alt-002',
    animal: 'Crocodile',
    observedBehaviour: 'Thrashing in water',
    distanceKm: 3.1,
    advisory: 'Stay indoors',
    hazardProbability: 78.4,
    zone: 'Reptile House',
    updatedAgo: '9 min ago',
    riskLevel: 'high'
  },
  {
    id: 'alt-003',
    animal: 'Giraffe',
    observedBehaviour: 'Rushing into a group',
    distanceKm: 1.8,
    advisory: 'Stay indoors',
    hazardProbability: 61.25,
    zone: 'Giraffe Paddock',
    updatedAgo: '12 min ago',
    riskLevel: 'medium'
  }
];

export const MAP_ZONES = [
  { id: 'zone-1', name: 'Elephant Enclosure', hazardProbability: 84.12, riskLevel: 'high', lat: 51.5365, lng: -0.1558 },
  { id: 'zone-2', name: 'Big Cats', hazardProbability: 55.9, riskLevel: 'medium', lat: 51.5348, lng: -0.1522 },
  { id: 'zone-3', name: 'Reptile House', hazardProbability: 78.4, riskLevel: 'high', lat: 51.5338, lng: -0.1545 },
  { id: 'zone-4', name: 'Aviary', hazardProbability: 12.3, riskLevel: 'normal', lat: 51.5352, lng: -0.1592 },
  { id: 'zone-5', name: 'Giraffe Paddock', hazardProbability: 48.1, riskLevel: 'medium', lat: 51.5372, lng: -0.151 },
  { id: 'zone-6', name: 'Wetland', hazardProbability: 8.75, riskLevel: 'normal', lat: 51.5328, lng: -0.1578 }
];

function asNumber(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function normalizeObservationForAlert(item, index = 0) {
  const hazardProbability = asNumber(
    item.hazardProbability ?? item.hazard_probability ?? item.hazardProb ?? item.hazard_prob ?? item.risk_score ?? 0,
    0
  );

  return {
    id: item.id || `alert-${index + 1}`,
    animal: item.animal || item.animal_name || 'Animal',
    observedBehaviour: item.observedBehaviour || item.behaviour || 'Behaviour recorded',
    distanceKm: 1.2 + (index % 4) * 0.9,
    advisory: hazardProbability > 70 ? 'Stay indoors' : hazardProbability > 45 ? 'Stay alert' : 'Proceed cautiously',
    hazardProbability,
    zone: item.zone || item.location || 'Zoo Zone',
    updatedAgo: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${(index + 1) * 4} min ago`,
    riskLevel: hazardProbability > 70 ? 'high' : hazardProbability > 45 ? 'medium' : 'normal'
  };
}

function normalizeObservationForZone(item, index = 0) {
  const hazardProbability = asNumber(
    item.hazardProbability ?? item.hazard_probability ?? item.hazardProb ?? item.hazard_prob ?? item.risk_score ?? 0,
    0
  );

  return {
    id: item.id || `zone-${index + 1}`,
    name: item.zone || `${item.animal || 'Animal'} Enclosure`,
    hazardProbability,
    riskLevel: hazardProbability > 70 ? 'high' : hazardProbability > 45 ? 'medium' : 'normal',
    lat: item.latitude ?? MAP_ZONES[index % MAP_ZONES.length].lat,
    lng: item.longitude ?? MAP_ZONES[index % MAP_ZONES.length].lng
  };
}

export async function getZoos() {
  return [...ZOOS];
}

export async function getObservations() {
  return fetchObservations();
}

export async function submitObservation(payload) {
  try {
    return await createObservation(payload);
  } catch (error) {
    console.error('Observation submission failed:', error);
    throw error;
  }
}

export async function getAlerts() {
  try {
    const observations = await getObservations();
    if (!observations.length) return [...FALLBACK_ALERTS];
    return observations.slice(0, 6).map((item, index) => normalizeObservationForAlert(item, index));
  } catch (error) {
    console.error('Failed to load alerts:', error);
    return [...FALLBACK_ALERTS];
  }
}

export async function getMapZones() {
  try {
    const observations = await getObservations();
    if (!observations.length) return [...MAP_ZONES];
    return observations.slice(0, 6).map((item, index) => normalizeObservationForZone(item, index));
  } catch (error) {
    console.error('Failed to load map zones:', error);
    return [...MAP_ZONES];
  }
}

export async function getZooKeepers(zooId) {
  try {
    return await fetchZooKeepers(zooId);
  } catch (error) {
    console.error('Failed to fetch zoo keepers:', error);
    return [];
  }
}

export async function addZooKeeper(payload) {
  try {
    return await addKeeperToBackend(payload);
  } catch (error) {
    console.error('Add zookeeper failed:', error);
    throw error;
  }
}

export async function predictHazard(payload) {
  try {
    return await fetchPrediction(payload);
  } catch (error) {
    console.error('Hazard prediction failed:', error);
    throw error;
  }
}

export async function sendEmergencyEmail() {
  try {
    return await triggerEmergencyEmail();
  } catch (error) {
    console.error('Emergency email request failed:', error);
    throw error;
  }
}

export async function backendIsReachable() {
  return checkBackendHealth().then(() => true).catch(() => false);
}

export async function loginKeeper(payload) {
  return keeperLogin(payload);
}

export async function loginCitizen(payload) {
  return citizenLogin(payload);
}

export async function registerCitizen(payload) {
  return citizenRegister(payload);
}

export async function loginAdmin(payload) {
  return adminLogin(payload);
}

export function getZooAlerts() {
  return [...ZOO_ALERTS];
}
