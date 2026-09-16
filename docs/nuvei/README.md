# Nuvei and Datafast integration, status and evidence

Last updated 16 September 2026.

Start here:

- [TEST_RESULTS.md](TEST_RESULTS.md) — every component, its state, what is still needed from Nuvei, and what is not yet tested with the reason.
- [ADMIN_ACCESS_VERIFICATION.md](ADMIN_ACCESS_VERIFICATION.md) — the admin access check on your administrator account, point by point, on the live site.

This repository is public, so no credentials, application codes, customer data or private email addresses appear in these pages or screenshots.

## Evidence

Subscription activated on the approved checkout:

![Subscription activated](screenshots/subscription-activated.png)

Checkout in English, Spanish and Portuguese. The language comes from the address: /checkout, /es/checkout and /pt/checkout. The card fields come from Nuvei's tokenization form. We send that form the page language and Nuvei serves it marked with that language, but the card holder and card number labels are fixed in Spanish inside Nuvei's own script, so they read Spanish on all three:

![English](screenshots/checkout-english.png)
![Spanish](screenshots/checkout-spanish.png)
![Portuguese](screenshots/checkout-portuguese.png)

A gateway refusal is shown as a processing problem, never as a card decline, and grants no access:

![Gateway error handled](screenshots/gateway-error-handled.png)

A refunded customer keeps their login on the free tier and can subscribe again:

![Refunded customer keeps access](screenshots/refunded-customer-keeps-access.png)

A card payment entered and submitted on Nuvei's own hosted Checkout page. The application code and the payer email are hidden:

![Nuvei hosted checkout](screenshots/nuvei-hosted-checkout-payment.png)

The Link to Pay link Nuvei returns currently opens a 404 page on Nuvei's own site, because the Link to Pay application is not activated:

![Link to Pay 404](screenshots/link-to-pay-404.png)

Admin area working for your administrator account, before and after signing out and back in. Customer figures and details are hidden:

![Admin area](screenshots/admin-area-working.png)
![Admin after re-login](screenshots/admin-after-relogin.png)

## What we need from Nuvei

1. Register the callback URL on the merchant application: `https://backend.cortexaaicrm.com/api/nuvei/callback`
2. Activate the Link to Pay application. The Link to Pay credentials you sent are rejected with "Application not found", and links created under the cards application return 404.
3. Enable 3D Secure on the staging application, or provide a 3DS enrolled card, plus a Diners card that asks for a one time password.
4. Fix the card form labels. Our checkout sends the page language, en, es or pt, and Nuvei's form page is served with that language, but Nuvei's form script, payment_2.14.9, has the card holder and card number labels fixed in Spanish, "Nombre del titular" and "Número de tarjeta". Only Nuvei can change that script.
5. Confirm that 3D Secure on Add Card is active for this account. Nuvei's own card form sends the 3D Secure browser data and runs any verification step inside the form, so there is nothing for the merchant to pass.
6. Production credentials and production approval before any real card is charged.
