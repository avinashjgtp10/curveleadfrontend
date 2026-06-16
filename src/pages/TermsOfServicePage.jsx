import PublicPageLayout from '../components/layout/PublicPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mt-10 first:mt-0">
    <h2 className="text-xl font-bold text-gray-950">{title}</h2>
    <div className="mt-4 space-y-4 text-gray-600 leading-7">{children}</div>
  </section>
);

const TermsOfServicePage = () => (
  <PublicPageLayout>
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <div className="mb-10 border-b border-gray-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">Legal</p>
        <h1 className="text-4xl font-extrabold text-gray-950">Terms of Service</h1>
        <p className="mt-3 text-gray-500 text-sm">Effective date: June 16, 2026 &nbsp;·&nbsp; Last updated: June 16, 2026</p>
        <p className="mt-5 text-gray-600 leading-7">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the CurveLead platform and services operated by Curve Lead (&ldquo;CurveLead&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) at <strong>curvelead.com</strong>. Please read these Terms carefully before using the service. By registering for or using CurveLead, you agree to be bound by these Terms.
        </p>
      </div>

      <Section id="acceptance" title="1. Acceptance of Terms">
        <p>
          By creating an account, accessing, or using CurveLead, you confirm that you are at least 18 years of age, have the legal authority to enter into these Terms on behalf of yourself or your organization, and agree to comply with all applicable laws and regulations.
        </p>
        <p>
          If you do not agree to these Terms, you must not use the CurveLead service.
        </p>
      </Section>

      <Section id="description" title="2. Description of Service">
        <p>
          CurveLead is a lead management platform that helps businesses collect, organize, assign, and follow up with leads generated from Meta (Facebook and Instagram) lead ads and other sources. The service includes a lead management dashboard, follow-up scheduling, team assignment, campaign reporting, and related tools.
        </p>
        <p>
          We reserve the right to modify, expand, or discontinue any feature of the service at any time with reasonable notice where possible.
        </p>
      </Section>

      <Section id="permissions" title="3. User Permissions and Meta / Facebook Authorization">
        <p>
          To use the Meta Ads lead capture features of CurveLead, you must connect your Facebook account and grant CurveLead permission to access your Facebook Pages, lead forms, and related business assets. By doing so, you represent and warrant that:
        </p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li>You are the authorized owner or administrator of the Facebook Pages and lead forms you connect.</li>
          <li>You have the right and authority to grant CurveLead access to those Pages, forms, and associated lead data.</li>
          <li>You have obtained any required consents from your business clients or partners whose assets you connect on their behalf.</li>
          <li>Your use of Meta platform data through CurveLead complies with <a href="https://developers.facebook.com/terms/" className="text-brand-600 underline hover:text-brand-700" target="_blank" rel="noopener noreferrer">Meta&rsquo;s Platform Terms</a>, <a href="https://www.facebook.com/policies/ads/" className="text-brand-600 underline hover:text-brand-700" target="_blank" rel="noopener noreferrer">Meta&rsquo;s Advertising Policies</a>, and all other applicable Meta developer and business policies.</li>
        </ul>
      </Section>

      <Section id="permitted-use" title="4. Permitted Use of the Service">
        <p>CurveLead is provided solely for the purpose of lead management, sales follow-up, team coordination, and related business activities. You agree to use the service only for lawful purposes and in accordance with these Terms.</p>
        <p>You must not:</p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li>Use CurveLead to engage in spam, unsolicited messaging, or any form of communication that violates applicable laws or platform policies.</li>
          <li>Access or attempt to access accounts, data, or systems you are not authorized to use.</li>
          <li>Reverse-engineer, decompile, or otherwise attempt to extract the source code of CurveLead.</li>
          <li>Use the service in a manner that could damage, disable, or impair the platform or interfere with other users.</li>
          <li>Resell, sublicense, or redistribute CurveLead or its data without our written permission.</li>
        </ul>
      </Section>

      <Section id="lawful-use" title="5. Lawful Use of Lead and Contact Data">
        <p>
          You are solely responsible for how you use the lead data retrieved through CurveLead, including names, phone numbers, email addresses, and other personal information submitted by individuals through Meta lead forms.
        </p>
        <p>You agree to:</p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li>Use lead and contact data only for legitimate sales, marketing, and customer follow-up activities that the lead consented to when submitting their information.</li>
          <li>Comply with all applicable privacy and data protection laws, including but not limited to the Information Technology Act (India), GDPR (where applicable), and any other regulations governing the collection and use of personal data in your jurisdiction.</li>
          <li>Honor any opt-out or do-not-contact requests from leads or contacts promptly.</li>
          <li>Not use lead data obtained through Meta lead forms for purposes that violate Meta&rsquo;s terms or the lead&rsquo;s reasonable expectations at the time of form submission.</li>
        </ul>
        <p>
          CurveLead provides tools to help you manage leads; however, we are not responsible for how you communicate with or treat your leads. Unlawful use of contact data is solely your responsibility.
        </p>
      </Section>

      <Section id="meta-compliance" title="6. Meta Platform Policy Compliance">
        <p>
          You agree to comply with Meta&rsquo;s Platform Terms and all related policies as a condition of using CurveLead&rsquo;s Meta integration. This includes, but is not limited to:
        </p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li>Using platform data only for the purposes permitted by Meta&rsquo;s terms.</li>
          <li>Not storing or using Meta-provided lead data in ways that violate Meta&rsquo;s data use policies.</li>
          <li>Ensuring your advertising content and lead forms comply with Meta&rsquo;s Advertising Standards.</li>
        </ul>
        <p>
          CurveLead may be required to terminate or restrict your access to Meta-connected features if your account is found to be in violation of Meta&rsquo;s policies, or if Meta requires us to do so.
        </p>
      </Section>

      <Section id="accounts" title="7. Accounts and Security">
        <p>
          You are responsible for maintaining the confidentiality of your CurveLead login credentials and for all activity that occurs under your account. You must notify us immediately at <a href="mailto:support@curvelead.com" className="text-brand-600 underline hover:text-brand-700">support@curvelead.com</a> if you suspect unauthorized access to your account.
        </p>
        <p>
          You may invite staff members to your CurveLead workspace. You are responsible for ensuring that your invited users also comply with these Terms.
        </p>
      </Section>

      <Section id="availability" title="8. Service Availability">
        <p>
          We strive to keep CurveLead available and operational, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, third-party outages (including Meta platform downtime), or circumstances beyond our control.
        </p>
        <p>
          We are not liable for any losses or damages resulting from service downtime, data sync delays from Meta, or interruptions in platform availability.
        </p>
      </Section>

      <Section id="suspension" title="9. Misuse and Suspension">
        <p>
          We reserve the right to suspend or terminate your account, with or without notice, if we determine in our reasonable judgment that you have:
        </p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li>Violated these Terms or any applicable law.</li>
          <li>Violated Meta&rsquo;s Platform Terms or advertising policies in connection with your use of CurveLead.</li>
          <li>Used the service in a manner that is harmful, fraudulent, or abusive.</li>
          <li>Failed to pay applicable subscription fees.</li>
        </ul>
        <p>
          Upon termination, your right to access the service will immediately cease. We may retain or delete your data in accordance with our Privacy Policy and applicable law.
        </p>
      </Section>

      <Section id="billing" title="10. Billing and Payments">
        <p>
          CurveLead offers a free plan and paid subscription plans. Subscription fees are charged in advance on a monthly or annual basis. All fees are non-refundable except as required by applicable law or as stated in a separate written agreement.
        </p>
        <p>
          We reserve the right to change our pricing with at least 30 days&rsquo; advance notice communicated via email or within the platform.
        </p>
      </Section>

      <Section id="ip" title="11. Intellectual Property">
        <p>
          CurveLead and all associated software, designs, trademarks, and content are the property of Curve Lead and are protected by applicable intellectual property laws. These Terms do not grant you any ownership rights in the platform.
        </p>
        <p>
          You retain ownership of all lead data, business data, and content you upload or generate through the service. You grant CurveLead a limited, non-exclusive license to store and process that data solely to provide the service to you.
        </p>
      </Section>

      <Section id="liability" title="12. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, CurveLead shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service, including loss of leads, revenue, data, or business opportunities.
        </p>
        <p>
          Our total liability to you for any claim arising under these Terms shall not exceed the amount you paid to us in the three months preceding the event giving rise to the claim.
        </p>
      </Section>

      <Section id="changes" title="13. Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we make material changes, we will notify you by email or by a prominent notice in the platform at least 14 days before the changes take effect. Continued use of CurveLead after the effective date of updated Terms constitutes your acceptance.
        </p>
      </Section>

      <Section id="governing-law" title="14. Governing Law">
        <p>
          These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of CurveLead shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra, India.
        </p>
      </Section>

      <Section id="contact" title="15. Contact Us">
        <p>If you have any questions about these Terms, please contact us:</p>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="font-semibold text-gray-950">Curve Lead</p>
          <p className="mt-1">Email: <a href="mailto:support@curvelead.com" className="text-brand-600 underline hover:text-brand-700">support@curvelead.com</a></p>
          <p className="mt-1">Website: <a href="https://curvelead.com" className="text-brand-600 underline hover:text-brand-700">curvelead.com</a></p>
        </div>
      </Section>
    </div>
  </PublicPageLayout>
);

export default TermsOfServicePage;
