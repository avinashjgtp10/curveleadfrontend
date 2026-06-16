import PublicPageLayout from '../components/layout/PublicPageLayout';

const Section = ({ id, title, children }) => (
  <section id={id} className="mt-10 first:mt-0">
    <h2 className="text-xl font-bold text-gray-950">{title}</h2>
    <div className="mt-4 space-y-4 text-gray-600 leading-7">{children}</div>
  </section>
);

const PrivacyPolicyPage = () => (
  <PublicPageLayout>
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <div className="mb-10 border-b border-gray-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">Legal</p>
        <h1 className="text-4xl font-extrabold text-gray-950">Privacy Policy</h1>
        <p className="mt-3 text-gray-500 text-sm">Effective date: June 16, 2026 &nbsp;·&nbsp; Last updated: June 16, 2026</p>
        <p className="mt-5 text-gray-600 leading-7">
          This Privacy Policy describes how Curve Lead (&ldquo;CurveLead&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects the information you provide when you use our lead management platform at <strong>curvelead.com</strong>. By accessing or using CurveLead, you agree to the practices described in this policy.
        </p>
      </div>

      <Section id="information-we-collect" title="1. Information We Collect">
        <p>We collect the following categories of information to provide and improve the CurveLead service:</p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li><strong>Account and business details:</strong> Your name, email address, phone number, business name, and other registration information you provide when creating a CurveLead account.</li>
          <li><strong>Lead data from Meta / Facebook lead forms:</strong> When you connect your Facebook Page(s) and lead form(s), we retrieve lead submissions on your behalf. This data may include the lead&rsquo;s name, phone number, email address, city, answers to custom form questions, campaign name, ad set, ad name, form name, Page name, and related source or metadata provided by Meta.</li>
          <li><strong>Page and form details:</strong> Information about the Facebook Pages, lead forms, and business assets you have authorized us to access, solely to display and organize lead data within your dashboard.</li>
          <li><strong>Usage and log data:</strong> Information about how you interact with the platform, including IP address, browser type, device information, pages visited, and feature usage, used for security, performance, and service improvement.</li>
          <li><strong>Support communications:</strong> Messages, emails, or other communications you send to our support team.</li>
        </ul>
      </Section>

      <Section id="how-we-use" title="2. How We Use Your Information">
        <p>We use the information we collect for the following purposes only:</p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li><strong>Lead management and organization:</strong> To display, assign, filter, and track the leads retrieved from your connected Meta lead forms in your CurveLead dashboard.</li>
          <li><strong>Follow-up and notifications:</strong> To power follow-up scheduling, reminders, and notification features so your sales team can respond to leads in a timely manner.</li>
          <li><strong>Assignment and team collaboration:</strong> To allow you to assign leads to staff members, track lead ownership, and maintain team activity within your account.</li>
          <li><strong>Customer support:</strong> To respond to your questions, troubleshoot issues, and provide onboarding assistance.</li>
          <li><strong>Service improvement:</strong> To analyze aggregate usage patterns, fix bugs, and develop new features. We do not use individual lead data for product analytics.</li>
          <li><strong>Legal and compliance:</strong> To comply with applicable laws, regulations, and our obligations under Meta&rsquo;s Platform Terms.</li>
        </ul>
        <p>We do not use lead data for advertising, profiling, or any purpose beyond operating the CurveLead service for you.</p>
      </Section>

      <Section id="meta-platform" title="3. Meta / Facebook Platform Data">
        <p>
          CurveLead integrates with the Meta (Facebook) Ads platform to retrieve lead form submissions. Access to your Meta Pages, lead forms, and associated data is granted only with your explicit authorization through the Meta OAuth login flow.
        </p>
        <p>
          Data obtained through Meta&rsquo;s APIs is used strictly to provide the lead management features you have requested. We comply with <a href="https://developers.facebook.com/terms/" className="text-brand-600 underline hover:text-brand-700" target="_blank" rel="noopener noreferrer">Meta&rsquo;s Platform Terms</a> and applicable data policies. We do not share, sell, or transfer this data to third parties for their independent use.
        </p>
        <p>
          You may revoke CurveLead&rsquo;s access to your Meta account at any time through your Facebook account settings under <em>Apps and Websites</em>. Revoking access will stop new lead data from being retrieved; existing data stored in your CurveLead account can be deleted upon request (see Section 7).
        </p>
      </Section>

      <Section id="data-sharing" title="4. Data Sharing and Disclosure">
        <p>We do not sell, rent, or trade your lead data or personal information to any third party.</p>
        <p>We may share information only in the following limited circumstances:</p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li><strong>Service providers:</strong> We engage trusted third-party vendors (such as cloud hosting, database, and email providers) who process data on our behalf under strict confidentiality obligations. These providers are permitted to use your data only to perform services for us.</li>
          <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or government authority, or to protect the rights, property, or safety of CurveLead, our clients, or others.</li>
          <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity, subject to the same privacy commitments described here.</li>
        </ul>
      </Section>

      <Section id="data-security" title="5. Data Security">
        <p>
          We implement industry-standard security measures including encryption in transit (TLS), access controls, and regular security reviews to protect your account and lead data. However, no method of electronic transmission or storage is 100% secure. We encourage you to use a strong password and to contact us immediately if you suspect unauthorized access to your account.
        </p>
      </Section>

      <Section id="data-retention" title="6. Data Retention">
        <p>
          We retain your account data and lead data for as long as your CurveLead account is active or as needed to provide you the service. If you cancel your account, we will delete or anonymize your data within 90 days, unless we are required to retain it for legal or compliance purposes.
        </p>
        <p>
          Lead data retrieved from Meta is not stored beyond what is necessary to operate your dashboard. Deleting a lead within CurveLead removes it from our database.
        </p>
      </Section>

      <Section id="your-rights" title="7. Your Rights — Data Access and Deletion">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-2 mt-3">
          <li>Request a copy of the personal data and lead data we hold about you or your account.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your account and all associated data, including lead data retrieved from Meta.</li>
          <li>Withdraw your authorization for CurveLead to access your Meta Pages and lead forms at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href="mailto:support@curvelead.com" className="text-brand-600 underline hover:text-brand-700">support@curvelead.com</a>. We will respond to your request within 30 days.
        </p>
      </Section>

      <Section id="cookies" title="8. Cookies and Tracking">
        <p>
          CurveLead uses essential cookies to maintain your login session and platform functionality. We do not use third-party advertising cookies or behavioral tracking cookies. You may configure your browser to refuse cookies, but doing so may affect your ability to use the platform.
        </p>
      </Section>

      <Section id="children" title="9. Children's Privacy">
        <p>
          CurveLead is intended for use by businesses and their authorized staff. We do not knowingly collect personal information from individuals under the age of 18. If you believe a minor has provided us with information, please contact us at <a href="mailto:support@curvelead.com" className="text-brand-600 underline hover:text-brand-700">support@curvelead.com</a> and we will promptly delete it.
        </p>
      </Section>

      <Section id="changes" title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo; date at the top of this page and, for material changes, notify you by email or by a notice within the platform. Continued use of CurveLead after changes are posted constitutes your acceptance of the updated policy.
        </p>
      </Section>

      <Section id="contact" title="11. Contact Us">
        <p>If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please reach out:</p>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="font-semibold text-gray-950">Curve Lead</p>
          <p className="mt-1">Email: <a href="mailto:support@curvelead.com" className="text-brand-600 underline hover:text-brand-700">support@curvelead.com</a></p>
          <p className="mt-1">Website: <a href="https://curvelead.com" className="text-brand-600 underline hover:text-brand-700">curvelead.com</a></p>
        </div>
      </Section>
    </div>
  </PublicPageLayout>
);

export default PrivacyPolicyPage;
