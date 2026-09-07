// App.jsx

import VacationRentalsPage from "./pages/VacationRentals/VacationRentalsPage";

// Inside <Routes>:

<Route
  path="/vacation-rentals"
  element={<VacationRentalsPage />}
/>

// Optional compatibility with old Webflow language URLs:

<Route
  path="/en/vacation-rentals"
  element={<VacationRentalsPage />}
/>

<Route
  path="/es/vacation-rentals"
  element={<VacationRentalsPage />}
/>

<Route
  path="/pt/vacation-rentals"
  element={<VacationRentalsPage />}
/>
