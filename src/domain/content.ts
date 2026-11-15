// Explanations and citations. Text only; no thresholds live here.

import type { IndicatorId, RegionId } from './types';

export interface Source { id: string; label: string; detail: string; url: string; nasa?: boolean }

export const SOURCES: Record<string, Source> = {
  hazards: { id: 'hazards', nasa: true, label: 'NASA HRP: 5 Hazards of Human Spaceflight', detail: 'Challenge resource. Radiation, isolation and confinement, distance from Earth, gravity fields, hostile closed environments.', url: 'https://www.nasa.gov/hrp/hazards/' },
  risks: { id: 'risks', nasa: true, label: 'NASA HRP: Risks of Human Spaceflight', detail: 'Challenge resource. The risk list this app’s explanations point to.', url: 'https://www.nasa.gov/hrp/risks/' },
  sleepRisk: { id: 'sleepRisk', nasa: true, label: 'NASA HRP: Risk from Inadequate Sleep and Irregular Schedules', detail: 'Stressors and countermeasures: lighting, caffeine timing, relaxation time.', url: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/' },
  dev2024: { id: 'dev2024', nasa: true, label: 'Dev et al. 2024, Frontiers in Physiology', detail: 'Cognition in 25 ISS astronauts, NASA HRP Standard Measures. Pre-flight PVT Speed (10 − reciprocal of response time): mean 5.25, SD 0.24, N = 24; low score at z ≤ −1.5, about 6.4 h in-flight sleep.', url: 'https://doi.org/10.3389/fphys.2024.1451269' },
  basner2011: { id: 'basner2011', label: 'Basner, Mollicone & Dinges 2011, Acta Astronautica', detail: 'PVT-B, a 3-minute PVT with a 355 ms lapse threshold. Validated on Earth sleep-loss studies.', url: 'https://doi.org/10.1016/j.actaastro.2011.07.015' },
  basner2015: { id: 'basner2015', nasa: true, label: 'Basner et al. 2015, Aerospace Medicine and Human Performance', detail: 'The Cognition battery NASA uses with ISS crews includes the PVT.', url: 'https://doi.org/10.3357/AMHP.4343.2015' },
  chua2012: { id: 'chua2012', label: 'Chua et al. 2012, Sleep', detail: 'HRV tracked vigilance lapses during sleep deprivation. Lab study, healthy men.', url: 'https://doi.org/10.5665/sleep.1688' },
  fritsch1996: { id: 'fritsch1996', nasa: true, label: 'Fritsch-Yelle et al. 1996, Journal of Applied Physiology', detail: 'NASA JSC. Heart rate, diastolic pressure and their variability fall in flight. Short Shuttle flights.', url: 'https://doi.org/10.1152/jappl.1996.80.3.910' },
  dijk2001: { id: 'dijk2001', nasa: true, label: 'Dijk et al. 2001, Am J Physiol Regul Integr Comp Physiol', detail: 'About 6.5 h sleep on two Shuttle flights, with measured performance drops. 5 astronauts.', url: 'https://doi.org/10.1152/ajpregu.2001.281.5.r1647' },
  akerstedt1990: { id: 'akerstedt1990', label: 'Åkerstedt & Gillberg 1990, International Journal of Neuroscience', detail: 'Karolinska Sleepiness Scale, 1 to 9.', url: 'https://doi.org/10.3109/00207459008994241' },
  can2019: { id: 'can2019', label: 'Can, Arnrich & Ersoy 2019, Journal of Biomedical Informatics', detail: 'Daytime stress detection from wearables is unreliable, so HRV is read during sleep.', url: 'https://doi.org/10.1016/j.jbi.2019.103139' },
  zambotti2019: { id: 'zambotti2019', label: 'de Zambotti et al. 2019, Behavioral Sleep Medicine', detail: 'Wearable sleep duration agrees with lab polysomnography; sleep stages do not. Hours only.', url: 'https://doi.org/10.1080/15402002.2017.1300587' },
  stahn2017: { id: 'stahn2017', label: 'Stahn et al. 2017, Scientific Reports', detail: 'Core body temperature rose gradually during long ISS missions.', url: 'https://doi.org/10.1038/s41598-017-15560-w' },
  hughson2016: { id: 'hughson2016', label: 'Hughson et al. 2016, Am J Physiol Heart Circ Physiol', detail: 'Signs of insulin resistance in flight on 6-month ISS missions. Small sample.', url: 'https://doi.org/10.1152/ajpheart.00802.2015' },
  mmash: { id: 'mmash', label: 'MMASH v1.0.0, PhysioNet (Rossi et al. 2020)', detail: 'Beat-to-beat heart intervals and wrist actigraphy, 22 healthy men, 24 h each, on Earth. ODbL v1.0. Not astronaut data.', url: 'https://doi.org/10.13026/cerq-fc86' },
};

export interface IndicatorInfo {
  name: string;
  short: string;
  unit: string;
  region: RegionId;
  /** How the value gets in, and what effort it costs. */
  how: string;
  /** Why it matters on a mission. Plain words. */
  why: string;
  /** What the app does not claim. */
  limit: string;
  sources: string[];
  /** Fixed chart scale, when a full scale is more honest than a cropped one. */
  scale?: [number, number];
}

export const INFO: Record<IndicatorId, IndicatorInfo> = {
  sleep: {
    name: 'Sleep duration', short: 'Sleep', unit: 'h min', region: 'head',
    how: 'Recorded by a wrist activity tracker. No effort. You confirm it with one tap.',
    why: 'Crews sleep about 6.4 h a night in flight, less than on Earth. Sleep loss slows reactions and attention. NASA lists it as a mission risk.',
    limit: 'Hours only. Wearables do not measure sleep stages reliably, so none are shown.',
    sources: ['sleepRisk', 'dev2024', 'dijk2001', 'zambotti2019'], scale: [0, 480],
  },
  hrv: {
    name: 'Heart rate variability', short: 'HRV', unit: 'ms', region: 'chest',
    how: 'RMSSD of beat-to-beat intervals from a chest strap, taken only while you sleep. No effort.',
    why: 'A drop below your own usual level can go with fatigue or poor recovery. In sleep-loss studies it tracked slower reactions.',
    limit: 'Compared only with your own in-flight nights. HRV normally falls in microgravity. One low night is not a diagnosis.',
    sources: ['chua2012', 'can2019', 'fritsch1996'],
  },
  heartRate: {
    name: 'Sleeping heart rate', short: 'Heart rate', unit: 'bpm', region: 'chest',
    how: 'Mean heart rate over the sleep window, from the same chest strap. No effort.',
    why: 'In microgravity, body fluid shifts toward the head and the heart works against less gravity. Heart rate runs lower than on Earth. That is a normal adaptation.',
    limit: 'Compared only with your own in-flight nights. No rhythm analysis is done.',
    sources: ['fritsch1996', 'hazards'],
  },
  sleepiness: {
    name: 'Sleepiness', short: 'Sleepiness', unit: 'of 9', region: 'head',
    how: 'One tap in the daily check-in. Karolinska Sleepiness Scale: 1 is extremely alert, 9 is fighting sleep.',
    why: 'It is the fastest fatigue signal there is. But in ISS crews, self-ratings did not predict test scores, so a high rating leads to a measured check.',
    limit: 'A self-rating. It starts a check; it does not decide the result.',
    sources: ['akerstedt1990', 'dev2024'],
  },
  mood: {
    name: 'Mood', short: 'Mood', unit: 'of 5', region: 'head',
    how: 'One tap in the daily check-in. 1 is very low, 5 is very good.',
    why: 'Isolation and confinement are one of NASA’s five hazards. A record of your own mood lets you and your flight surgeon see a change early.',
    limit: 'No rule uses mood alone. It is shown as your own trend.',
    sources: ['hazards', 'risks'],
  },
  alertness: {
    name: 'Alertness check', short: 'Alertness', unit: 'speed', region: 'head',
    how: 'A 3-minute reaction test on this tablet. Run only when a sign of fatigue appears, or before a critical task.',
    why: 'Sustained attention was among the scores that most often dropped in flight. The same test type is part of NASA’s Cognition battery.',
    limit: 'A screening result, not a fitness-for-duty decision. Tablet timing is not benchmarked.',
    sources: ['dev2024', 'basner2011', 'basner2015'],
  },
  bloodPressure: {
    name: 'Blood pressure', short: 'Blood pressure', unit: 'mmHg', region: 'chest',
    how: 'Cuff reading, typed in. About 15 seconds. Asked weekly, or early if your heart rate is flagged.',
    why: 'Diastolic pressure falls in flight as fluid shifts headward. Your own trend matters more than an Earth clinic cut-off.',
    limit: 'This prototype does not interpret blood pressure. Earth clinic cut-offs are not applied, because pressure changes in microgravity and no validated in-flight rule is used here.',
    sources: ['fritsch1996', 'hazards'],
  },
  bloodSugar: {
    name: 'Blood sugar', short: 'Blood sugar', unit: 'mg/dL', region: 'abdomen',
    how: 'Finger-stick reading, typed in. About 15 seconds. Asked together with blood pressure.',
    why: 'Six-month ISS crews showed signs of insulin resistance in flight. A fasting reading is a simple way to notice a shift.',
    limit: 'The 65-99 mg/dL range is an Earth lab range for fasting readings. One reading outside it asks for a re-check, not an alert.',
    sources: ['hughson2016', 'risks'],
  },
  temperature: {
    name: 'Body temperature', short: 'Temperature', unit: '°C', region: 'whole',
    how: 'Thermometer reading, typed in. About 10 seconds. Asked only when you report a symptom.',
    why: 'Immune function changes in flight and the cabin is closed, so an infection matters. Resting core temperature also rises slowly on long missions.',
    limit: 'Measurement method and context affect temperature interpretation. This prototype uses a demonstration threshold; one entry is not a diagnosis.',
    sources: ['stahn2017', 'hazards'],
  },
};

export interface RegionInfo { name: string; system: string; fn: string; inSpace: string; sources: string[] }

export const REGIONS: Record<RegionId, RegionInfo> = {
  head: {
    name: 'Head', system: 'Brain, sleep and behavior',
    fn: 'Attention, reaction speed, sleep and mood are regulated here.',
    inSpace: 'Irregular light, noise and workload disrupt sleep. Isolation and confinement load mood and attention.',
    sources: ['sleepRisk', 'hazards'],
  },
  chest: {
    name: 'Chest', system: 'Heart and circulation',
    fn: 'The heart moves blood and oxygen. Its rate and beat-to-beat variation reflect load and recovery.',
    inSpace: 'Microgravity shifts fluid toward the head and changes cardiovascular regulation. A short-duration Shuttle study reported lower heart rate and diastolic pressure during flight.',
    sources: ['fritsch1996', 'hazards'],
  },
  abdomen: {
    name: 'Abdomen', system: 'Metabolism and nutrition',
    fn: 'The pancreas and liver keep blood sugar steady between meals.',
    inSpace: 'Long ISS missions showed signs of insulin resistance. Nutrition is a listed mission risk.',
    sources: ['hughson2016', 'risks'],
  },
  limbs: {
    name: 'Arms and legs', system: 'Muscle and bone',
    fn: 'Weight-bearing bones and muscles carry and move the body.',
    inSpace: 'Reduced mechanical loading can lead to bone and muscle loss. Exercise is used as a countermeasure.',
    sources: ['hazards'],
  },
  whole: {
    name: 'Whole body', system: 'Temperature and immune defence',
    fn: 'Core temperature is held near 37 °C. A rise can signal infection.',
    inSpace: 'Immune function changes in flight, and resting core temperature rises slowly on long missions.',
    sources: ['stahn2017', 'hazards'],
  },
};

export const KSS = ['', 'Extremely alert', 'Very alert', 'Alert', 'Rather alert', 'Neither alert nor sleepy',
  'Some signs of sleepiness', 'Sleepy, but no effort to keep awake', 'Sleepy, some effort to keep awake',
  'Very sleepy, great effort to keep awake'];
export const MOOD = ['', 'Very low', 'Low', 'Neutral', 'Good', 'Very good'];
export const SYMPTOMS = ['Headache', 'Nausea', 'Dizziness', 'Congestion', 'Pain', 'Feverish', 'Other'];
