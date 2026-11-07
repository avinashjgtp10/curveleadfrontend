import { Link } from 'react-router-dom';
import AutomationBuilder from '../../pages/LeadAutomation/AutomationBuilder';

// Sequences and the triggers that start them, in the WhatsApp Automation section. (Assignment rules are not about WhatsApp and
// stay on the Lead Automation page.)
export default function SequencesTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Build follow-ups that send themselves, and choose what starts them. To see which leads are in a sequence right now, open{' '}
        <Link to="/lead-automation" className="text-brand-600 font-semibold underline">Automation Leads</Link>.
      </p>
      <AutomationBuilder part="automation" />
    </div>
  );
}
