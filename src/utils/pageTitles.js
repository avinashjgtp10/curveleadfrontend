export const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/campaigns": "Campaigns",
  "/ads": "Ads Manager",
  "/ai-agent": "AI Agent",
  "/whatsapp": "WhatsApp",
  "/followups": "Follow-ups",
  "/appointments": "Appointments",
  "/lead-automation": "Lead Automation",
  "/automations": "Automations",
  "/staff": "Team",
  "/reports": "Reports",
  "/billing": "Billing",
  "/settings": "Settings",
  "/help": "Help & Support",
  "/brochures": "Brochures",
  "/gmb": "Google Business Profile",
  "/coaching": "Sales Coaching",
  "/integrations": "Integrations",
  "/quotations": "Quotations",
  "/q": "Quotation",
  "/login": "Log in",
  "/signup": "Sign up",
  "/forgot-password": "Forgot password",
  "/reset-password": "Reset password",
  "/accept-invite": "Accept invitation",
  "/privacy-policy": "Privacy policy",
  "/terms-of-service": "Terms of service",
  "/contact": "Contact us",
};
export const pageTitle = (pathname) =>
  PAGE_TITLES["/" + pathname.split("/")[1]] || "CurveLead";
export const documentTitle = (pathname) => {
  const title = pageTitle(pathname);
  return title === "CurveLead" ? title : `${title} · CurveLead`;
};
