# Admin access verification, support@cortexaaicrm.com

Date: 16 September 2026
Environment tested: the live site, https://www.cortexaaicrm.com, with the live backend at https://backend.cortexaaicrm.com/api
Method: a clean browser session, no cached data, signing in with the account itself.

## Result of each point you listed

| # | Your requirement | Result | Evidence |
|---|---|---|---|
| 1 | The account has the correct super_admin internal-access record | PASS | internal role super_admin, status active |
| 2 | The token and session return the internal administrator permission | PASS | sign in returns internalRole super_admin, isInternal true |
| 3 | The frontend reads the administrator permission, not only the customer role | PASS | the profile returns role super_admin, internalRole super_admin, isInternal true |
| 4 | Exempt from activation fees, trials, subscriptions, checkout and billing redirects | PASS | no subscription on the account and no redirect on any page |
| 5 | The Admin API authorizes this exact account | PASS | admin customers and admin users both answer 200 |
| 6 | Deployed to the live frontend and backend | PASS | the live bundle on www.cortexaaicrm.com and cortexaaicrm.com contains the fix |
| 7 | Logging out, signing in again, refreshing and opening the Admin URL do not trigger checkout | PASS | every step below |

## The exact steps and URLs

Signed in at https://www.cortexaaicrm.com/sign-in and landed on https://www.cortexaaicrm.com/dashboard/admin/listings. No checkout.

Opened https://www.cortexaaicrm.com/dashboard/admin/customers. The Admin area opened with live data, 426 registered accounts, 47 active customers, monthly recurring 6,309 dollars. Screenshot CLIENT_ADMIN_2_admin_customers.

Refreshed that page. Stayed on https://www.cortexaaicrm.com/dashboard/admin/customers. Screenshot CLIENT_ADMIN_3_after_refresh.

Cleared the recent payment marker and opened https://www.cortexaaicrm.com/dashboard. Landed on the admin listings page. No checkout.

Signed out completely, cleared the browser storage, and signed in again. Landed on https://www.cortexaaicrm.com/dashboard/admin/listings. No checkout. Screenshot CLIENT_ADMIN_4_admin_listings.

Eleven checks, eleven passed.

## If you still see the problem

Two possible reasons, both easy to rule out.

First, an old page still open in your browser. The application only loads new code on a fresh page load, so please sign out, press control and F5 together to force a reload, then sign in again.

Second, the address you are using. The fix is live on www.cortexaaicrm.com and on cortexaaicrm.com. There is a second site at listoqasa.netlify.app that is still running an older build and does not have the fix. If you or your team reach the admin area through that address, you would still see the old behaviour. Tell me if that site is still in use and I will update it as well.

If neither applies, send me a screenshot of the address bar at the moment you are redirected and I will trace that exact request.
