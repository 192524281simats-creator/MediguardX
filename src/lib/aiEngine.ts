// Local Rule-Based AI Safety Engine
// All outputs are educational — not medical advice

import type { AICheckResult, AnomalyDetection, Prescription } from '@/types';

interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

const DRUG_CLASS_MAP: Record<string, string> = {
  'Metformin': 'Biguanides',
  'Glipizide': 'Sulfonylureas',
  'Glibenclamide': 'Sulfonylureas',
  'Gliclazide': 'Sulfonylureas',
  'Insulin': 'Insulin',
  'Atorvastatin': 'Statins',
  'Rosuvastatin': 'Statins',
  'Simvastatin': 'Statins',
  'Amlodipine': 'Calcium Channel Blockers',
  'Nifedipine': 'Calcium Channel Blockers',
  'Amoxicillin': 'Penicillin Antibiotics',
  'Ampicillin': 'Penicillin Antibiotics',
  'Cloxacillin': 'Penicillin Antibiotics',
  'Cetirizine': 'Antihistamines',
  'Loratadine': 'Antihistamines',
  'Paracetamol': 'Analgesics/Antipyretics',
  'Ibuprofen': 'NSAIDs',
  'Aspirin': 'NSAIDs',
  'Naproxen': 'NSAIDs',
  'Omeprazole': 'Proton Pump Inhibitors',
  'Pantoprazole': 'Proton Pump Inhibitors',
  'Warfarin': 'Anticoagulants',
  'Clopidogrel': 'Antiplatelet',
  'Lisinopril': 'ACE Inhibitors',
  'Enalapril': 'ACE Inhibitors',
};

const KNOWN_INTERACTIONS: DrugInteraction[] = [
  {
    drugA: 'Warfarin', drugB: 'Aspirin',
    severity: 'HIGH',
    explanation: 'Concurrent use of Warfarin and Aspirin significantly increases bleeding risk.',
  },
  {
    drugA: 'Metformin', drugB: 'Glipizide',
    severity: 'MEDIUM',
    explanation: 'Combined use of Metformin and Glipizide increases risk of hypoglycaemia. Blood sugar monitoring recommended.',
  },
  {
    drugA: 'Metformin', drugB: 'Insulin',
    severity: 'MEDIUM',
    explanation: 'Combined use increases hypoglycaemia risk. Dose adjustment may be required.',
  },
  {
    drugA: 'Atorvastatin', drugB: 'Simvastatin',
    severity: 'HIGH',
    explanation: 'Two statins prescribed simultaneously — duplicate drug class. Risk of rhabdomyolysis.',
  },
  {
    drugA: 'Ibuprofen', drugB: 'Lisinopril',
    severity: 'MEDIUM',
    explanation: 'NSAIDs can reduce the antihypertensive effect of ACE inhibitors and impair renal function.',
  },
  {
    drugA: 'Warfarin', drugB: 'Ibuprofen',
    severity: 'HIGH',
    explanation: 'NSAIDs combined with anticoagulants significantly increases bleeding risk.',
  },
];

const ALLERGY_CLASSES: Record<string, string[]> = {
  'Penicillin': ['Penicillin Antibiotics', 'Amoxicillin', 'Ampicillin', 'Cloxacillin'],
  'Sulfa drugs': ['Sulfonylureas', 'Glipizide', 'Glibenclamide', 'Gliclazide'],
  'NSAIDs': ['NSAIDs', 'Ibuprofen', 'Aspirin', 'Naproxen'],
};

const PATIENT_ALLERGIES = ['Penicillin', 'Sulfa drugs', 'Shellfish'];

export function runAISafetyCheck(
  medicines: string[],
  existingMeds: string[] = ['Metformin', 'Atorvastatin']
): AICheckResult {
  const triggeredRules: string[] = [];
  let maxSeverity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  const flaggedMedicines: string[] = [];
  const explanations: string[] = [];

  const allMeds = [...existingMeds, ...medicines];

  // Rule 1: Allergy check
  for (const med of medicines) {
    const medClass = DRUG_CLASS_MAP[med] || med;
    for (const allergy of PATIENT_ALLERGIES) {
      const allergyMeds = ALLERGY_CLASSES[allergy] || [];
      if (allergyMeds.includes(med) || allergyMeds.includes(medClass)) {
        triggeredRules.push(`ALLERGY_CONFLICT: Patient allergic to ${allergy} — ${med} belongs to this group`);
        flaggedMedicines.push(med);
        maxSeverity = 'HIGH';
        explanations.push(`${med} belongs to the ${medClass} class, which the patient is allergic to (${allergy} allergy on record).`);
      }
    }
  }

  // Rule 2: Known drug interactions
  for (let i = 0; i < allMeds.length; i++) {
    for (let j = i + 1; j < allMeds.length; j++) {
      const a = allMeds[i];
      const b = allMeds[j];
      const interaction = KNOWN_INTERACTIONS.find(
        int => (int.drugA === a && int.drugB === b) || (int.drugA === b && int.drugB === a)
      );
      if (interaction) {
        triggeredRules.push(`DRUG_INTERACTION: ${a} + ${b} — ${interaction.severity} severity`);
        if (!flaggedMedicines.includes(a)) flaggedMedicines.push(a);
        if (!flaggedMedicines.includes(b)) flaggedMedicines.push(b);
        if (interaction.severity === 'HIGH') maxSeverity = 'HIGH';
        else if (interaction.severity === 'MEDIUM' && maxSeverity !== 'HIGH') maxSeverity = 'MEDIUM';
        explanations.push(interaction.explanation);
      }
    }
  }

  // Rule 3: Duplicate drug class
  const classMap: Record<string, string[]> = {};
  for (const med of allMeds) {
    const cls = DRUG_CLASS_MAP[med];
    if (cls) {
      classMap[cls] = classMap[cls] || [];
      classMap[cls].push(med);
    }
  }
  for (const [cls, meds] of Object.entries(classMap)) {
    if (meds.length > 1) {
      const unique = [...new Set(meds)];
      if (unique.length > 1) {
        triggeredRules.push(`DUPLICATE_DRUG_CLASS: Multiple ${cls} medications — ${meds.join(', ')}`);
        meds.forEach(m => { if (!flaggedMedicines.includes(m)) flaggedMedicines.push(m); });
        if (maxSeverity === 'LOW') maxSeverity = 'MEDIUM';
        explanations.push(`Multiple medications of the same class (${cls}) detected: ${meds.join(' + ')}. Risk of additive side effects.`);
      }
    }
  }

  // Rule 4: Suspicious repetition (same med in new and existing)
  for (const med of medicines) {
    if (existingMeds.includes(med)) {
      triggeredRules.push(`DUPLICATE_PRESCRIPTION: ${med} already in active medications`);
      if (!flaggedMedicines.includes(med)) flaggedMedicines.push(med);
      if (maxSeverity === 'LOW') maxSeverity = 'MEDIUM';
      explanations.push(`${med} is already prescribed as an active medication. Duplicate prescription may lead to overdose.`);
    }
  }

  const riskLevel = maxSeverity;
  const explanation = explanations.length
    ? explanations.join(' ')
    : 'No significant safety issues detected based on available rule-based analysis.';

  const recommendation = riskLevel === 'HIGH'
    ? 'URGENT: Do not dispense without consulting prescribing physician. Patient allergy or critical interaction detected.'
    : riskLevel === 'MEDIUM'
    ? 'CAUTION: Review with prescribing physician. Monitor patient closely if combination is prescribed.'
    : 'No immediate action required. Continue standard care protocols.';

  return {
    riskLevel,
    triggeredRules: triggeredRules.length ? triggeredRules : ['NO_ISSUES: All safety checks passed'],
    explanation,
    recommendation,
    flaggedMedicines,
  };
}

export function explainReport(reportName: string, findings: string): {
  summary: string;
  keyFindings: string[];
  simpleExplanation: string;
  importantNotes: string;
} {
  // Local rule-based report explanation
  const isAbnormal = findings.toLowerCase().includes('high') || findings.toLowerCase().includes('elevated') || findings.toLowerCase().includes('abnormal');

  return {
    summary: `${reportName} — AI-assisted analysis (educational purposes only)`,
    keyFindings: findings.split(',').map(f => f.trim()).filter(Boolean),
    simpleExplanation: isAbnormal
      ? `Some values in this report are outside the normal reference range. This may indicate a health condition that requires attention from your healthcare provider. The highlighted values should be reviewed at your next consultation.`
      : `Your test results appear to be within the normal reference ranges. Regular monitoring is recommended as part of your ongoing healthcare management.`,
    importantNotes: `This explanation is generated by a local educational rule engine. It is NOT a medical diagnosis. Please consult your doctor for interpretation of test results.`,
  };
}

export function detectAnomalies(prescriptions: Prescription[]): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];

  // Check duplicate drug class
  const classMap: Record<string, Prescription[]> = {};
  for (const rx of prescriptions) {
    const cls = rx.drugClass;
    classMap[cls] = classMap[cls] || [];
    classMap[cls].push(rx);
  }

  for (const [cls, rxs] of Object.entries(classMap)) {
    if (rxs.length > 1 && rxs.filter(r => r.status === 'ACTIVE').length > 1) {
      const activeRxs = rxs.filter(r => r.status === 'ACTIVE');
      anomalies.push({
        id: `anom-gen-${cls}`,
        type: 'DUPLICATE_DRUG_CLASS',
        severity: 'HIGH',
        description: `Multiple active prescriptions in drug class: ${cls}`,
        evidence: activeRxs.map(r => `${r.medicine} ${r.dosage} (${r.doctorName}, ${r.date})`).join(' | '),
        prescriptionIds: activeRxs.map(r => r.id),
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // Check allergy conflicts
  for (const rx of prescriptions) {
    for (const allergy of PATIENT_ALLERGIES) {
      const allergyMeds = ALLERGY_CLASSES[allergy] || [];
      if (allergyMeds.includes(rx.medicine) || allergyMeds.includes(DRUG_CLASS_MAP[rx.medicine] || '')) {
        anomalies.push({
          id: `anom-allergy-${rx.id}`,
          type: 'UNUSUAL_DOSAGE',
          severity: 'HIGH',
          description: `${rx.medicine} prescribed despite documented ${allergy} allergy`,
          evidence: `Patient has ${allergy} allergy on record. ${rx.medicine} belongs to allergic drug group.`,
          prescriptionIds: [rx.id],
          detectedAt: rx.date,
        });
      }
    }
  }

  return anomalies;
}

export function getDrugClass(medicine: string): string {
  return DRUG_CLASS_MAP[medicine] || 'Unknown';
}

export const AVAILABLE_MEDICINES = Object.keys(DRUG_CLASS_MAP);
