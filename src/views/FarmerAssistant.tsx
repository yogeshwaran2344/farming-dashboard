import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Bot,
  Sparkles,
  Droplets,
  HelpCircle,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Plus,
  BookOpen,
  DollarSign,
  Volume2,
  VolumeX,
  Compass,
  AlertOctagon,
  Sprout,
  Layers,
  Thermometer,
  CloudRain,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Check
} from 'lucide-react';
import { PlannerTask, FarmDiaryEntry, FarmExpenseEntry } from '../types';

export const FarmerAssistant: React.FC = () => {
  const {
    t,
    language,
    selectedField,
    validatedReading,
    currentRecommendation,
    alerts,
    getStationForField,
    tasks,
    toggleTask,
    addTask,
    diaryEntries,
    addDiaryEntry,
    expenses,
    addExpense,
    dataSourceMode,
  } = useFarm();

  const isKn = language === 'kn';
  const station = getStationForField(selectedField?.id || '');

  // Active sub-tool tab: 'overview' | 'irrigation-wizard' | 'crop-stage' | 'troubleshoot' | 'planner' | 'diary' | 'expenses'
  const [activeSection, setActiveSection] = useState<'overview' | 'irrigation-wizard' | 'crop-stage' | 'troubleshoot' | 'planner' | 'diary' | 'expenses'>('overview');

  // Text to Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Irrigation Advisor Wizard State
  const [recentRain, setRecentRain] = useState<'no' | 'light' | 'heavy'>('no');
  const [recentWatering, setRecentWatering] = useState<'no' | 'yesterday' | 'today'>('no');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [wizardLogged, setWizardLogged] = useState(false);

  // Troubleshooting Wizard State
  const [troubleTopic, setTroubleTopic] = useState<'dry_fast' | 'no_soak' | 'yellow_leaves' | 'sensor_frozen'>('dry_fast');

  // Task Form State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<PlannerTask['category']>('irrigation');
  const [newTaskDue, setNewTaskDue] = useState('Tomorrow');

  // Diary Form State
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [newDiaryType, setNewDiaryType] = useState<FarmDiaryEntry['type']>('irrigation');
  const [newDiaryAmount, setNewDiaryAmount] = useState('');
  const [newDiaryNotes, setNewDiaryNotes] = useState('');

  // Expense Form State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpenseCat, setNewExpenseCat] = useState<FarmExpenseEntry['category']>('fertilizer');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmt, setNewExpenseAmt] = useState<number>(500);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Text to speech synthesizer
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isKn ? 'kn-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 1. Dynamic Context-Aware Sensor Explanation
  const generateContextExplanation = useMemo(() => {
    if (validatedReading.status === 'missing' || validatedReading.soilMoisture === null) {
      return {
        summary: isKn
          ? "ಸಂವೇದಕದಿಂದ ಯಾವುದೇ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ESP32 ಸಾಧನವನ್ನು ಆನ್ ಮಾಡಿ ಸಂಪರ್ಕಿಸಿ."
          : "No sensor readings are currently received for this plot. Deploy or turn on the ESP32 station before checking soil conditions.",
        qualityNotice: isKn ? "ದತ್ತಾಂಶ ಲಭ್ಯವಿಲ್ಲ" : "Telemetry Absent",
        nextAction: isKn ? "ESP32 ವಿದ್ಯುತ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ." : "Inspect ESP32 battery and power switch.",
      };
    }

    if (validatedReading.status === 'invalid') {
      return {
        summary: isKn
          ? "ಸಂವೇದಕದಿಂದ ಅಸಹಜ ಸಿಗ್ನಲ್ ಬರುತ್ತಿದೆ. ಸಂವೇದಕದ ತಂತಿಗಳು ಸಡಿಲವಾಗಿವೆಯೇ ಅಥವಾ ತುಕ್ಕು ಹಿಡಿದಿವೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಿ."
          : "The capacitive probe is reporting out-of-range ADC voltage. The soil probe cable may be severed, corroded, or disconnected.",
        qualityNotice: isKn ? "ದೋಷಯುಕ್ತ ವಾಚನ" : "Corrupted / Hardware Fault",
        nextAction: isKn ? "ಜಮೀನಿನಲ್ಲಿ ತಂತಿ ಜೋಡಣೆ ಪರೀಕ್ಷಿಸಿ." : "Perform wire continuity test and clean capacitive probe plates.",
      };
    }

    if (validatedReading.status === 'stale') {
      return {
        summary: isKn
          ? `ಎಚ್ಚರಿಕೆ: ಕೊನೆಯ ಮಾಹಿತಿಯು ${validatedReading.stalenessMinutes} ನಿಮಿಷಗಳ ಹಿಂದಿನದು. ESP32 ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ಹಳೆಯ ಸಂಖ್ಯೆಗಳ ಆಧಾರದ ಮೇಲೆ ನೀರು ಹಾಯಿಸಬೇಡಿ; ಜಮೀನಿನಲ್ಲಿ ಖುದ್ದಾಗಿ ಪರಿಶೀಲಿಸಿ.`
          : `Safety Warning: The telemetry is stale (received ${validatedReading.stalenessMinutes} minutes ago). Station communications appear offline. Never trigger irrigation based on outdated measurements; verify soil dampness at 4-6 inch root depth manually.`,
        qualityNotice: isKn ? `ಹಳೆಯದು (${validatedReading.stalenessMinutes} ನಿಮಿಷ)` : `Stale Data (${validatedReading.stalenessMinutes}m old)`,
        nextAction: isKn ? "ಸ್ಥಳೀಯವಾಗಿ ಮಣ್ಣನ್ನು ಪರೀಕ್ಷಿಸಿ." : "Check soil moisture manually using root auger / trowel.",
      };
    }

    const moisture = validatedReading.soilMoisture;
    const min = selectedField?.targetMoistureMin ?? 40;
    const max = selectedField?.targetMoistureMax ?? 70;
    const crop = selectedField?.cropType || (isKn ? "ಬೆಳೆ" : "crop");
    const stage = selectedField?.cropStage || "Vegetative";

    if (moisture < min) {
      const deficit = Math.round((min - moisture) * 10) / 10;
      return {
        summary: isKn
          ? `ನಿಮ್ಮ ${selectedField?.name} ಜಮೀನಿನಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ${moisture}% ಇದೆ. ${crop} ಬೆಳೆಗೆ (${stage} ಹಂತ) ನಿಗದಿಪಡಿಸಿದ ಕನಿಷ್ಠ ಮಿತಿ ${min}% ಗಿಂತ ${deficit}% ಕಡಿಮೆ ಇದೆ. ಬೇರುಗಳಲ್ಲಿ ನೀರಿನ ಕೊರತೆಯಾಗುತ್ತಿದ್ದು, ಬಾಡುವಿಕೆ ತಡೆಯಲು ನೀರು ಹಾಯಿಸಿ.`
          : `Soil moisture in ${selectedField?.name} is ${moisture}%, which is ${deficit}% below the configured ${min}% minimum threshold for ${crop} at the ${stage} stage. Root suction tension is elevated, restricting nutrient intake.`,
        qualityNotice: isKn ? "ತಾಜಾ ವಾಚನ (ದೃಢೀಕರಿಸಲಾಗಿದೆ)" : "Fresh Telemetry (Integrity Verified)",
        nextAction: isKn ? "ಡ್ರಿಪ್ ನೀರಾವರಿ ಪ್ರಾರಂಭಿಸಿ." : `Initiate ${selectedField?.irrigationMethod} cycle for approx 90 minutes.`,
      };
    }

    if (moisture > max) {
      const surplus = Math.round((moisture - max) * 10) / 10;
      return {
        summary: isKn
          ? `ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ${moisture}% ರಷ್ಟಿದ್ದು, ಗರಿಷ್ಠ ಮಿತಿ ${max}% ಗಿಂತ ${surplus}% ಹೆಚ್ಚಾಗಿದೆ. ಮಣ್ಣು ಸಂಪೂರ್ಣವಾಗಿ ನೆನೆದಿದ್ದು, ಬೇರುಗಳಿಗೆ ಆಮ್ಲಜನಕ ಸಿಗದೆ ಕೊಳೆತ ರೋಗ ಉಂಟಾಗಬಹುದು. ನೀರು ಹಾಯಿಸಬೇಡಿ.`
          : `Soil moisture is at ${moisture}%, which is ${surplus}% above the upper limit of ${max}%. Soil pore spaces are filled with gravitational water. Additional water risks root asphyxiation and damping-off fungus.`,
        qualityNotice: isKn ? "ತಾಜಾ ವಾಚನ (ದೃಢೀಕರಿಸಲಾಗಿದೆ)" : "Fresh Telemetry (Integrity Verified)",
        nextAction: isKn ? "ನೀರು ಹಾಯಿಸುವುದನ್ನು ತಡೆಹಿಡಿಯಿರಿ." : "Withhold irrigation and inspect sub-surface drainage channels.",
      };
    }

    return {
      summary: isKn
        ? `ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ${moisture}% ಇದೆ. ಇದು ${crop} ಬೆಳೆಗೆ ನಿಗದಿಪಡಿಸಿದ ಸುರಕ್ಷಿತ ಮಿತಿಯಲ್ಲಿದೆ (${min}% ರಿಂದ ${max}%). ಬೇರುಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ನೀರು ಮತ್ತು ಗಾಳಿಯ ಸಮತೋಲನ ಅತ್ಯುತ್ತಮವಾಗಿದೆ. ಇಂದು ನೀರು ಹಾಯಿಸುವ ಅಗತ್ಯವಿಲ್ಲ.`
        : `Soil moisture is at ${moisture}%, comfortably in the ${min}% - ${max}% optimal band for ${crop} (${stage}). Capillary moisture and root aeration are in balanced equilibrium. No watering needed today.`,
      qualityNotice: isKn ? "ತಾಜಾ ವಾಚನ (ದೃಢೀಕರಿಸಲಾಗಿದೆ)" : "Fresh Telemetry (Integrity Verified)",
      nextAction: isKn ? "ಸಾಮಾನ್ಯ ನಿಗಾ ವಹಿಸಿ." : "Maintain normal observation schedule. Re-evaluate tomorrow morning.",
    };
  }, [validatedReading, selectedField, isKn]);

  // 2. Interactive Irrigation Advisor Evaluation (Wizard Decision Engine)
  const wizardDecision = useMemo(() => {
    const moisture = validatedReading.soilMoisture;
    const min = selectedField?.targetMoistureMin ?? 40;
    const max = selectedField?.targetMoistureMax ?? 70;

    if (!validatedReading.isLiveReliable || moisture === null) {
      return {
        verdict: isKn ? "ನೀರಾವರಿ ನಿರ್ಧಾರವನ್ನು ಸ್ಥಗಿತಗೊಳಿಸಲಾಗಿದೆ" : "Irrigation Decision Suspended",
        color: "bg-amber-100 text-amber-900 border-amber-300",
        why: isKn
          ? "ಸಂವೇದಕ ವಾಚನವು ಹಳೆಯದಾಗಿದೆ ಅಥವಾ ದೋಷಯುಕ್ತವಾಗಿದೆ. ಹಳೆಯ ದತ್ತಾಂಶದ ಆಧಾರದ ಮೇಲೆ ನೀರು ಹಾಯಿಸುವುದು ತಪ್ಪು ನಿರ್ಧಾರಕ್ಕೆ ಕಾರಣವಾಗಬಹುದು."
          : "Sensor telemetry is stale, missing, or invalid. Safety policy forbids automated recommendations without fresh physical readings.",
        factorsUsed: ["Sensor Quality: Stale / Disconnected", "Safety Interlock: Active"],
        recommendedMinutes: 0,
        canLog: false,
      };
    }

    // Heavy rain overrides deficit
    if (recentRain === 'heavy') {
      return {
        verdict: isKn ? "ನೀರು ಹಾಯಿಸಬೇಡಿ (ಇತ್ತೀಚಿನ ಭಾರಿ ಮಳೆ ಸಾಕಾಗಿದೆ)" : "Do Not Irrigate (Recent Heavy Rain Sufficient)",
        color: "bg-blue-100 text-blue-900 border-blue-300",
        why: isKn
          ? "ಇತ್ತೀಚೆಗೆ ಬಿದ್ದ ಭಾರಿ ಮಳೆಯಿಂದಾಗಿ ಮಣ್ಣಿನ ಆಳದ ಪದರಗಳಲ್ಲಿ ಸಾಕಷ್ಟು ತೇವಾಂಶವಿರುತ್ತದೆ. ಮೇಲ್ಮೈ ಒಣಗಿದಂತೆ ಕಂಡರೂ ಈಗ ನೀರು ಕೊಡುವುದು ಅತಿಯಾಗುತ್ತದೆ."
          : "Farmer-reported heavy rainfall has replenished root-zone moisture reserves. Extra water will cause waterlogging and nutrient leaching.",
        factorsUsed: [`Current Sensor Moisture: ${moisture}%`, "Rainfall: Heavy", `Crop: ${selectedField?.cropType}`],
        recommendedMinutes: 0,
        canLog: true,
      };
    }

    // Already watered today
    if (recentWatering === 'today') {
      return {
        verdict: isKn ? "ಇಂದು ನೀರು ಹಾಯಿಸಬೇಡಿ (ಈಗಾಗಲೇ ನೀರು ಕೊಡಲಾಗಿದೆ)" : "Hold Irrigation (Plot Already Watered Today)",
        color: "bg-blue-100 text-blue-900 border-blue-300",
        why: isKn
          ? "ಇಂದು ಈಗಾಗಲೇ ನೀರು ಹಾಯಿಸಿರುವುದರಿಂದ ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ಇಂಗಲು ಸಮಯ ಬೇಕು. ಸಂವೇದಕವು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ನಿಖರ ತೇವಾಂಶವನ್ನು ತೋರಿಸುತ್ತದೆ."
          : "Irrigation was already conducted today. Water requires 2-4 hours to percolate through capillary pores before sensor stabilizes.",
        factorsUsed: [`Current Reading: ${moisture}%`, "Recent Event: Watered Today", `Method: ${selectedField?.irrigationMethod}`],
        recommendedMinutes: 0,
        canLog: true,
      };
    }

    // Moisture deficit
    if (moisture < min) {
      const deficit = min - moisture;
      const timingAdvice = timeOfDay === 'afternoon'
        ? (isKn ? "ಮಧ್ಯಾಹ್ನದ ತೀವ್ರ ಬಿಸಿಲು ಮುಗಿಯುವವರೆಗೆ ಕಾಯಿರಿ (ಸಂಜೆ 5 ಗಂಟೆಯ ನಂತರ ನೀರು ಹಾಯಿಸಿ)." : "Postpone until after 4:30 PM to minimize midday evaporative water loss.")
        : (isKn ? "ಈಗಲೇ ನೀರು ಹಾಯಿಸುವುದು ಸೂಕ್ತವಾಗಿದೆ." : "Optimal time to start irrigation now.");

      return {
        verdict: isKn ? "ನೀರಾವರಿ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ (ತೇವಾಂಶ ಕೊರತೆ)" : "Irrigation Recommended (Soil Moisture Deficit)",
        color: "bg-amber-100 text-amber-950 border-amber-300",
        why: isKn
          ? `ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ${moisture}% ಇದ್ದು, ನಿಗದಿಪಡಿಸಿದ ಮಿತಿ ${min}% ಗಿಂತ ${deficit}% ಕಡಿಮೆಯಾಗಿದೆ. ${timingAdvice}`
          : `Soil moisture (${moisture}%) is ${deficit}% below threshold (${min}%). Plant roots are under matric tension. ${timingAdvice}`,
        factorsUsed: [`Sensor Moisture: ${moisture}%`, `Target Min: ${min}%`, `Timing: ${timeOfDay}`, `Crop: ${selectedField?.cropType}`],
        recommendedMinutes: 90,
        canLog: true,
      };
    }

    // Moisture surplus
    if (moisture > max) {
      return {
        verdict: isKn ? "ನೀರು ಹಾಯಿಸುವುದನ್ನು ತಡೆಹಿಡಿಯಿರಿ (ಅಧಿಕ ತೇವಾಂಶ)" : "Withhold Irrigation (Surplus Moisture)",
        color: "bg-blue-100 text-blue-900 border-blue-300",
        why: isKn
          ? `ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ${moisture}% ರಷ್ಟಿದ್ದು, ಗರಿಷ್ಠ ಮಿತಿ ${max}% ಗಿಂತ ಹೆಚ್ಚಾಗಿದೆ. ಬೇರುಗಳಿಗೆ ಆಮ್ಲಜನಕದ ಕೊರತೆಯಾಗದಂತೆ ನೀರನ್ನು ನಿಲ್ಲಿಸಿ.`
          : `Soil moisture (${moisture}%) exceeds upper field capacity (${max}%). Root zone needs aerating.`,
        factorsUsed: [`Sensor Moisture: ${moisture}%`, `Upper Threshold: ${max}%`, `Crop: ${selectedField?.cropType}`],
        recommendedMinutes: 0,
        canLog: true,
      };
    }

    // Optimal
    return {
      verdict: isKn ? "ತೇವಾಂಶ ಸೂಕ್ತವಾಗಿದೆ — ನೀರು ಹಾಯಿಸುವ ಅಗತ್ಯವಿಲ್ಲ" : "Soil Moisture In Safe Target Range",
      color: "bg-emerald-100 text-emerald-950 border-emerald-300",
      why: isKn
        ? `ಮಣ್ಣಿನ ತೇವಾಂಶ ${moisture}% ಸೂಕ್ತ ವ್ಯಾಪ್ತಿಯಲ್ಲಿದೆ (${min}% - ${max}%). ಸದ್ಯಕ್ಕೆ ಹೆಚ್ಚುವರಿ ನೀರಿನ ಅಗತ್ಯವಿಲ್ಲ.`
        : `Soil moisture (${moisture}%) is well within the healthy root aeration band (${min}% - ${max}%).`,
        factorsUsed: [`Sensor Moisture: ${moisture}%`, `Optimal Band: ${min}% - ${max}%`, `Stage: ${selectedField?.cropStage}`],
      recommendedMinutes: 0,
      canLog: true,
    };
  }, [validatedReading, selectedField, recentRain, recentWatering, timeOfDay, isKn]);

  // Log irrigation decision into diary
  const handleLogAdvisorEvent = () => {
    addDiaryEntry({
      date: new Date().toISOString().split('T')[0],
      type: 'irrigation',
      fieldId: selectedField?.id || 'field-1',
      amount: wizardDecision.recommendedMinutes > 0 ? `${wizardDecision.recommendedMinutes} mins` : 'Evaluated - Postponed',
      notes: `Advisor Guidance: ${wizardDecision.verdict}. (Reading: ${validatedReading.soilMoisture ?? '--'}%, Rain: ${recentRain}, Timing: ${timeOfDay}).`
    });
    setWizardLogged(true);
    setTimeout(() => setWizardLogged(false), 3000);
  };

  // 3. Crop-Stage Agronomic Advice Database (Deterministic)
  const cropStageCareTips = useMemo(() => {
    const crop = selectedField?.cropType.toLowerCase() || '';
    const stage = selectedField?.cropStage || 'Vegetative';

    if (crop.includes('tomato')) {
      return {
        stageName: stage,
        waterSensitivity: "Critical — High Drought & Overwatering Sensitivity",
        keyRisks: "Blossom drop if moisture dips < 40%; Blossom End Rot if watering is irregular; Early blight in humid mornings.",
        actionTips: [
          "Maintain consistent moisture: fluctuations between very dry and very wet induce calcium uptake failure and blossom end rot.",
          "Irrigate root zone directly via drip; keep foliage dry to prevent fungal alternaria blight spores from germinating.",
          "Check soil at 6-inch depth; do not let root zone dry beyond 40% during active flowering."
        ],
        targetBand: `${selectedField?.targetMoistureMin}% – ${selectedField?.targetMoistureMax}%`
      };
    }

    if (crop.includes('cotton')) {
      return {
        stageName: stage,
        waterSensitivity: "Moderate — Deep taproot system with drought resilience",
        keyRisks: "Excess vegetative canopy growth if overwatered early; square shed during moisture deficit.",
        actionTips: [
          "Cotton benefits from mild moisture stress in early vegetative phase to promote deep vertical taproot extension.",
          "During squaring and boll development, maintain soil moisture above 40% to prevent boll abortion.",
          "Ensure furrows or drip laterals drain standing water within 12 hours after heavy rains."
        ],
        targetBand: `${selectedField?.targetMoistureMin}% – ${selectedField?.targetMoistureMax}%`
      };
    }

    return {
      stageName: stage,
      waterSensitivity: "Standard Agricultural Calibrated Range",
      keyRisks: "Moisture deficits during flowering/fruiting impede nutrient absorption; surplus water risks root rot.",
      actionTips: [
        "Monitor soil moisture at 4-6 inch root depth before initiating water pump.",
        "Inspect drip emitter discharge rates to ensure uniform field distribution.",
        "Avoid high-temperature midday irrigation to prevent evaporation loss."
      ],
      targetBand: `${selectedField?.targetMoistureMin}% – ${selectedField?.targetMoistureMax}%`
    };
  }, [selectedField]);

  // 4. Guided Troubleshooting Scenarios (Deterministic Tree)
  const troubleshootGuide = {
    dry_fast: {
      title: isKn ? "ಮಣ್ಣು ಅತಿ ಬೇಗ ಒಣಗುತ್ತಿರುವುದು ಏಕೆ?" : "Why is the soil drying out faster than expected?",
      symptoms: isKn ? "ನೀರು ಹಾಯಿಸಿದ 1-2 ದಿನಗಳಲ್ಲೇ ತೇವಾಂಶ 35% ಗಿಂತ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ." : "Moisture drops rapidly below 35% within 24-48 hours of watering.",
      probableCauses: [
        isKn ? "ಮರಳು ಅಥವಾ ಜಲ್ಲಿ ಮಿಶ್ರಿತ ಮಣ್ಣು (ನೀರು ಹಿಡಿದಿಟ್ಟುಕೊಳ್ಳುವ ಶಕ್ತಿ ಕಡಿಮೆ)." : "Coarse sandy or gravelly loam with low organic matter and low water holding capacity.",
        isKn ? "ಮಧ್ಯಾಹ್ನದ ಹೆಚ್ಚಿನ ಬಿಸಿಲು ಮತ್ತು ಗಾಳಿ (ಬಾಷ್ಪೀಕರಣ ವೇಗವಾಗಿದೆ)." : "Elevated daytime temperatures (>32°C) combined with warm winds accelerating evapotranspiration.",
        isKn ? "ಬೆಳೆಯು ಪೂರ್ಣ ಬೆಳೆದಿದ್ದು, ಎಲೆಗಳ ಮೂಲಕ ಹೆಚ್ಚಿನ ನೀರನ್ನು ಹೀರಿಕೊಳ್ಳುತ್ತಿದೆ." : "High leaf canopy index demanding high transpiration rates during flowering/fruiting.",
        isKn ? "ಡ್ರಿಪ್ ಪೈಪಿನಲ್ಲಿ ಕಸ ಸಿಲುಕಿ ನೀರು ಸರಿಯಾಗಿ ತಲುಪದಿರಬಹುದು." : "Sub-surface emitter clogging or inadequate drip runtime volume."
      ],
      safeChecks: [
        isKn ? "ಮಣ್ಣಿನ ಮೇಲೆ ಕಸ ಅಥವಾ ರವದಿಯ ಹೊದಿಕೆ (ಮಲ್ಚಿಂಗ್) ಹಾಕಿ ಬಾಷ್ಪೀಕರಣ ತಡೆಯಿರಿ." : "Apply organic straw/leaf mulch to reduce direct solar evaporation from the soil surface.",
        isKn ? "ಡ್ರಿಪ್ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೊಳೆಯಿರಿ ಮತ್ತು ಡ್ರಿಪ್ ನೀರಾವರಿಯ ಸಮಯವನ್ನು 20-30 ನಿಮಿಷ ಹೆಚ್ಚಿಸಿ." : "Flush drip sub-mains and extend run duration slightly to achieve deeper root percolation.",
        isKn ? "ಬೆಳಿಗ್ಗೆ 6 ರಿಂದ 8 ರೊಳಗೆ ನೀರು ಕೊಡಿ." : "Shift irrigation schedule strictly to early morning (6:00 AM – 8:30 AM)."
      ]
    },
    no_soak: {
      title: isKn ? "ನೀರು ಹಾಯಿಸಿದರೂ ತೇವಾಂಶ ಹೆಚ್ಚಾಗುತ್ತಿಲ್ಲವೇ?" : "Why is moisture reading not rising after irrigation?",
      symptoms: isKn ? "ಪಂಪ್ ಚಾಲನೆಯಲ್ಲಿದ್ದರೂ ಸಂವೇದಕದಲ್ಲಿ ತೇವಾಂಶ 40% ಗಿಂತ ಹೆಚ್ಚಾಗುತ್ತಿಲ್ಲ." : "Pump ran, but soil moisture value remains flat or rises very slowly.",
      probableCauses: [
        isKn ? "ಸಂವೇದಕದ ಪ್ರೋಬ್ ನೀರಿನ ಡ್ರಿಪ್ ಡ್ರಾಪ್ ತಲುಪುವ ರೇಖೆಗಿಂತ ದೂರದಲ್ಲಿದೆ." : "Capacitive sensor probe is positioned too far (>20cm) from the nearest drip emitter.",
        isKn ? "ಮಣ್ಣಿನ ಮೇಲ್ಪದರ ಗಟ್ಟಿಯಾಗಿದ್ದು ನೀರು ಪಕ್ಕಕ್ಕೆ ಹರಿದು ಹೋಗುತ್ತಿದೆ (ಬೈಪಾಸ್ ಫ್ಲೋ)." : "Surface crusting or hydrophobic dry soil causing lateral runoff away from the probe.",
        isKn ? "ಡ್ರಿಪ್ ಪೈಪ್ ಕನೆಕ್ಟರ್ ಸೋರಿಕೆಯಾಗುತ್ತಿದ್ದು, ಒತ್ತಡ ಕಡಿಮೆಯಾಗಿದೆ." : "Lateral pressure drop caused by a punctured hose or dislodged end cap before the sensor station."
      ],
      safeChecks: [
        isKn ? "ಸಂವೇದಕದ ಸುತ್ತಲಿನ ಮಣ್ಣನ್ನು ಕೈಯಿಂದ ಮುಟ್ಟಿ ಪರೀಕ್ಷಿಸಿ." : "Physically inspect soil dampness 10 cm around the sensor probe with your fingers.",
        isKn ? "ಡ್ರಿಪ್ ಎಮಿಟರ್ ಸಂವೇದಕದಿಂದ 10-15 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ." : "Verify that an emitter is located within 10-15 cm of the probe to register root hydration.",
        isKn ? "ಪೈಪ್‌ನಲ್ಲಿ ಸರಿಯಾದ ಒತ್ತಡವಿದೆಯೇ ಮತ್ತು ಸೋರಿಕೆ ಇಲ್ಲವೇ ಎಂದು ನೋಡಿ." : "Inspect mainline pressure gauge and check lateral lines for washouts."
      ]
    },
    yellow_leaves: {
      title: isKn ? "ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ — ಕಾರಣವೇನು?" : "Leaves turning pale yellow — What should I check?",
      symptoms: isKn ? "ಕೆಳಗಿನ ಎಲೆಗಳು ಹಳದಿಯಾಗಿ ಬೀಳುತ್ತಿವೆ ಅಥವಾ ಸಸ್ಯಗಳು ನಿಸ್ತೇಜವಾಗಿವೆ." : "Lower foliage turning chlorotic/yellow or general plant vigor dropping.",
      probableCauses: [
        isKn ? "ಅತಿಯಾದ ನೀರು (ಮಣ್ಣಿನಲ್ಲಿ ನೀರು ನಿಂತು ಬೇರುಗಳಿಗೆ ಗಾಳಿ ಸಿಗುತ್ತಿಲ್ಲ)." : "Over-irrigation: Root hypoxia causing anaerobic conditions and preventing nitrogen uptake.",
        isKn ? "ಸಾರಜನಕ (ನೈಟ್ರೋಜನ್) ಅಥವಾ ಲಘು ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ." : "Nitrogen leaching due to excessive furrow flooding or sandy soil drainage.",
        isKn ? "ಬೇರು ಕೊಳೆತ ಅಥವಾ ಶಿಲೀಂಧ್ರ ರೋಗದ ಆರಂಭ." : "Early root rots (Pythium/Fusarium) induced by saturated warm soil."
      ],
      safeChecks: [
        isKn ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ತೇವಾಂಶ 75% ಗಿಂತ ಹೆಚ್ಚಿದೆಯೇ ನೋಡಿ. ಹೆಚ್ಚಿದ್ದರೆ ನೀರನ್ನು ನಿಲ್ಲಿಸಿ." : "Check dashboard soil moisture: if > 70% consistently, withhold water immediately to aerate soil.",
        isKn ? "ಬೇರುಗಳನ್ನು ಸ್ವಲ್ಪ ಅಗೆದು ನೋಡಿ — ಬೇರುಗಳು ಬಿಳಿಯಾಗಿದ್ದರೆ ಆರೋಗ್ಯಕರ, ಕಪ್ಪಾಗಿದ್ದರೆ ಕೊಳೆತ ಲಕ್ಷಣ." : "Gently excavate a root sample: healthy roots are white and firm; brown/slimy roots indicate waterlogging rot.",
        isKn ? "ಮಣ್ಣು ಒಣಗಿದ ನಂತರ ಸಮತೋಲಿತ ಲಘು ಪೋಷಕಾಂಶ ಸ್ಪ್ರೇ ಕೊಡಿ." : "Allow soil to dry to target threshold (45%) before applying foliar micronutrient spray."
      ]
    },
    sensor_frozen: {
      title: isKn ? "ಸಂವೇದಕ ವಾಚನ ನಿಂತುಹೋಗಿದೆ ಅಥವಾ ತಪ್ಪಾಗಿ ತೋರಿಸುತ್ತಿದೆಯೇ?" : "Sensor readings appear frozen or abnormal (0% / 100%)",
      symptoms: isKn ? "ವಾಚನವು ನಿರಂತರವಾಗಿ 0% ಅಥವಾ 100% ತೋರಿಸುತ್ತಿದೆ ಅಥವಾ ಬದಲಾಗುತ್ತಿಲ್ಲ." : "Display shows stuck 0%, 100%, or stale timestamp with red warning badge.",
      probableCauses: [
        isKn ? "ಸಂವೇದಕದ ತಂತಿ ಸಡಿಲವಾಗಿದೆ ಅಥವಾ ಕನೆಕ್ಟರ್ ಕಳಚಿದೆ (0% ವಾಚನ)." : "Sensor signal wire is loose or disconnected from ESP32 ADC pin (typically reads 0% or -1%).",
        isKn ? "ಪ್ರೋಬ್ ಮೇಲೆ ನೀರು ನಿಂತಿದೆ ಅಥವಾ ಶಾರ್ಟ್ ಆಗಿದೆ (100% ವಾಚನ)." : "Short circuit across capacitive sensor plates or standing saline puddle (reads 100%).",
        isKn ? "ESP32 ಬ್ಯಾಟರಿ ಖಾಲಿಯಾಗಿದೆ ಅಥವಾ ವೈಫೈ ಸಿಗ್ನಲ್ ಕಡಿತಗೊಂಡಿದೆ." : "ESP32 station battery discharged or WiFi packet drop beyond field repeater range."
      ],
      safeChecks: [
        isKn ? "ESP32 ನಲ್ಲಿ ಹಸಿರು ಎಲ್ಇಡಿ ಲೈಟ್ ಮಿನುಗುತ್ತಿದೆಯೇ ಎಂದು ನೋಡಿ." : "Inspect ESP32 station box: verify power LED is blinking during transmission.",
        isKn ? "ಪ್ರೋಬ್ ಅನ್ನು ಮಣ್ಣಿನಿಂದ ಹೊರತೆಗೆದು ಒರೆಸಿ, ಪುನಃ ಭದ್ರವಾಗಿ ಮಣ್ಣಿನಲ್ಲಿ ಇಳಿಸಿ." : "Gently remove capacitive probe, wipe clean of salt crust, and reinsert firmly without air pockets.",
        isKn ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ 'Refresh Telemetry' ಬಟನ್ ಒತ್ತಿ ಹೊಸ ಪ್ಯಾಕೆಟ್ ಪರೀಕ್ಷಿಸಿ." : "Press 'Refresh Telemetry' on dashboard to test handshake with API endpoint."
      ]
    }
  };

  // Calculations for Expenses
  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Context-Aware Title & Spoken Voice Button */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.assistant.title}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Context-Aware v2.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Agricultural guidance grounded in calibrated field sensors • {selectedField?.name} ({selectedField?.cropType})
            </p>
          </div>
        </div>

        {/* Voice Readout & Language Switcher */}
        <div className="flex items-center space-x-2.5 self-start md:self-center">
          <button
            onClick={() => speakText(generateContextExplanation.summary)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
              isSpeaking
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title="Read advice aloud using speech synthesis"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
            <span>{isSpeaking ? (isKn ? "ನಿಲ್ಲಿಸಿ" : "Stop Voice") : (isKn ? "ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ" : "Listen (Voice)")}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Buttons Grid (Item 3 in User Plan) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          {isKn ? "ರೈತ ಮಿತ್ರ ಸಹಾಯಕ: ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು?" : "Farm Assistant: What would you like help with?"}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setActiveSection('irrigation-wizard')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSection === 'irrigation-wizard'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <Droplets className="w-5 h-5 mb-2 text-emerald-600" />
            <span className="font-bold text-xs leading-tight">Check Irrigation Needs</span>
          </button>

          <button
            onClick={() => setActiveSection('overview')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSection === 'overview'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <Compass className="w-5 h-5 mb-2 text-blue-600" />
            <span className="font-bold text-xs leading-tight">Explain Sensor Readings</span>
          </button>

          <button
            onClick={() => setActiveSection('crop-stage')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSection === 'crop-stage'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <Sprout className="w-5 h-5 mb-2 text-emerald-600" />
            <span className="font-bold text-xs leading-tight">Crop-Stage Care</span>
          </button>

          <button
            onClick={() => setActiveSection('troubleshoot')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSection === 'troubleshoot'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <HelpCircle className="w-5 h-5 mb-2 text-amber-600" />
            <span className="font-bold text-xs leading-tight">Guided Troubleshooting</span>
          </button>

          <button
            onClick={() => setActiveSection('planner')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSection === 'planner'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <Calendar className="w-5 h-5 mb-2 text-purple-600" />
            <span className="font-bold text-xs leading-tight">Farm Planner Tasks</span>
          </button>

          <button
            onClick={() => setActiveSection('diary')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSection === 'diary'
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-2 text-indigo-600" />
            <span className="font-bold text-xs leading-tight">Farm Diary & Observations</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Context-Aware Sensor Explanation (Default View) */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Main Soil Context Advisory Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-700" />
                <span>Current Soil Condition Explanation</span>
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {selectedField?.name} • {selectedField?.cropType} ({selectedField?.cropStage})
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-slate-800 text-sm leading-relaxed">
              <p className="font-medium">
                {generateContextExplanation.summary}
              </p>
            </div>

            {/* Quality & Actionable Next Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Telemetry Quality:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {generateContextExplanation.qualityNotice}
                </p>
                <span className="text-[10px] text-slate-400">
                  {validatedReading.timestamp ? `Timestamp: ${new Date(validatedReading.timestamp).toLocaleTimeString()}` : 'No packet'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Recommended Next Check:</span>
                <p className="font-bold text-emerald-800 mt-0.5">
                  {generateContextExplanation.nextAction}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Configured Crop Bounds:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedField?.targetMoistureMin}% (Refill) – {selectedField?.targetMoistureMax}% (Cutoff)
                </p>
                <span className="text-[10px] text-slate-400">Soil: {selectedField?.soilType}</span>
              </div>
            </div>
          </div>

          {/* 3-Part Explainable Recommendation Structure (Prompt Requirement 10) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                Transparent 3-Part Recommendation Audit
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-extrabold uppercase text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  1. What We Recommend
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{currentRecommendation.title}</h3>
                <p className="text-slate-700 leading-relaxed">{currentRecommendation.action}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-extrabold uppercase text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  2. Why We Recommend It
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">Agronomic Cause</h3>
                <p className="text-slate-700 leading-relaxed">{currentRecommendation.reason}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-extrabold uppercase text-[10px] text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  3. Information Used
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">Rule Data Inputs</h3>
                <ul className="text-slate-700 space-y-1 list-disc list-inside mt-1">
                  <li>Current Soil Moisture: <strong>{validatedReading.soilMoisture !== null ? `${validatedReading.soilMoisture}%` : 'Missing'}</strong></li>
                  <li>Configured Minimum: <strong>{selectedField?.targetMoistureMin}%</strong></li>
                  <li>Target Maximum: <strong>{selectedField?.targetMoistureMax}%</strong></li>
                  <li>Crop & Stage: <strong>{selectedField?.cropType} ({selectedField?.cropStage})</strong></li>
                  <li>Telemetry Status: <strong>{validatedReading.status.toUpperCase()}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Interactive Irrigation Advisor (Wizard - Feature 2) */}
      {activeSection === 'irrigation-wizard' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-emerald-700" />
                <span>Interactive Irrigation Decision Advisor</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Combines real sensor readings with farmer field context (rainfall, watering history, and timing)
              </p>
            </div>

            <button
              onClick={() => setActiveSection('overview')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back to Overview
            </button>
          </div>

          {/* Questionnaire Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Question 1: Rainfall */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <CloudRain className="w-4 h-4 text-blue-600" />
                <span>1. Recent Rainfall:</span>
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'no', label: 'No rain in last 48 hours' },
                  { id: 'light', label: 'Light shower (< 5mm)' },
                  { id: 'heavy', label: 'Heavy soaking rain (> 15mm)' },
                ].map(opt => (
                  <label key={opt.id} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                    <input
                      type="radio"
                      name="recent_rain"
                      checked={recentRain === opt.id}
                      onChange={() => setRecentRain(opt.id as any)}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 2: Prior Irrigation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>2. Prior Irrigation:</span>
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'no', label: 'No watering in 2+ days' },
                  { id: 'yesterday', label: 'Watered yesterday' },
                  { id: 'today', label: 'Watered earlier today' },
                ].map(opt => (
                  <label key={opt.id} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                    <input
                      type="radio"
                      name="recent_water"
                      checked={recentWatering === opt.id}
                      onChange={() => setRecentWatering(opt.id as any)}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 3: Time of Day */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Thermometer className="w-4 h-4 text-orange-600" />
                <span>3. Planned Watering Time:</span>
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'morning', label: 'Early Morning (6 AM - 9 AM)' },
                  { id: 'afternoon', label: 'Midday / Warm Sun (12 PM - 3 PM)' },
                  { id: 'evening', label: 'Late Evening (after 5 PM)' },
                ].map(opt => (
                  <label key={opt.id} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-slate-100">
                    <input
                      type="radio"
                      name="time_of_day"
                      checked={timeOfDay === opt.id}
                      onChange={() => setTimeOfDay(opt.id as any)}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Synthesized Wizard Recommendation Output */}
          <div className={`p-5 rounded-xl border space-y-3 ${wizardDecision.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/90 border border-slate-300">
                  Synthesized Advisory
                </span>
                <h3 className="text-base font-black mt-1">{wizardDecision.verdict}</h3>
                <p className="text-xs mt-1 leading-relaxed">{wizardDecision.why}</p>
              </div>

              {wizardDecision.recommendedMinutes > 0 && (
                <div className="text-right flex-shrink-0 bg-white/90 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Suggested Drip Runtime</span>
                  <span className="text-xl font-black text-emerald-800">{wizardDecision.recommendedMinutes} mins</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-300/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                <span className="font-bold">Inputs Evaluated:</span>
                {wizardDecision.factorsUsed.map((fac, i) => (
                  <span key={i} className="bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    {fac}
                  </span>
                ))}
              </div>

              {wizardDecision.canLog && (
                <button
                  onClick={handleLogAdvisorEvent}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                >
                  {wizardLogged ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Saved in Farm Diary!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Record Decision in Farm Diary</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Crop-Stage Care Advisor (Feature 3) */}
      {activeSection === 'crop-stage' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sprout className="w-5 h-5 text-emerald-700" />
                <span>Crop-Stage Growth & Care Advisor</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Agronomic requirements calibrated for {selectedField?.cropType} at {selectedField?.cropStage}
              </p>
            </div>

            <button
              onClick={() => setActiveSection('overview')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back to Overview
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-sm">Stage Characteristics:</span>
              <div className="space-y-1.5 text-slate-600">
                <p><strong>Active Stage:</strong> {cropStageCareTips.stageName}</p>
                <p><strong>Water Sensitivity:</strong> {cropStageCareTips.waterSensitivity}</p>
                <p><strong>Calibrated Soil Moisture Band:</strong> {cropStageCareTips.targetBand}</p>
                <p><strong>Irrigation Method:</strong> {selectedField?.irrigationMethod}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
              <span className="font-bold text-amber-900 text-sm flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Key Risks at this Growth Stage</span>
              </span>
              <p className="leading-relaxed text-xs">
                {cropStageCareTips.keyRisks}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Recommended Stage Management Reminders</h3>
            <div className="space-y-2">
              {cropStageCareTips.actionTips.map((tip, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Guided Troubleshooting Tree (Feature 4) */}
      {activeSection === 'troubleshoot' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span>Guided Field Diagnostic Troubleshooter</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured root-cause investigation for soil, crop symptoms, and sensor errors
              </p>
            </div>

            <button
              onClick={() => setActiveSection('overview')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back to Overview
            </button>
          </div>

          {/* Symptom selector buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'dry_fast', label: 'Soil Dries Too Fast' },
              { id: 'no_soak', label: 'Moisture Flat After Watering' },
              { id: 'yellow_leaves', label: 'Foliage Yellowing / Wilting' },
              { id: 'sensor_frozen', label: 'Sensor Stuck (0% or 100%)' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTroubleTopic(item.id as any)}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                  troubleTopic === item.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Diagnostic breakdown for selected symptom */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">{troubleshootGuide[troubleTopic].title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Observed Symptom: <strong>{troubleshootGuide[troubleTopic].symptoms}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Probable Causes to Consider:</span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700 leading-relaxed">
                  {troubleshootGuide[troubleTopic].probableCauses.map((cause, i) => (
                    <li key={i}>{cause}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-emerald-950 space-y-2">
                <span className="font-bold text-emerald-900 block">Safe Physical Field Checks:</span>
                <ul className="space-y-1.5 list-disc list-inside leading-relaxed text-emerald-900">
                  {troubleshootGuide[troubleTopic].safeChecks.map((check, i) => (
                    <li key={i}>{check}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Farm Activity Planner (Feature 5) */}
      {activeSection === 'planner' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Farm Activity Planner</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep track of upcoming irrigation cycles, crop scouting, and fertilizer tasks
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Overview
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  t.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {t.completed ? (
                    <CheckSquare className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className={`text-xs font-semibold block ${t.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      Category: {t.category}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {t.dueDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: Personal Farm Diary & Observations (Feature 6) */}
      {activeSection === 'diary' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Personal Farm Diary & Observation Log</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Historical records of watering, rainfall, fertilizer doses, and scouting notes
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDiaryModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Log Entry</span>
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Overview
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {diaryEntries.map(e => (
              <div key={e.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                      {e.type}
                    </span>
                    {e.amount && (
                      <span className="font-bold text-slate-800 text-xs">{e.amount}</span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{e.date}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{e.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7: Farm Expenses Tracker (Feature 8) */}
      {activeSection === 'expenses' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-700" />
                <span>Farm Input Expense Tracker</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track seed, fertilizer, electricity/fuel, and labor costs per field
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
              <button
                onClick={() => setActiveSection('overview')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Overview
              </button>
            </div>
          </div>

          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-semibold">Total Recorded Farm Expenses</span>
              <div className="text-2xl font-black text-emerald-900 mt-0.5">₹{totalExpenseAmount.toLocaleString()}</div>
            </div>
            <span className="text-xs text-emerald-700 font-medium">{expenses.length} input transactions</span>
          </div>

          <div className="space-y-2">
            {expenses.map(exp => (
              <div key={exp.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{exp.description}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {exp.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{exp.date}</span>
                </div>
                <div className="text-right font-extrabold text-sm text-slate-900">
                  ₹{exp.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Planner Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
              <input
                type="text"
                placeholder="e.g. Inspect drip filter pressure"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newTaskCategory}
                  onChange={e => setNewTaskCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="irrigation">Irrigation</option>
                  <option value="inspection">Inspection</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="harvest">Harvest</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="text"
                  placeholder="e.g. Today, Tomorrow"
                  value={newTaskDue}
                  onChange={e => setNewTaskDue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button onClick={() => setShowTaskModal(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newTaskTitle.trim()) return;
                  addTask({
                    title: newTaskTitle,
                    category: newTaskCategory,
                    dueDate: newTaskDue,
                    fieldId: selectedField?.id
                  });
                  setNewTaskTitle('');
                  setShowTaskModal(false);
                }}
                className="px-4 py-2 bg-purple-700 text-white font-bold rounded-xl hover:bg-purple-800"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Diary Entry */}
      {showDiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Record Farm Observation</h3>
              <button onClick={() => setShowDiaryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observation Type</label>
                <select
                  value={newDiaryType}
                  onChange={e => setNewDiaryType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="irrigation">Watering / Irrigation</option>
                  <option value="rainfall">Rainfall</option>
                  <option value="fertilizer">Fertilizer Application</option>
                  <option value="observation">Canopy Observation</option>
                  <option value="pest">Pest / Disease</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount / Dosage</label>
                <input
                  type="text"
                  placeholder="e.g. 90 mins, 15mm, 20kg"
                  value={newDiaryAmount}
                  onChange={e => setNewDiaryAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Farmer Notes *</label>
              <textarea
                rows={3}
                placeholder="Describe field conditions, plant changes, or weather details..."
                value={newDiaryNotes}
                onChange={e => setNewDiaryNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button onClick={() => setShowDiaryModal(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newDiaryNotes.trim()) return;
                  addDiaryEntry({
                    date: new Date().toISOString().split('T')[0],
                    type: newDiaryType,
                    amount: newDiaryAmount,
                    notes: newDiaryNotes,
                    fieldId: selectedField?.id || 'field-1'
                  });
                  setNewDiaryNotes('');
                  setNewDiaryAmount('');
                  setShowDiaryModal(false);
                }}
                className="px-4 py-2 bg-indigo-700 text-white font-bold rounded-xl hover:bg-indigo-800"
              >
                Log to Diary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Record Farm Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newExpenseCat}
                  onChange={e => setNewExpenseCat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="fertilizer">Fertilizer & Chemicals</option>
                  <option value="seed">Seeds & Seedlings</option>
                  <option value="labor">Labor</option>
                  <option value="irrigation">Irrigation & Power</option>
                  <option value="equipment">Equipment Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={newExpenseAmt}
                  onChange={e => setNewExpenseAmt(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description *</label>
              <input
                type="text"
                placeholder="e.g. 25kg Soluble Potash, Weeding labor"
                value={newExpenseDesc}
                onChange={e => setNewExpenseDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newExpenseDesc.trim() || newExpenseAmt <= 0) return;
                  addExpense({
                    date: new Date().toISOString().split('T')[0],
                    category: newExpenseCat,
                    description: newExpenseDesc,
                    amount: newExpenseAmt,
                    fieldId: selectedField?.id || 'field-1'
                  });
                  setNewExpenseDesc('');
                  setShowExpenseModal(false);
                }}
                className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-900"
              >
                Record Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
