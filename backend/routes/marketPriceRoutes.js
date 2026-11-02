
const express = require("express");

const router = express.Router();

const RESOURCE_ID =
  process.env.AGMARK_RESOURCE_ID ||
  "9ef84268-d588-465a-a308-a864a43d0070";

const API_KEY =
  process.env.DATA_GOV_IN_API_KEY ||
  process.env.AGMARK_API_KEY ||
  "";

const BASE_URL =
  `https://api.data.gov.in/resource/${RESOURCE_ID}`;

const PAGE_SIZE = 20;
const REQUEST_TIMEOUT = 12000;
const MAX_RETRIES = 2;
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_PARTIAL_SCAN = 1000;

const cache = new Map();

function clean(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalize(value) {
  return clean(value).toLowerCase();
}

function matches(value, search) {
  if (!search) return true;

  return normalize(value).includes(normalize(search));
}

function getNumber(value, fallback, min, max) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function cacheKey(filters, page, pageSize) {
  return JSON.stringify({
    filters,
    page,
    pageSize,
  });
}

function readCache(key) {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function writeCache(key, data) {
  if (cache.size >= 150) {
    const firstKey = cache.keys().next().value;

    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_DURATION,
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function makeParams(filters, limit, offset) {
  const params = new URLSearchParams({
    "api-key": API_KEY,
    format: "json",
    limit: String(limit),
    offset: String(offset),
  });

  if (filters.commodity) {
    params.set(
      "filters[commodity]",
      filters.commodity
    );
  }

  if (filters.district) {
    params.set(
      "filters[district]",
      filters.district
    );
  }

  if (filters.state) {
    params.set(
      "filters[state.keyword]",
      filters.state
    );
  }

  if (filters.market) {
    params.set(
      "filters[market]",
      filters.market
    );
  }

  return params;
}

async function requestGovernment(filters, limit, offset) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      const params = makeParams(
        filters,
        limit,
        offset
      );

      const response = await fetch(
        `${BASE_URL}?${params.toString()}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = new Error(
          `Government API returned HTTP ${response.status}`
        );

        error.status = response.status;
        error.retryable =
          response.status === 429 ||
          response.status >= 500;

        throw error;
      }

      const data = await response.json();

      if (!Array.isArray(data.records)) {
        const error = new Error(
          data.message ||
          "Government API returned an invalid record format"
        );

        error.retryable = true;
        throw error;
      }

      return {
        records: data.records,
        total: Number(data.total),
      };
    } catch (error) {
      lastError = error;

      const retryable =
        error.name === "AbortError" ||
        error.retryable === true ||
        error instanceof TypeError;

      if (
        !retryable ||
        attempt === MAX_RETRIES
      ) {
        break;
      }

      await wait(500 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

function recordMatches(record, filters) {
  return (
    matches(record.commodity, filters.commodity) &&
    matches(record.district, filters.district) &&
    matches(record.state, filters.state) &&
    matches(record.market, filters.market)
  );
}

function uniqueRecords(records) {
  const seen = new Set();

  return records.filter((record) => {
    const identity = JSON.stringify([
      record.state,
      record.district,
      record.market,
      record.commodity,
      record.variety,
      record.arrival_date,
      record.min_price,
      record.max_price,
      record.modal_price,
    ]);

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
}

async function searchPartialCommodity(
  filters,
  page,
  pageSize
) {
  const restrictedFilters = {
    state: filters.state,
    district: filters.district,
    market: filters.market,
    commodity: "",
  };

  const matched = [];

  let offset = 0;
  let complete = false;
  let total = NaN;

  const required = page * pageSize + 1;

  while (
    offset < MAX_PARTIAL_SCAN &&
    matched.length < required
  ) {
    const response = await requestGovernment(
      restrictedFilters,
      100,
      offset
    );

    total = response.total;

    const batch = response.records;

    if (!batch.length) {
      complete = true;
      break;
    }

    for (const record of batch) {
      if (recordMatches(record, filters)) {
        matched.push(record);
      }
    }

    offset += batch.length;

    if (
      batch.length < 100 ||
      (
        Number.isFinite(total) &&
        offset >= total
      )
    ) {
      complete = true;
      break;
    }
  }

  const results = uniqueRecords(matched);

  const start = (page - 1) * pageSize;

  return {
    records: results.slice(
      start,
      start + pageSize
    ),
    hasMore:
      results.length > start + pageSize ||
      (
        !complete &&
        results.length > start + pageSize
      ),
    partial: !complete,
    searchMethod: "partial-commodity-match",
    scanned: offset,
  };
}

router.get("/", async (req, res) => {
  const filters = {
    commodity: clean(req.query.commodity),
    district: clean(req.query.district),
    state: clean(req.query.state),
    market: clean(req.query.market),
  };

  if (!Object.values(filters).some(Boolean)) {
    return res.status(400).json({
      success: false,
      message:
        "Enter a crop, district, state or market to search.",
    });
  }

  if (
    Object.values(filters).some(
      (value) => value.length > 100
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Search text is too long.",
    });
  }

  if (!API_KEY) {
    return res.status(503).json({
      success: false,
      message:
        "Government API key is not configured on the server.",
    });
  }

  const page = getNumber(
    req.query.page,
    1,
    1,
    1000
  );

  const pageSize = getNumber(
    req.query.pageSize,
    PAGE_SIZE,
    1,
    100
  );

  const key = cacheKey(
    filters,
    page,
    pageSize
  );

  const cached = readCache(key);

  if (cached) {
    return res.json({
      ...cached,
      cached: true,
    });
  }

  try {
    const offset = (page - 1) * pageSize;

    const governmentResponse =
      await requestGovernment(
        filters,
        pageSize + 1,
        offset
      );

    let records = governmentResponse.records.filter(
      (record) =>
        recordMatches(record, filters)
    );

    let hasMore =
      governmentResponse.records.length > pageSize;

    let partial = false;
    let searchMethod = "government-filters";
    let scanned = governmentResponse.records.length;

    if (
      records.length === 0 &&
      page === 1 &&
      Boolean(filters.commodity)
    ) {
      const partialSearch =
        await searchPartialCommodity(
          filters,
          page,
          pageSize
        );

      records = partialSearch.records;
      hasMore = partialSearch.hasMore;
      partial = partialSearch.partial;
      searchMethod =
        partialSearch.searchMethod;
      scanned = partialSearch.scanned;
    }

    const result = {
      success: true,
      source: "data.gov.in (AGMARKNET)",
      records: records.slice(0, pageSize),
      count: Math.min(
        records.length,
        pageSize
      ),
      page,
      pageSize,
      hasMore,
      partial,
      scanned,
      searchMethod,
      message:
        records.length === 0
          ? partial
            ? "No matching prices found within the scanned government records. The search may be incomplete."
            : "No matching government mandi records were returned for this search."
          : null,
    };

    writeCache(key, result);

    return res.json(result);
  } catch (error) {
    console.error(
      "[Market Prices] Government API error:",
      error.message
    );

    const isTimeout =
      error.name === "AbortError";

    const isRateLimit =
      error.status === 429;

    const message = isRateLimit
      ? "Government API rate limit reached. Please try again shortly."
      : isTimeout
        ? "Government mandi API timed out. Please try again."
        : error.status
          ? `Government mandi API request failed (HTTP ${error.status}). Please try again later.`
          : "Unable to reach the government mandi API. Please try again later.";

    return res.status(502).json({
      success: false,
      message,
    });
  }
});

module.exports = router;
