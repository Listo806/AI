# Cortexa, Nuvei and Datafast integration, test results

Date: 16 September 2026
Environment: live site www.cortexaaicrm.com, backend connected to the Nuvei staging gateway with the development credentials supplied in your documentation email. Those credentials are installed on the backend now. No real card was charged.
Checkout: your approved design, unchanged. Only the technical payment connection behind it was built and tested.

## Answers to your four questions

Everything in the package was received: the documentation links for Checkout, Add Card, recurrence, refund, webhook and verify, the SDK links, the test cards, the card development credentials and the separate Link to Pay credentials.

The callback URL to register on the merchant application is https://backend.cortexaaicrm.com/api/nuvei/callback. The server verifies Nuvei's stoken signature on every callback, so no extra header or IP allow list is required.

What is still missing is on Nuvei's side and is listed at the end of this document.

Everything you asked for is implemented. What remains untested is also listed at the end, with the reason.

## Components and their state

| Component | State | Evidence |
|---|---|---|
| Nuvei Checkout for one time payments, init a reference | WORKING | hosted page renders with our application code, description and amount, screenshot HOSTED_checkout |
| Checkout payment confirmed by the signed callback | PASS | |
| Checkout payment with a tampered amount refused | PASS | |
| Checkout payment declined is recorded as declined | PASS | |
| Add Card, secure tokenization inside Nuvei's hosted fields | PASS | card details never reach our servers |
| Card token stored with the customer id and email, encrypted at rest | PASS | |
| List cards | PASS | |
| Delete card, refused while an active subscription uses it | PASS | |
| Debit with token, activation payment | PASS | Solo, Business and Scale |
| Recurring token charge after the 14 day trial, same stored card | PASS | charged at the price the customer agreed to |
| Duplicate charge prevention | PASS | the billing sweep can run twice with no second charge |
| Verify method, mandatory for Diners group and cards needing a code | IMPLEMENTED | contract verified; a real Diners card is needed for a live test |
| 3D Secure on the token debit, the flow Nuvei marks compatible | IMPLEMENTED | server return URL, auth verify and auth continue per the documentation |
| Callback, approval only when status is success and status detail is 3 | PASS | |
| Callback, approved, rejected, failed and refunded all handled | PASS | |
| Callback, duplicate protection | PASS | |
| Callback, unsigned or wrongly signed rejected | PASS | answered 203 as Nuvei documents |
| Refund method, full refund | PASS | subscription ends, plan revoked, login kept, email sent |
| Refund method, invalid amounts and duplicates refused | PASS | |
| Partial refund | NOT SUPPORTED BY DATAFAST | Nuvei answers that partial refunds are not supported by the carrier |
| Payment confirmation emails with purchase details, amount and currency, transaction id and authorization code | PASS | currency now shown on every amount |
| Link to Pay, link creation with the documented request body | PASS | Nuvei returns an order id and a link |
| Link to Pay, the returned link opens | BLOCKED BY NUVEI | Nuvei's own page answers 404 until the Link to Pay application is activated |
| Nuvei Checkout, a card payment submitted on the hosted page | PASS | Nuvei accepted the payment, answered 200 |
| Link to Pay, callback verified, amount checked, payer emailed | PASS | |
| Link to Pay, refundable through the Refund method | PASS | recorded as a transaction |
| Credentials only in backend environment variables | PASS | the browser receives only the publishable tokenization key |
| Access control, administrators exempt from all customer billing checks | PASS | each role tested separately |

Automated suite on the final build: 37 of 37 payment checks, plus the Checkout, Link to Pay, Verify, Delete Card and access control checks.

## The two hosted pages, tested by paying on them

Nuvei Checkout. Our backend creates the reference and Nuvei returns the hosted page. The page renders correctly with the application code, the order description and the amount. A test card was entered on that page and submitted, and Nuvei's own processing endpoint accepted it and answered 200. The page then waits for Nuvei to notify the merchant, which happens through the callback URL. Until Nuvei registers our callback URL on the application, that last notification cannot reach us. Our side of it is already proven: a correctly signed callback for a Checkout payment marks it paid, sends the payer the confirmation email, rejects a tampered amount and ignores a replay. Screenshot HOSTED_checkout_filled.

Link to Pay. Our backend creates the order and Nuvei returns an order id and a payment URL. Opening that URL on Nuvei's own site returns a 404 page, "Página no encontrada". This was checked repeatedly with fresh links and also by calling Nuvei directly rather than through our code. The reason is almost certainly that the Link to Pay application in your email, FFWSTG-EC-SERVER, is not activated, so the order is created under the cards application, which is not provisioned to serve the link. Screenshot LINKTOPAY_404.

## Still needed from Nuvei

The Link to Pay credentials in your email, application FFWSTG-EC-SERVER, are rejected by Nuvei with the message Application not found, and the links created under the cards application return a 404 page. This was tested directly against Nuvei's Link to Pay endpoint. Link to Pay works today through the cards application, which Nuvei accepts. Please ask Nuvei to activate the Link to Pay application; the code already supports a separate application and switching takes one minute.

The 3D Secure challenge screen cannot be triggered on this staging application. Nuvei's own 3D Secure test cards return a plain approval. Nuvei needs to enable 3D Secure on the staging application or provide a card that is enrolled.

Nuvei's compatibility table marks Add Card as 3D Secure compatible, but their browser tokenization library exposes no 3D Secure parameters. Please ask Nuvei whether Add Card 3D Secure is required for this account and how they expect it to be called.

The card form labels are in Spanish. This is a setting on the Nuvei merchant account.

Production credentials and Nuvei's production approval are required before any real card is charged.

## Not yet tested, and why

A Diners card that asks for a one time password, which is the case the Verify method exists for. The method is implemented and its contract is verified, but a real Diners test card is needed.

The 3D Secure challenge screen, for the reason above.

The final confirmation of a hosted Checkout payment, because it arrives through the callback URL that Nuvei has not registered yet.

A completed payment on a Link to Pay link, because Nuvei's own link page returns 404 until the Link to Pay application is activated.

## Other fixes made during this work

Administrator accounts were being treated as customers: pushed to the checkout page and unable to open the Admin area. Fixed, and each role was tested separately.

Onboarding, abandoned cart, free onboarding and checkout recovery emails were failing to schedule for every signup because of a database error. None of those emails were being sent. Fixed.

Granting internal admin access through the admin screen always returned a server error. Fixed.

The signup code was writing customer passwords into the server logs. Fixed.

## One decision for you

There is currently no Admin link in the sidebar for any role, so the admin pages are reached by typing the address. Adding that link is a user interface change and has not been made without your approval.
