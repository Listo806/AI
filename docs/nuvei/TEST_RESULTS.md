# Cortexa, Nuvei and Datafast integration, test results

Date: 17 September 2026
Environment: live site www.cortexaaicrm.com, backend connected to the Nuvei staging gateway with the development credentials supplied in your documentation email. Those credentials are installed on the backend now. No real card was charged.
Checkout: your approved design, unchanged. Only the technical payment connection behind it was built and tested.

## Answers to your four questions

Everything in the package was received: the documentation links for Checkout, Add Card, recurrence, refund, webhook and verify, the SDK links, the test cards, the card development credentials and the separate Link to Pay credentials.

The callback URL to register on the merchant application is https://backend.cortexaaicrm.com/api/nuvei/callback. The server verifies Nuvei's stoken signature on every callback.

What is still missing is on Nuvei's side and is listed at the end of this document.

Everything you asked for is implemented. What remains untested is also listed at the end, with the reason.

The subscription flow, activation now and monthly charges after the trial, uses Add Card tokenization and debit with the stored token. Nuvei Checkout is used for one time payments.

## Components and their state

| Component | State | Evidence |
|---|---|---|
| Nuvei Checkout for one time payments, init a reference | WORKING | hosted page renders with our application, the description and the amount, screenshot nuvei-hosted-checkout-payment |
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
| Link to Pay, a card payment completed on the payment page | PASS | 23.00 USD test payment on 17 September, approved by Nuvei, payer emailed, refund accepted; the transaction and authorization codes were sent privately |
| Link to Pay, the link address Nuvei returns opens | BLOCKED BY NUVEI | that address answers 404 for every order, while the address in Nuvei's documentation opens the same order and takes the payment |
| Nuvei Checkout, a card payment submitted on the hosted page | PASS | Nuvei accepted the payment, answered 200 |
| Link to Pay, callback verified, amount checked, payer emailed | PASS | |
| Link to Pay, refundable through the Refund method | PASS | recorded as a transaction |
| Credentials only in backend environment variables | PASS | the browser receives only the publishable tokenization key |
| Access control, administrators exempt from all customer billing checks | PASS | each role tested separately |
| Checkout text follows the address, English, Spanish and Portuguese | PASS | /checkout, /es/checkout and /pt/checkout, screenshots checkout-english, checkout-spanish, checkout-portuguese |
| Page language sent to Nuvei Checkout and to Nuvei's card form | PASS | Nuvei serves its card form page marked with the language we send |
| Card holder and card number labels in the page language | BLOCKED BY NUVEI | fixed in Spanish inside Nuvei's form script, see below |

Automated suite on the final build: 37 of 37 payment checks, plus the Checkout, Link to Pay, Verify, Delete Card and access control checks.

## The two hosted pages, tested by paying on them

Nuvei Checkout. Our backend creates the reference and Nuvei returns the hosted page. The page renders correctly with our application, the order description and the amount. A test card was entered on that page and submitted, and Nuvei's own processing endpoint accepted it and answered 200. The page then waits for Nuvei to notify the merchant, which happens through the callback URL. Until Nuvei registers our callback URL on the application, that last notification cannot reach us. Our side of it is already proven: a correctly signed callback for a Checkout payment marks it paid, sends the payer the confirmation email, rejects a tampered amount and ignores a replay. Screenshot nuvei-hosted-checkout-payment.

Link to Pay. Our backend creates the order with the server credentials from your documentation, which Nuvei has confirmed are the correct ones, and Nuvei returns an order id and a payment URL. That URL answers 404 for every order, including new ones, and it does the same when Nuvei is called directly rather than through our code. Screenshot link-to-pay-404.

The orders themselves are correct. The same order opens on the payment address published in Nuvei's documentation, showing the purchase details and taking the payment. On 17 September a complete Link to Pay payment was made that way: our backend created the link, 23.00 USD was paid with a test card and Nuvei approved it. The same notification Nuvei would send, signed the way Nuvei signs it, then marked the payment as received, sent the payer the confirmation email and was ignored when repeated, and a refund through the Refund method was accepted by Nuvei. So the orders, the payment, the notification handling, the email and the refund all work, and the only fault is the link address Nuvei has configured for this application. The transaction and authorization codes were sent to you privately.

That test also confirmed the callback URL is not registered yet, because Nuvei sent no notification for a real, approved payment. The handling was proven by delivering the same message signed exactly as Nuvei signs it.

## Still needed from Nuvei

The Link to Pay link address. Nuvei has confirmed that the server credentials in the documentation are the correct ones and that the separate Link to Pay credentials in the same email are not to be used. With the correct credentials the orders are created and can be paid, but the link address Nuvei returns for this application answers 404. Nuvei needs to correct that address for the application and confirm the address for production.

The callback URL still needs to be registered on the application. A real approved payment produced no notification.

The 3D Secure challenge screen cannot be triggered on this staging application. Nuvei's own 3D Secure test cards return a plain approval. Nuvei needs to enable 3D Secure on the staging application or provide a card that is enrolled.

Nuvei's compatibility table marks Add Card as 3D Secure compatible. On Add Card, Nuvei's own card form sends the 3D Secure browser data and runs any verification step inside the form, so there is nothing for the merchant to pass. Please ask Nuvei to confirm it is active for this account.

The card holder and card number labels read Spanish on every checkout language. Our checkout sends the page language, en, es or pt, to Nuvei's card form, and Nuvei serves the form page marked with that language. The labels stay Spanish because Nuvei's form script, payment_2.14.9, has them fixed as "Nombre del titular" and "Número de tarjeta" and does not translate them. Only Nuvei can change that script. The form sits inside Nuvei's secure frame, so we cannot change it from our side.

Production credentials and Nuvei's production approval are required before any real card is charged.

## Not yet tested, and why

A Diners card that asks for a one time password, which is the case the Verify method exists for. The method is implemented and its contract is verified, but a real Diners test card is needed.

The 3D Secure challenge screen, for the reason above.

The final confirmation of a hosted Checkout payment, because it arrives through the callback URL that Nuvei has not registered yet.

A payment on the link address Nuvei returns, because that address answers 404. The payment itself was completed on the address in Nuvei's documentation, as described above.

## Other fixes made during this work

Administrator accounts were being treated as customers: pushed to the checkout page and unable to open the Admin area. Fixed, and each role was tested separately.

Onboarding, abandoned cart, free onboarding and checkout recovery emails were failing to schedule for every signup because of a database error. None of those emails were being sent. Fixed.

Granting internal admin access through the admin screen always returned a server error. Fixed.

A defect in the signup path was found and fixed. The details were sent to you privately, because this repository is public.

## One decision for you

There is currently no Admin link in the sidebar for any role, so the admin pages are reached by typing the address. Adding that link is a user interface change and has not been made without your approval.
