import { printDocument, stampCircleHtml } from '@/lib/printDocument';
import { t } from '@/i18n';

export interface AccidentActN1PrintTemplateProps {
  actNumber: string;
  employerName: string;
  employerAddress: string;
  employerInn: string;
  accidentDate: string;
  accidentTime: string;
  investigationPeriod: string;
  injuredPerson: {
    fullName: string;
    age: number;
    position: string;
    experience: string;
    lastTrainingDate: string;
    lastBriefingDate: string;
  };
  accidentDescription: string;
  circumstances: string;
  causes: string;
  responsiblePersons: Array<{ name: string; position: string; violation: string }>;
  preventiveMeasures: string;
  committeeChairman: { name: string; position: string };
  committeeMembers: Array<{ name: string; position: string }>;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate and print an Accident Investigation Act N-1
 * per Government Resolution No. 73 (form N-1).
 */
export function printAccidentActN1(data: AccidentActN1PrintTemplateProps): void {
  const responsibleRows = data.responsiblePersons
    .map(
      (person, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>${escapeHtml(person.name)}</td>
        <td>${escapeHtml(person.position)}</td>
        <td>${escapeHtml(person.violation)}</td>
      </tr>`,
    )
    .join('');

  const committeeMemberSignatures = data.committeeMembers
    .map(
      (member) => `
      <div style="display:grid;grid-template-columns:180pt 1fr 150pt;gap:8pt;margin-bottom:10pt;align-items:end;">
        <div>
          <span style="font-size:9pt;color:#666;">${t('safety.accidentActN1Print.committeeMember')}</span><br/>
          <span style="font-size:9pt;">${escapeHtml(member.position)}</span>
        </div>
        <div style="border-bottom:0.5pt solid #333;height:16pt;"></div>
        <div style="font-size:9pt;text-align:center;">${escapeHtml(member.name)}</div>
      </div>`,
    )
    .join('');

  const bodyHtml = `
    <div class="doc-header">
      <div class="form-name">${t('safety.accidentActN1Print.formTitle')}</div>
      <div style="font-size:7pt;color:#999;margin-bottom:6pt;">${t('safety.accidentActN1Print.formSubtitle')}</div>
      <div class="doc-title">${t('safety.accidentActN1Print.actTitle', { number: data.actNumber })}</div>
      <div style="font-size:12pt;font-weight:bold;margin-bottom:8pt;">${t('safety.accidentActN1Print.actSubtitle')}</div>
    </div>

    <!-- Employer info -->
    <div class="section-title">${t('safety.accidentActN1Print.employerInfo')}</div>
    <table style="font-size:10pt;margin-bottom:12pt;">
      <tbody>
        <tr>
          <td style="width:40%;color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.employerName')}</td>
          <td style="border:none;padding:3pt 5pt;font-weight:bold;">${escapeHtml(data.employerName)}</td>
        </tr>
        <tr>
          <td style="color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.employerAddress')}</td>
          <td style="border:none;padding:3pt 5pt;">${escapeHtml(data.employerAddress)}</td>
        </tr>
        <tr>
          <td style="color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.employerInn')}</td>
          <td style="border:none;padding:3pt 5pt;">${escapeHtml(data.employerInn)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Accident date/time -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10pt;margin-bottom:12pt;font-size:10pt;">
      <div>
        <span style="color:#666;">${t('safety.accidentActN1Print.accidentDate')}:</span>
        <strong>${escapeHtml(data.accidentDate)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('safety.accidentActN1Print.accidentTime')}:</span>
        <strong>${escapeHtml(data.accidentTime)}</strong>
      </div>
      <div>
        <span style="color:#666;">${t('safety.accidentActN1Print.investigationPeriod')}:</span>
        <strong>${escapeHtml(data.investigationPeriod)}</strong>
      </div>
    </div>

    <!-- Injured person -->
    <div class="section-title">${t('safety.accidentActN1Print.injuredPersonSection')}</div>
    <table style="font-size:10pt;margin-bottom:12pt;">
      <tbody>
        <tr>
          <td style="width:40%;color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.injuredFullName')}</td>
          <td style="border:none;padding:3pt 5pt;font-weight:bold;">${escapeHtml(data.injuredPerson.fullName)}</td>
        </tr>
        <tr>
          <td style="color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.injuredAge')}</td>
          <td style="border:none;padding:3pt 5pt;">${data.injuredPerson.age}</td>
        </tr>
        <tr>
          <td style="color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.injuredPosition')}</td>
          <td style="border:none;padding:3pt 5pt;">${escapeHtml(data.injuredPerson.position)}</td>
        </tr>
        <tr>
          <td style="color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.injuredExperience')}</td>
          <td style="border:none;padding:3pt 5pt;">${escapeHtml(data.injuredPerson.experience)}</td>
        </tr>
        <tr>
          <td style="color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.injuredLastTraining')}</td>
          <td style="border:none;padding:3pt 5pt;">${escapeHtml(data.injuredPerson.lastTrainingDate)}</td>
        </tr>
        <tr>
          <td style="color:#666;border:none;padding:3pt 5pt;">${t('safety.accidentActN1Print.injuredLastBriefing')}</td>
          <td style="border:none;padding:3pt 5pt;">${escapeHtml(data.injuredPerson.lastBriefingDate)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Description and circumstances -->
    <div class="print-page-break"></div>
    <div class="section-title">${t('safety.accidentActN1Print.descriptionSection')}</div>

    <div style="margin-bottom:10pt;">
      <div style="font-weight:bold;font-size:10pt;margin-bottom:4pt;">${t('safety.accidentActN1Print.accidentDescription')}</div>
      <div style="font-size:10pt;white-space:pre-wrap;border:0.5pt solid #ccc;padding:6pt 8pt;">${escapeHtml(data.accidentDescription)}</div>
    </div>

    <div style="margin-bottom:10pt;">
      <div style="font-weight:bold;font-size:10pt;margin-bottom:4pt;">${t('safety.accidentActN1Print.circumstancesLabel')}</div>
      <div style="font-size:10pt;white-space:pre-wrap;border:0.5pt solid #ccc;padding:6pt 8pt;">${escapeHtml(data.circumstances)}</div>
    </div>

    <div style="margin-bottom:12pt;">
      <div style="font-weight:bold;font-size:10pt;margin-bottom:4pt;">${t('safety.accidentActN1Print.causesLabel')}</div>
      <div style="font-size:10pt;white-space:pre-wrap;border:0.5pt solid #ccc;padding:6pt 8pt;">${escapeHtml(data.causes)}</div>
    </div>

    <!-- Responsible persons -->
    ${data.responsiblePersons.length > 0 ? `
    <div class="section-title">${t('safety.accidentActN1Print.responsibleSection')}</div>
    <table>
      <thead>
        <tr>
          <th style="width:30px">&#8470;</th>
          <th>${t('safety.accidentActN1Print.responsibleName')}</th>
          <th>${t('safety.accidentActN1Print.responsiblePosition')}</th>
          <th>${t('safety.accidentActN1Print.responsibleViolation')}</th>
        </tr>
      </thead>
      <tbody>
        ${responsibleRows}
      </tbody>
    </table>` : ''}

    <!-- Preventive measures -->
    <div class="section-title">${t('safety.accidentActN1Print.preventiveMeasures')}</div>
    <div style="font-size:10pt;white-space:pre-wrap;border:0.5pt solid #ccc;padding:6pt 8pt;margin-bottom:16pt;">${escapeHtml(data.preventiveMeasures)}</div>

    <!-- Committee signatures -->
    <div class="section-title">${t('safety.accidentActN1Print.committeeSection')}</div>
    <div style="page-break-inside:avoid;">
      <div style="display:grid;grid-template-columns:180pt 1fr 150pt;gap:8pt;margin-bottom:10pt;align-items:end;">
        <div>
          <span style="font-size:9pt;color:#666;">${t('safety.accidentActN1Print.committeeChairman')}</span><br/>
          <span style="font-size:9pt;">${escapeHtml(data.committeeChairman.position)}</span>
        </div>
        <div style="border-bottom:0.5pt solid #333;height:16pt;"></div>
        <div style="font-size:9pt;text-align:center;">${escapeHtml(data.committeeChairman.name)}</div>
      </div>
      ${committeeMemberSignatures}
    </div>

    <div style="display:flex;justify-content:center;margin-top:20pt;">
      ${stampCircleHtml()}
    </div>
  `;

  printDocument(
    `${t('safety.accidentActN1Print.formTitle')} - ${t('safety.accidentActN1Print.actTitle', { number: data.actNumber })}`,
    bodyHtml,
  );
}
