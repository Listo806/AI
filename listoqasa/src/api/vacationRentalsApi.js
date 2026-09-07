const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://backend.cortexaaicrm.com/api"
).replace(/\/+$/, "");

const PUBLIC_PROPERTIES_URL = `${API_BASE_URL}/properties/public`;

function normalizeResponse(payload, fallback = {}) {
  if (Array.isArray(payload?.items)) {
    return {
      items: payload.items,
      total: Number(payload.total || 0),
      limit: Number(payload.limit || fallback.limit || 0),
      offset: Number(payload.offset || fallback.offset || 0),
    };
  }

  if (Array.isArray(payload?.data?.items)) {
    return {
      items: payload.data.items,
      total: Number(payload.data.total || 0),
      limit: Number(payload.data.limit || fallback.limit || 0),
      offset: Number(payload.data.offset || fallback.offset || 0),
    };
  }

  return {
    items: [],
    total: 0,
    limit: Number(fallback.limit || 0),
    offset: Number(fallback.offset || 0),
  };
}

export async function getPublicProperties(
  params = {},
  signal
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, String(value));
    }
  });

  const response = await fetch(
    `${PUBLIC_PROPERTIES_URL}?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      `GET /properties/public failed: ${response.status} ${response.statusText}`
    );
  }

  return normalizeResponse(
    await response.json(),
    params
  );
}

export function getHomesForRent({
  limit = 6,
  offset = 0,
  signal,
} = {}) {
  /*
   * Do NOT force propertyType=house.
   * The reference design contains apartments, suites,
   * houses and penthouses in this section.
   */
  return getPublicProperties(
    {
      country: "ecuador",
      mode: "rent",
      limit,
      offset,
    },
    signal
  );
}

export function getLandOpportunities({
  limit = 6,
  offset = 0,
  signal,
} = {}) {
  return getPublicProperties(
    {
      country: "ecuador",
      propertyType: "land",
      limit,
      offset,
    },
    signal
  );
}

export function getCommercialProperties({
  limit = 6,
  offset = 0,
  signal,
} = {}) {
  return getPublicProperties(
    {
      country: "ecuador",
      propertyType: "commercial",
      limit,
      offset,
    },
    signal
  );
}

function getListingDate(item) {
  const raw =
    item?.publishedAt ||
    item?.published_at ||
    item?.createdAt ||
    item?.created_at ||
    item?.updatedAt ||
    item?.updated_at;

  const time = raw ? new Date(raw).getTime() : 0;

  return Number.isFinite(time) ? time : 0;
}

export async function getNewestListings({
  limit = 6,
  poolSize = 30,
  signal,
} = {}) {
  /*
   * Existing backend has no "isNewProject" field.
   * To avoid DB/backend changes, load a larger public pool,
   * sort by publishedAt/createdAt in React/API layer,
   * then take the newest N records.
   *
   * This section is therefore "newest listings" displayed
   * under the New Projects design heading until the backend
   * has real project metadata.
   */
  const result = await getPublicProperties(
    {
      country: "ecuador",
      limit: Math.max(poolSize, limit),
      offset: 0,
    },
    signal
  );

  const items = [...result.items]
    .sort(
      (a, b) =>
        getListingDate(b) - getListingDate(a)
    )
    .slice(0, limit);

  return {
    ...result,
    items,
  };
}

export function getLocationCount(
  city,
  signal
) {
  /*
   * Only request one item because the page needs the
   * API's total count, not the whole result set.
   */
  return getPublicProperties(
    {
      country: "ecuador",
      city,
      limit: 1,
      offset: 0,
    },
    signal
  ).then((result) => ({
    city,
    total: result.total,
  }));
}

export async function getVacationRentalsLayoutData({
  limit = 6,
  signal,
} = {}) {
  const [
    homesForRent,
    land,
    commercial,
    newProjects,
  ] = await Promise.all([
    getHomesForRent({
      limit,
      signal,
    }),
    getLandOpportunities({
      limit,
      signal,
    }),
    getCommercialProperties({
      limit,
      signal,
    }),
    getNewestListings({
      limit,
      poolSize: 30,
      signal,
    }),
  ]);

  return {
    homesForRent,
    land,
    commercial,
    newProjects,
  };
}
