// ---------------------------------------------------------------------------
// FinePrint — built-in sample documents so anyone can try the app in one
// click (judges included). Short samples run on-device; the long one routes
// to the cloud, so a single click each demonstrates both halves of the
// hybrid inference story.
// ---------------------------------------------------------------------------

export const SAMPLES = [
  {
    id: 'freelance',
    title: 'Freelance design contract (short)',
    note: 'Short document — runs on-device with Gemini Nano.',
    text: `FREELANCE SERVICES AGREEMENT

This Agreement is between Studio North ("Client") and Jane Doe ("Designer"), effective November 1, 2026.

1. SERVICES. Designer will deliver a logo package and brand guide by December 15, 2026.
2. PAYMENT. Client will pay $2,400 in two instalments: 50% on signing, 50% on delivery. Late payments incur interest of 2% per month.
3. REVISIONS. The fee includes two rounds of revisions. Extra rounds cost $150 each.
4. OWNERSHIP. All rights transfer to the Client only after full payment is received. Until then, Designer keeps all rights.
5. TERMINATION. Either party may end this Agreement with 14 days written notice. If the Client ends it early, the Designer keeps the first instalment and is paid for work completed.
6. LIABILITY. Designer's total liability is limited to the fees paid under this Agreement.
7. GOVERNING LAW. This Agreement is governed by the laws of California.`
  },
  {
    id: 'tos',
    title: 'App Terms of Service (short)',
    note: 'Short document — runs on-device with Gemini Nano.',
    text: `TERMS OF SERVICE — SnapList App (last updated October 2026)

1. ACCEPTANCE. By creating an account you agree to these Terms. If you do not agree, do not use SnapList.
2. YOUR CONTENT. You keep ownership of photos you upload. By uploading, you grant SnapList a worldwide, royalty-free licence to store, display and share your photos with people you choose, and to use them in SnapList marketing.
3. ACCOUNT. You must be 13 or older. You are responsible for keeping your password secret. SnapList may suspend your account at any time, for any reason, without notice.
4. SUBSCRIPTION. SnapList Pro costs $9.99 per month and renews automatically until you cancel. Cancel at least 24 hours before renewal to avoid being charged. No refunds for partial months.
5. DATA. SnapList collects your photos, location and device information. We share anonymised data with advertising partners.
6. CHANGES. We may change these Terms at any time. We will post the new version in the app. Continuing to use SnapList means you accept the changes.
7. DISPUTES. Any dispute must be resolved by binding arbitration in Delaware. You waive your right to a jury trial and to join a class action.`
  },
  {
    id: 'rental',
    title: 'Residential lease (long)',
    note: 'Long document — routes to the cloud (Gemini 2.5 Flash), in chunks.',
    text: `RESIDENTIAL LEASE AGREEMENT

This Lease is entered into on March 1, 2026, between Greenfield Properties LLC ("Landlord") and Alex Morgan ("Tenant"), for the property at 412 Oak Street, Apartment 3B, Springfield.

1. TERM. The lease term is 12 months, from April 1, 2026 to March 31, 2027. After the term ends, the tenancy continues month-to-month unless either party gives 60 days written notice.
2. RENT. Monthly rent is $1,850, due on the 1st of each month. Rent paid after the 5th incurs a late fee of $75 plus $10 per additional day. Returned payments incur a $50 fee. Rent may be increased once per year with 60 days notice.
3. SECURITY DEPOSIT. Tenant pays a deposit of $1,850 before move-in. The deposit covers unpaid rent and damage beyond normal wear. Landlord will return the deposit within 21 days after move-out, minus any lawful deductions, with an itemised list.
4. UTILITIES. Tenant pays electricity, gas, internet and water. Landlord pays trash collection and building maintenance. Tenant must keep utilities connected for the whole term.
5. USE AND OCCUPANCY. The apartment is for residential use only, by the Tenant and two named occupants. No subletting or short-term rental (including Airbnb) is allowed without written consent. No smoking inside. Pets are allowed only with a $300 pet deposit and a $25 monthly pet fee, and only one pet under 25 pounds.
6. MAINTENANCE AND REPAIRS. Tenant must keep the apartment clean and promptly report problems in writing. Landlord will handle structural repairs and appliance failures within 14 days of written notice. Tenant pays for damage caused by Tenant or guests. Tenant may not make alterations, paint walls, or install fixtures without written approval.
7. ENTRY. Landlord may enter with 24 hours notice for inspections, repairs, or showings. In an emergency, Landlord may enter without notice.
8. TERMINATION. Tenant may end the lease early by paying a fee equal to two months rent plus forfeiting the deposit. Landlord may end the lease for non-payment after a 3-day notice to pay, or for serious violations after a 10-day notice to cure.
9. INSURANCE. Tenant is strongly encouraged to carry renters insurance. Landlord is not liable for Tenant's personal property under any circumstances.
10. PARKING. One parking space is included. Additional spaces cost $75 per month, subject to availability. Landlord may tow unauthorised vehicles at the owner's expense.
11. RENEWAL. Landlord will offer renewal terms 90 days before the lease ends. If Tenant does not respond within 30 days, the lease converts to month-to-month at a rent 10% higher than the current rent.
12. GOVERNING LAW. This Lease is governed by the laws of the State of Illinois. Any dispute will be resolved in the courts of Cook County.`
  }
];
