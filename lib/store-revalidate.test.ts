import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// We need to control STORE_REVALIDATE_URL and STORE_REVALIDATE_SECRET at module
// load time. Since the module reads them at top-level, we use vi.resetModules()
// + dynamic import to get a fresh module for each test configuration.

describe("purgeStorefront", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function loadModule() {
    const mod = await import("@/lib/store-revalidate");
    return mod;
  }

  it("does not call fetch when STORE_REVALIDATE_URL is missing", async () => {
    delete process.env.STORE_REVALIDATE_URL;
    delete process.env.STORE_REVALIDATE_SECRET;

    const { purgeStorefront } = await loadModule();
    purgeStorefront(["catalog-games"]);

    // Give async fire-and-forget a chance to run
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not call fetch when STORE_REVALIDATE_SECRET is missing", async () => {
    process.env.STORE_REVALIDATE_URL = "https://storefront.example.com";
    delete process.env.STORE_REVALIDATE_SECRET;

    const { purgeStorefront } = await loadModule();
    purgeStorefront(["catalog-games"]);

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not call fetch when tags array is empty", async () => {
    process.env.STORE_REVALIDATE_URL = "https://storefront.example.com";
    process.env.STORE_REVALIDATE_SECRET = "secret123";

    const { purgeStorefront } = await loadModule();
    purgeStorefront([]);

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls fetch with correct URL, headers, and body", async () => {
    process.env.STORE_REVALIDATE_URL = "https://storefront.example.com";
    process.env.STORE_REVALIDATE_SECRET = "mysecret";

    fetchSpy.mockResolvedValue({ ok: true, status: 200 });

    const { purgeStorefront } = await loadModule();
    purgeStorefront(["catalog-games", "catalog-products"]);

    // Wait for fire-and-forget to complete
    await new Promise((r) => setTimeout(r, 100));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://storefront.example.com/api/revalidate");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers["x-revalidate-secret"]).toBe("mysecret");

    const body = JSON.parse(options.body);
    expect(body.tags).toEqual(["catalog-games", "catalog-products"]);
  });

  it("strips trailing slashes from STORE_REVALIDATE_URL", async () => {
    process.env.STORE_REVALIDATE_URL = "https://storefront.example.com///";
    process.env.STORE_REVALIDATE_SECRET = "secret";

    fetchSpy.mockResolvedValue({ ok: true, status: 200 });

    const { purgeStorefront } = await loadModule();
    purgeStorefront(["settings"]);

    await new Promise((r) => setTimeout(r, 100));

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://storefront.example.com/api/revalidate");
  });

  it("does not throw when fetch fails (fire-and-forget)", async () => {
    process.env.STORE_REVALIDATE_URL = "https://storefront.example.com";
    process.env.STORE_REVALIDATE_SECRET = "secret";

    fetchSpy.mockRejectedValue(new Error("network down"));

    const { purgeStorefront } = await loadModule();

    // Should not throw even though fetch rejects
    expect(() => purgeStorefront(["catalog-games"])).not.toThrow();

    // Wait for the internal async to settle
    await new Promise((r) => setTimeout(r, 100));
  });

  it("does not throw when fetch returns non-ok status (fire-and-forget)", async () => {
    process.env.STORE_REVALIDATE_URL = "https://storefront.example.com";
    process.env.STORE_REVALIDATE_SECRET = "secret";

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    });

    const { purgeStorefront } = await loadModule();

    expect(() => purgeStorefront(["catalog-games"])).not.toThrow();
    await new Promise((r) => setTimeout(r, 100));
  });
});

describe("STOREFRONT_TAGS", () => {
  it("exports expected tag groups", async () => {
    vi.resetModules();
    const { STOREFRONT_TAGS } = await import("@/lib/store-revalidate");

    expect(STOREFRONT_TAGS.games).toEqual(["catalog-games"]);
    expect(STOREFRONT_TAGS.products).toEqual(["catalog-products"]);
    expect(STOREFRONT_TAGS.categories).toEqual(["catalog-categories"]);
    expect(STOREFRONT_TAGS.payment).toEqual(["catalog-payment"]);
    expect(STOREFRONT_TAGS.settings).toEqual(["settings"]);
    expect(STOREFRONT_TAGS.marketplace).toEqual(["marketplace"]);
  });
});
