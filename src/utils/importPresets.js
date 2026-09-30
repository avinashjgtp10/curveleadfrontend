export const IMPORT_FIELDS = [
  "name",
  "phone",
  "email",
  "source",
  "stage",
  "notes",
  "deal_value",
  "city",
  "lead_date",
];
const aliases = {
  name: ["name", "full name", "lead name", "contact name", "customer name"],
  phone: [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "whatsapp number",
    "whatsapp",
    "contact number",
  ],
  email: ["email", "email address"],
  source: ["source", "lead source"],
  stage: ["stage", "status"],
  notes: ["notes", "remarks"],
  city: ["city", "location"],
  lead_date: ["created date", "lead date", "created at"],
};
export function presetMapping(headers, preset) {
  const special =
    {
      privyr: {
        name: ["contact name"],
        phone: ["phone numbers"],
        notes: ["description"],
      },
      aisensy: { name: ["user name"], phone: ["mobile number"] },
      interakt: {
        name: ["full name"],
        phone: ["phone number"],
        city: ["city"],
      },
    }[preset] || {};
  return Object.fromEntries(
    headers.flatMap((h) => {
      const norm = h.trim().toLowerCase().replaceAll("_", " ");
      const field = IMPORT_FIELDS.find((f) =>
        [
          ...(special[f] || []),
          ...(aliases[f] || []),
          f.replaceAll("_", " "),
        ].includes(norm),
      );
      return field ? [[h, field]] : [];
    }),
  );
}
