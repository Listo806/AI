# Admin access verification, your administrator account

Date: 16 September 2026
Environment tested: the live site, https://www.cortexaaicrm.com, with the live backend at https://backend.cortexaaicrm.com/api
Account: the exact administrator email you gave us. It is not written here because this repository is public.
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

## The exact steps

Signed in on the live site and landed on the admin listings page. No checkout.

Opened the admin customers page. The Admin area opened with the live customer list and figures. Screenshot [admin-area-working](screenshots/admin-area-working.png), with the data hidden.

Refreshed that page. Stayed on the admin customers page.

Cleared the recent payment marker and opened the dashboard. Landed on the admin listings page. No checkout.

Signed out completely, cleared the browser storage, and signed in again. Landed on the admin listings page. No checkout. Screenshot [admin-after-relogin](screenshots/admin-after-relogin.png), with the listing rows hidden.

Eleven checks, eleven passed.

## If you still see the problem

Two possible reasons, both easy to rule out.

First, an old page still open in your browser. The application only loads new code on a fresh page load, so please sign out, press control and F5 together to force a reload, then sign in again.

Second, the address you are using. The fix is live on www.cortexaaicrm.com and on cortexaaicrm.com. There is a second, older deployment of the site at a different address which has not been rebuilt, so it still shows the old behaviour. That address was sent to you privately. It is not in the accounts we were given, so whoever manages it needs to redeploy it from the main branch, or retire it.

If neither applies, send me a screenshot of the address bar at the moment you are redirected and I will trace that exact request.
