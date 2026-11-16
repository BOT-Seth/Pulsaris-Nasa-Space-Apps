# Research Notes

Background behind the mechanics in [MINIGAME.md](MINIGAME.md). Check claims against the sources before the demo or pitch.

**Source rule:** only peer-reviewed, published sources (journals, plus clearly labeled peer-reviewed conference papers) and official agency data repositories (NASA OSDR, PhysioNet). No blogs, vendor pages or unreviewed preprints.

## The challenge (summary)
Source: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/ (Intermediate; Human Exploration, Software, Space Exploration)

- **Goal:** a visual tool that helps astronauts assess their own health during missions and gives guidance on treatment and improvement.
- **Why:** On long missions (Artemis, and Mars later), astronauts have to spot health changes in themselves. NASA HRP's 5 hazards: radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments.
- **Example indicators named:** blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, mood.
- **Questions to address:** Which measurements can be done in space? Why is an exam needed? How do the hazards affect the indicators? When should a result go to the crew or ground flight surgeons? What actions prevent a critical condition?
- **Optional features suggested:** prompts to take measurements or do actions as part of the routine, **gamification**, dynamic trend charts, **color coding**, and simple explanations (don't assume astronauts are health experts). It could also cover different settings: spacecraft, station, rover, or a lunar/planetary base.

### Challenge resources (Resources tab)
- NASA HRP: *5 Hazards of Human Spaceflight*
- NASA HRP: *Risks of Human Spaceflight*
- NASA HRP: *Ongoing HRP Research in Space*
- CSA: *Monitoring Radiation for Astronaut Health*
- CSA: *Why Do We Conduct Science Experiments in Space?*

## How the minigame maps to the challenge
| Challenge ask | Minigame answer |
|---|---|
| Measurements performed in space | 3-min PVT on a tablet; HRV from a wearable; self-rated sleepiness |
| When does a result need attention | Bands vs. personal baseline; escalation to crew medical officer / flight surgeon |
| Actions to prevent a critical condition | Paced breathing; fatigue countermeasures; putting off critical tasks |
| Gamification | Completion-based streaks and badges |
| Color coding | Green / yellow / red bands (+ icon + label) |
| Simple explanations | Plain-language result and countermeasure text |

## NASA OSDR findings (challenge data source)
Source: NASA Open Science Data Repository, filtered to GeneLab (`cgene`), ALSDA (`alsda`) and ESA (`esa`) studies.
https://osdr.nasa.gov/bio/repo/search?q=&data_source=cgene,alsda,esa&data_type=study

Searched 2026-11-14 for: sleep, HRV / heart rate variability, ECG, heart rate, cognition, psychomotor vigilance, reaction time, fatigue, circadian, attention, memory, mood, stress, isolation, bed rest, astronaut/crew, Inspiration4, Twins, and more.

### Bottom line
- **No human HRV, sleep, or cognitive-test data** in these three sources. Nearly everything is omics (gene/protein) or rodent behavior. The ESA source has 35 studies, none behavioral, cognitive, or cardiac-rhythm.
- So **HRV and sleep data for the demo stay simulated**, or come from a non-OSDR source if the team wants real recordings.
- What OSDR *does* give us is **space-specific evidence** that the minigame measures the right things, plus a few metric ideas.

### Studies worth using
| Study | What it is | Data files | How it helps the minigame |
|---|---|---|---|
| **OSD-939** (ALSDA): Davis et al. 2015, PLoS ONE, doi:10.1371/journal.pone.0144556 | **Rat version of the PVT (rPVT)** after head-only proton radiation (25 or 100 cGy), two rat strains, tested weekly | `LSDS-167_..._rPVT_TRANSFORMED.csv` (899 rows: per-rat weekly accuracy, premature %, lapse %, median RT, false-alarm %), plus a data dictionary | Strongest link. Shows **space radiation impairs sustained attention**: lower accuracy and **more premature (impulsive) responses**. The effect depended on the strain, so individuals differ. It also defines a **personal lapse = no response or RT > 2× the subject's own median RT**. We borrow this definition (see MINIGAME.md §4.3) |
| **OSD-618** (ALSDA): combined stressors | Mice given simulated cosmic radiation (GCRsim) **plus** social isolation or hindlimb unloading | Transformed CSVs + data dictionaries: novel object recognition, radial arm water maze, open field, elevated plus maze, social approach, balance beam | Radiation + confinement + altered gravity **together** produce behavioral and cognitive deficits. Males were hit harder, and **early blood markers predicted later deficits**. Supports routine trend tracking and per-person baselines |
| **OSD-479** (GeneLab): Krukowski et al. 2021 | Mice after GCRsim; spatial learning, memory, anxiety, social tests | Same assay types as OSD-618 (transformed CSVs + dictionaries) | **Spatial learning / memory** loss after cosmic radiation (males). Supports **Star Sequence** (memory) as a later game |
| **OSD-1018** (ALSDA): Adkins et al. 2023, *Life*, doi:10.3390/life13030826 | Rats: social isolation + space radiation, **sleep-linked "resilient vs. vulnerable" stress types**, balance beam motor learning | `LSDS-185_Balance_Beam_..._TRANSFORMED.csv` + dictionary | Isolation and radiation affect **motor learning** differently, and results differ by stress resilience tied to sleep. Supports **Docking Drift** (sensorimotor) and **personal baselines over population norms** |
| **OSD-569 / 570 / 571 / 575 / 656** (Inspiration4) | The only **human crew** data here: blood, plasma, urine, cytokines (incl. a cardiovascular panel), metabolic panel, pre- and post-flight | Transformed CSVs per panel | Not useful for the minigame (no HRV or cognition). **Main app: glucose from OSD-575 is now used**; see "Human (*Homo sapiens*) studies" below |
| **OSD-195, 198, 51, 370, 942** | Human **bed-rest** studies (a spaceflight analog), muscle gene expression | Omics only | Not useful for the minigame |

### Cautions on using the data
- **Don't feed rat reaction times into human scoring.** Rat nose-poke times (~500 ms medians) aren't comparable to human taps. Use these studies as **evidence and metric definitions**, not as norms.
- Good uses for the pitch and in-app explanations: "NASA-funded research found that space radiation reduced sustained attention in rats and increased impulsive responding (OSD-939). That's why the app checks attention after radiation events."
- In OSD-939, the radiation dose for each sample is in the ISA metadata zip, not the JSON API. Download `OSD-939_metadata_OSD-939-ISA.zip` if we want dose-group charts.

### Human (*Homo sapiens*) studies: full sweep
Checked 2026-11-14: **all 121 OSDR studies tagged *Homo sapiens*** across GeneLab, ALSDA and ESA, plus every file category in the studies that involve real people.

| Group | Count | Examples | Useful to our app? |
|---|---|---|---|
| Human **cells, organoids or tissue** grown in a lab (on the ISS or under simulated conditions) | ~90 | T cells, stem cells, brain organoids, skin models | **No.** These aren't people |
| **Astronaut** samples (ISS, Inspiration4, Axiom-1, JAXA) | ~20 | OSD-53, 174, 316, 353, 359, 481, 483, 530, 569–575, 656, 687, 903, 943 | Almost all are **gene, protein or microbiome data** (RNA-seq, proteomics, epigenetics). **Only OSD-575 (metabolic panel) and OSD-569 (blood count) hold clinical values** |
| **Earth analogs** (bed rest, limb suspension, 14-day confinement, Mars-520) | ~12 | OSD-195, 198, 51, 354, 370, 540, 542, 140, 783, 784, 942, 946 | **No.** Muscle and blood gene expression only |

**None of the 121 has heart rate, HRV, blood pressure, temperature, sleep, mood or cognitive-test data.** This confirms MMASH is still needed for HRV and sleep.

### What we pull: Inspiration4 blood glucose (OSD-575)
**Source:** OSD-575, file `LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv`. Four civilian crew (C001–C004), 3-day orbital mission, September 2021. Serum tested by Quest Diagnostics, a clinical lab. Published as part of SOMA (Overbey et al. 2024, *Nature*, doi:10.1038/s41586-024-07639-y).

| Crew | 92 d before | 44 d before | 3 d before | 1 d after | 45 d after | 82 d after | 194 d after |
|---|---|---|---|---|---|---|---|
| C001 | 83 | 80 | 69 | 90 | 84 | 91 | 87 |
| C002 | 69 | 72 | 78 | 83 | 44 ⚠ | 77 | 84 |
| C003 | 77 | 62 | 75 | 103 | 36 ⚠ | 80 | 73 |
| C004 | 100 | 83 | 56 | 97 | 43 ⚠ | 80 | 84 |

Glucose in mg/dL. **Lab reference range: 65–99 mg/dL** (included in the file).

**Why this helps the app:**
1. **Real crew numbers for the blood-sugar row.** The challenge names blood sugar as an indicator, but no in-flight glucose data exists in OSDR. Pre-flight values from real crew (56–100 mg/dL) replace invented sample numbers in the demo, labeled "Inspiration4 crew, OSD-575."
2. **A credible safe range.** Blood sugar is typed in only when prompted, so it has no personal baseline. The lab's own 65–99 mg/dL range is the starting "OK" band. Outside it means "Watch."
3. **Re-check before alarming.** One crew member's three pre-flight values ran from 56 to 100. Three crew members read 36–44 mg/dL at 45 days after landing, which the dataset doesn't explain (possibly sample handling, but that's unconfirmed; **don't present it as real low blood sugar**). Single readings swing, so a single out-of-range typed value prompts a **15-second re-check** before any alert. That costs less crew time than a false alarm.
4. **Personal variation again.** Each crew member has their own normal level, which supports trends over one-off readings.

**Not used:** the day-after-landing values were higher than pre-flight for all four (83–103), but that's post-flight (out of scope) and only 4 people. Skip OSD-569 (blood counts for anemia) too, since anemia needs lab testing, which is out of scope.

### How to query OSDR (for the team)
- Search NASA sources: `https://osdr.nasa.gov/osdr/data/search?term=<term>&type=cgene` (or `type=alsda`)
- Search ESA source: `https://osdr.nasa.gov/geode-py/ws/repo/search?term=<term>&source=esa&type=study`
- List a study's files: `https://osdr.nasa.gov/osdr/data/osd/files/<number>`
- Study metadata: `https://osdr.nasa.gov/osdr/data/osd/meta/<number>`
- Download a file: `https://osdr.nasa.gov/geode-py/ws/studies/OSD-<number>/download?source=datamanager&file=<file name>`

## Real human HRV data: MMASH (outside OSDR)
Because OSDR has no human HRV or sleep data, this is the recommended real dataset for the demo.

**Multilevel Monitoring of Activity and Sleep in Healthy People (MMASH) v1.0.0**, on PhysioNet
https://physionet.org/content/mmash/1.0.0/ · DOI 10.13026/cerq-fc86 · checked 2026-11-14 (1.0.0 is the current version)

| | |
|---|---|
| Who | 22 healthy young adult **males** (a limitation, see below) |
| Length | 24 h continuous, across 2 calendar days (day 1 → morning of day 2) |
| Heart | Polar H7 chest strap: **beat-to-beat RR intervals** (`RR.csv`: `ibi_s`, `day`, `time`). RMSSD and other HRV measures can be computed from this |
| Sleep | ActiGraph wrist: `sleep.csv` with bed/onset times, **Total Sleep Time (min)**, efficiency, WASO, awakenings, fragmentation |
| Movement | `Actigraph.csv`: per-second acceleration, steps, HR, posture (standing/sitting/lying) |
| Self-report | `questionnaire.csv`: **PSQI** sleep quality, **STAI** anxiety, **Daily Stress Inventory**, **PANAS** mood at 10:00, 14:00, 18:00, 22:00 and 09:00 the next day, plus chronotype (MEQ) and BIS/BAS |
| Daily log | `Activity.csv`: sleeping, sitting, exercise, screens, **caffeine**, alcohol, and so on, with start/end times |
| Biomarkers | `saliva.csv`: cortisol + melatonin before bed and after waking (missing for User_21) |
| Size | 22.7 MB zip (23.5 MB unzipped). Folder per user: `user_1` … `user_22` |
| License | **Open Database License (ODbL) v1.0**: free to use, *must attribute*; a public derived database must stay under ODbL (share-alike) |
| Cite | Rossi A, et al. (2020). MMASH (v1.0.0). PhysioNet. doi:10.13026/cerq-fc86, **and** Rossi A, et al. (2020). A Public Dataset of 24-h Multi-Levels Psycho-Physiological Responses in Young Healthy Adults. *Data* 5(4):91. doi:10.3390/data5040091, **and** the standard PhysioNet citation |

### How the minigame would use it
| MMASH data | Minigame use |
|---|---|
| `RR.csv` → RMSSD in rolling 5-min windows | **Replay as recorded sensor data** in the demo (no live hookup). A real person's heartbeat drives the **low-HRV trigger** |
| Night-time RMSSD (window inside `sleep.csv` onset → out-of-bed) | That person's **rested reference HRV**; daytime windows are compared with it |
| Morning RMSSD on day 2 | The "morning HRV reading" from the trigger table |
| `sleep.csv` Total Sleep Time | **Short-sleep trigger** (< 360 min) with real values |
| PANAS / Daily Stress / STAI | Test whether the **mood tag** and stress branch line up with HRV (e.g., does low RMSSD go with higher stress or negative mood?) |
| `Activity.csv` caffeine events | Realistic context for the **countermeasure card** (caffeine timing vs. sleep) |
| 4 chosen participants | A demo "crew of 4", each with their own real HRV and sleep profile |

### Gaps (say these openly in the pitch)
- **Earth, not space.** Ordinary daily life, no spaceflight stressors.
- **Only 24 h per person.** That's not enough for the 7-day rolling baseline in MINIGAME.md. In the demo, use night-time HRV as the reference instead, and say a real mission would build 7+ days.
- **All young men.** Not representative of a mixed crew.
- **No PVT or other reaction test.** Beacon scores still come from the person playing the demo.
- **No breathing intervention.** It can't show an HRV change from Orbit Breath, so we leave that out (live sensors are excluded).

### Processing notes (for when we build)
- Clean RR before computing HRV: drop intervals outside 0.3–2.0 s and beats that change more than 20% from the previous beat (standard artifact rule), and skip windows with too many drops.
- RMSSD = √(mean of squared differences between consecutive RR intervals), in ms. Log-transform (ln RMSSD) for trend comparisons.
- Times are clock times with `day` = 1 or 2. Combine them into one timeline before windowing.

### Other datasets considered
| Dataset | Why not first choice |
|---|---|
| Apple Watch multi-night sleep dataset (PhysioNet, 47 adults, up to 7 nights) | Heart rate only (~every 5 s), **no beat-to-beat RR**, so true HRV can't be computed. Could be a later source for multi-night sleep trends |
| MIT-BIH Polysomnographic Database (PhysioNet) | Overnight ECG in sleep-apnea patients; would need beat detection; clinical rather than healthy population |
| Sleep Heart Health Study (NSRR / sleepdata.org) | Large and has HRV, but needs a data-use request: too slow for a hackathon |
| Chua et al. 2012, *Sleep* (24 men, 40 h awake, PVT every 2 h + ECG) | **Exactly** PVT + HRV under sleep loss, but no open raw data found. Use the paper's finding (HRV tracked PVT lapses) as evidence, not data |

## NASA Life Sciences Portal (NLSP): cardiovascular experiments
Source: https://nlsp.nasa.gov/explore, filtered to experiments in cardiovascular physiology, ISS + Shuttle programs, human subjects. Searched 2026-11-14 through the portal's own data API.

### What's there
- **106 experiments.** About 60 record heart rate, HRV, ECG or blood pressure.
- **Data access:**

| Archive status | Count |
|---|---|
| All datasets public | 7 |
| Some public, rest by data request | 16 |
| All by data request (privacy-protected) | 25 |
| Data collection ongoing (by request) | 4 |
| Work in progress | 3 |
| No data submitted | 14 |
| International study, data not archived with NASA | 37 |

- **The ISS heart-rhythm and HRV studies are all international** (JAXA Biorhythms and Biological Rhythms 48, ESA Rhythm and Cardiocog-2, Roscosmos Pneumocard and Sonokard). **None archived data with NASA.**
- **The most relevant NASA study (DSO 602 + DSO 463)** has only its test procedures public. The heart and BP recordings need a formal data request, which isn't feasible in a hackathon.

**So NLSP gives us evidence, not demo data.** MMASH stays the demo dataset.

### Findings we use
| Source | Finding (from NLSP results + the published abstract) | Why it helps our app |
|---|---|---|
| **DSO 602 / DSO 463** → Fritsch-Yelle JM, et al. (1996), *J Appl Physiol* 80(3):910–914, doi:10.1152/jappl.1996.80.3.910. 12 Shuttle astronauts, 24-h Holter ECG + automatic BP every 20–30 min, before, during and after 4–14-day flights | In flight, **heart rate, diastolic pressure and the variability of both were significantly reduced**. **Day-night swings were smaller.** Premature ventricular beats also dropped, so **routine flight didn't increase arrhythmias**. The authors conclude microgravity itself isn't a chronic cardiovascular stress | **1. In-flight baselines.** If the app compared in-flight HR, HRV or BP with pre-flight values, every astronaut would look "low" every day. That means false alarms and wasted crew time. Rules now use an in-flight rolling baseline. **2. Plain-language guidance.** "Your heart rate is lower than on Earth; that's a normal adaptation" prevents needless worry. **3. Scope stays tight.** No arrhythmia detection (it needs ECG and isn't an in-flight routine problem). The pre-EVA alertness trigger stays, since past Shuttle EVAs saw rhythm problems (about 40%, per DSO 463) |
| **Dijk DJ, et al. (2001)**, *Am J Physiol Regul Integr Comp Physiol* 281(5):R1647, doi:10.1152/ajpregu.2001.281.5.r1647. 5 astronauts on two Shuttle flights (16 and 10 days) | Sleep was **only ~6.5 h a day** (actigraphy + questionnaires). Neurobehavioral **performance dropped**. Circadian rhythms were disrupted | A **second, independent** source for ~6.5 h in-flight sleep (Dev et al. 2024 found 6.4 h on the ISS), so the sleep trigger rests on two studies. It also backs the alertness check: sleep loss in space measurably hurts performance |

### Limits to state openly
- Shuttle flights were short (4–16 days). ISS and Moon/Mars missions are much longer.
- 1990s recording equipment.
- Small crews (5–12 people).
- **The demo dataset (MMASH) is from people on Earth**, who have normal day-night HRV swings. In-flight swings would be smaller. Say this when presenting the demo.

## Team research journal review (20 articles)
Source: *Space Medicine Wearable Research Journal* (team document, literature window 2018–2026), reviewed 2026-11-14.

### Source check
Every citation was checked against **Crossref** (the official DOI registry). Five key papers were also checked against their **abstracts on Europe PMC**. **All 20 are real, peer-reviewed publications**, mostly in top journals (*Science*, *Cell*, *Nature*, *Nature Medicine*, *NEJM*). Corrections to the journal:

| # | Issue | Correct value |
|---|---|---|
| 4 | Link is a PubMed search, no DOI | Dev SI, et al. (2024). *Frontiers in Physiology*. doi:10.3389/fphys.2024.1451269 (open access, PMC11614644) |
| 6 | Wrong lead author (journal says Hupfeld) | **McGregor** HR, et al. (2023). *Scientific Reports*. doi:10.1038/s41598-023-33331-8 |
| 8 | PubMed link only | Mulavara AP, et al. (2018). *Med Sci Sports Exerc*. doi:10.1249/MSS.0000000000001615 |
| 10 | Wrong lead author (journal says Krittanawong) | **Scott** JM, et al. (2022). *Circulation Research*. doi:10.1161/CIRCRESAHA.121.319843 |
| 11 | Not a full article | *NEJM* **correspondence** (short peer-reviewed letter). Credible, but cite it as a letter |
| 13 | Year | Published online 2017; print issue 2019. Both are correct |
| 16 | Not a journal | **Peer-reviewed conference paper** (ACM ICMI 2018). Credible, but it's proceedings, not a journal |

**Caution:** each entry's "practical conclusion" and "design decision" lines are the **journal author's interpretation**, not the paper's findings. Below, "Finding" means it was confirmed in the paper's abstract or full text. "Interpretation" means it comes from the journal.

### Findings that change our in-scope design
| Source | Finding | What we do with it |
|---|---|---|
| **Dev et al. 2024**, *Front Physiol* (#4): 25 ISS astronauts, NASA Cognition battery, 5 mission phases | **Finding:** no systematic cognitive decline on 6-month missions, but **slowing early in flight in processing speed, visual working memory and sustained attention (PVT)**. **PVT speed was among the most often low**: 20.2% of in- and post-flight PVT speed scores were ≥ 1.5 SD below the pre-flight baseline (second only to working memory, 28.3%) | Confirms **Beacon (PVT)** is the right single test. Its pre-flight reference (≈ 211 ms) sets each astronaut's lapse line. (The bands now come from PVT-BA, Basner 2022, not from this paper's 1.5 SD cutoff.) |
| Dev et al. 2024 (#4) | **Finding:** exploratory analyses found **no clear link between cognitive scores and self-reported sleep or alertness ratings** | Self-report alone **can't** tell us who is impaired, so the check must *measure*. It also means sleep hours alone are a weak trigger (see next row) |
| Dev et al. 2024 (#4), Table 4 | **Finding:** astronauts self-reported **6.4 h** sleep in early flight (SD 0.94, range 4–8) and 6.4 h in late flight (SD 1.21, range 3–8) | A "< 6 h sleep" trigger alone would fire on a large share of mission days, which breaks the crew-time budget. **Change:** short sleep triggers only *together with* low HRV or sleepiness ≥ 7, or on its own below 5 h |
| Dev et al. 2024 (#4), Table 1 | **Finding:** pre-flight astronaut PVT reference (N = 24): **speed 5.25 (SD 0.24)**, **accuracy 0.97 (SD 0.04)**. In the paper, PVT speed = 10 − 1/RT (RT in s), so lower = faster; 5.25 means a mean reciprocal RT of ~4.75 s⁻¹ (roughly **210 ms**) | **Real astronaut numbers for the demo's preset baseline**, labeled "NASA ISS pre-flight reference (Dev et al. 2024)". Each astronaut's own pre-flight baseline replaces it in real use |
| **de Zambotti et al. 2019**, *Behav Sleep Med* (#13): Oura ring vs. lab polysomnography, 41 people | **Finding:** ring total sleep time, time to fall asleep and time awake after sleep onset were **not different from lab polysomnography**. The ring put 81–93% of nights in the right sleep-length range (< 6 h / 6–7 h / > 7 h) | Sleep **hours** from a wearable are credible. **Sleep stages are not** (needs more validation), so we show sleep hours only |
| **Overbey et al. 2024**, *Nature* (#3); **Garrett-Bakelman et al. 2019**, *Science* (#1) | **Finding (abstract):** responses vary between individuals; some changes persist after return | Supports **personal baselines** over fixed population cutoffs (already in MINIGAME.md) |
| **Can et al. 2019**, *J Biomed Inform* (#17) | **Finding:** stress detection works in controlled labs but **daily-life evidence is limited**. **Interpretation:** exercise and movement get confused with stress | Take the HRV reading **from the sleep window** (steady posture, no exercise), not during the day. That matches the overnight MMASH reference |
| **Tjoa & Guan 2021**, *IEEE TNNLS* (#19) | **Interpretation:** medical alerts should show *which signals* caused them | The home screen's "top issue" names its cause (e.g., "HRV 22% below your baseline"). The breakdown is one tap deeper |
| **Stahn et al. 2019**, *NEJM* (#11); **De la Torre et al. 2024**, *npj Microgravity* (#12) | **Interpretation:** physiological signals need self-report and mission context | Supports keeping the **2-tap check-in** (mood + sleepiness) |
| **Afshinnekoo et al. 2020**, *Cell* (#2); the journal's own scope statement | **Interpretation:** wearables are a **screening/triage layer, not diagnosis** | "Act" status = follow-up assessment or flight-surgeon flag. The app never names a disease |

### Out of scope (useful later, parked)
| Topic | Sources | Why parked |
|---|---|---|
| Post-flight recovery tracking (months after landing) | #1, #5, #6, #7, #8 | Our scope is in-mission self-assessment |
| Bone loss, anemia | #5, #9 | Need lab tests or imaging. A wearable or app can't assess them |
| Smart vest (ECG + respiration), EEG headband | #14, #15 | Hardware. Not building devices |
| Machine-learning models, sensor fusion | #16, #18 | MVP uses simple rules against personal baselines |
| **WESAD dataset** (chest ECG, EDA, respiration; 15 people; baseline vs. stress) | #16 | A second real dataset option. MMASH covers HRV + sleep. Check WESAD's license before any use |

## Science behind the mechanics
### Psychomotor Vigilance Task (PVT)
- The standard behavioral test of sleep loss. It measures reaction time to random signals.
- **PVT-B (3 min):** gap before each signal 1–4 s; lapse = RT ≥ 355 ms. Validated against the 10-min PVT (500 ms lapse threshold). See Basner, Mollicone & Dinges (2011).
- Most sensitive outcomes: lapses and mean speed (1/RT).
- Included in NASA's "Cognition" battery for spaceflight (Basner et al., 2015).

### HRV
- RMSSD is the usual short-term (vagal) HRV measure. ln RMSSD is often used for day-to-day tracking.
- A drop below one's own rolling baseline is a common sign of stress or poor recovery (borrowed from athlete monitoring; thresholds need tuning).
- **Resonance-frequency breathing** at about 6 breaths/min (range about 4.5–7) gives the biggest short-term rise in HRV (Lehrer & Gevirtz, 2014).

### Sleepiness self-report
- Karolinska Sleepiness Scale: 1 (extremely alert) to 9 (very sleepy, fighting sleep).
- People who are short on sleep tend to underrate their impairment, so comparing self-report with PVT is informative.

### Fatigue countermeasures (verify wording against NASA HRP sleep/fatigue resources)
- Sleep and naps are the only real fix for sleep debt. Short naps (about 20–30 min) limit post-nap grogginess.
- Bright light, movement, and well-timed caffeine help for a while.
- Engaging tasks only mask fatigue briefly. Don't market the game as a cure.

## References
- Basner M, Mollicone D, Dinges DF (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. *Acta Astronautica*.
- Basner M, et al. (2015). Development and validation of the Cognition test battery for spaceflight. *Aerospace Medicine and Human Performance*.
- Lehrer PM, Gevirtz R (2014). Heart rate variability biofeedback: how and why does it work? *Frontiers in Psychology*.
- Davis CM, et al. (2015). Deficits in sustained attention and changes in dopaminergic protein levels following exposure to proton radiation are related to basal dopaminergic function. *PLoS ONE*. doi:10.1371/journal.pone.0144556 (OSDR OSD-939)
- Krukowski K, et al. (2021). Sex-specific cognitive deficits after GCRsim exposure (OSDR OSD-479; see the study page for the full citation)
- Adkins AM, et al. (2023). Differential impact of social isolation and space radiation on behavior and motor learning in rats. *Life*. doi:10.3390/life13030826 (OSDR OSD-1018)
- Dev SI, et al. (2024). Cognitive performance in ISS astronauts on 6-month low Earth orbit missions. *Frontiers in Physiology*. doi:10.3389/fphys.2024.1451269
- de Zambotti M, Rosas L, Colrain IM, Baker FC (2019). The sleep of the ring: comparison of the ŌURA sleep tracker against polysomnography. *Behavioral Sleep Medicine* 17(2):124–136. doi:10.1080/15402002.2017.1300587
- Garrett-Bakelman FE, et al. (2019). The NASA Twins Study. *Science* 364(6436):eaau8650. doi:10.1126/science.aau8650
- Overbey EG, et al. (2024). The Space Omics and Medical Atlas (SOMA) and international astronaut biobank. *Nature* 632. doi:10.1038/s41586-024-07639-y
- Can YS, Arnrich B, Ersoy C (2019). Stress detection in daily life scenarios using smart phones and wearable sensors: a survey. *J Biomed Inform* 92:103139. doi:10.1016/j.jbi.2019.103139
- Tjoa E, Guan C (2021). A survey on explainable artificial intelligence (XAI): toward medical XAI. *IEEE TNNLS* 32(11):4793–4813. doi:10.1109/TNNLS.2020.3027314
- Full list of 20 (with corrections): see "Team research journal review" above
- Rossi A, et al. (2020). A Public Dataset of 24-h Multi-Levels Psycho-Physiological Responses in Young Healthy Adults. *Data* 5(4):91. doi:10.3390/data5040091. Dataset: PhysioNet MMASH v1.0.0, doi:10.13026/cerq-fc86 (ODbL v1.0)
- Chua EC-P, et al. (2012). Heart rate variability can be used to estimate sleepiness-related decrements in psychomotor vigilance during total sleep deprivation. *Sleep*. PubMed 22379238
- Åkerstedt T, Gillberg M (1990). Subjective and objective sleepiness in the active individual. *International Journal of Neuroscience* (KSS).
