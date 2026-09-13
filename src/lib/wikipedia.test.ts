import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupHerbImage } from "./wikipedia";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lookupHerbImage", () => {
  it("returns the resolved title, image, and source label on a full match", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(["koper wloski", ["Koper włoski"], [""], ["https://pl.wikipedia.org/wiki/Koper_w%C5%82oski"]]))
      .mockResolvedValueOnce(
        jsonResponse({
          title: "Koper włoski",
          thumbnail: { source: "https://upload.wikimedia.org/koper.jpg" },
        }),
      );

    const result = await lookupHerbImage("koper wloski");

    expect(result).toEqual({
      title: "Koper włoski",
      imageUrl: "https://upload.wikimedia.org/koper.jpg",
      sourceLabel: "Wikipedia: Koper włoski",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns null when opensearch has no hits", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse(["not a real herb name", [], [], []]));

    const result = await lookupHerbImage("not a real herb name");

    expect(result).toBeNull();
  });

  it("returns null when the resolved page has no thumbnail", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(["some page", ["Some Page"], [""], ["https://pl.wikipedia.org/wiki/Some_Page"]]))
      .mockResolvedValueOnce(jsonResponse({ title: "Some Page" }));

    const result = await lookupHerbImage("some page");

    expect(result).toBeNull();
  });

  it("returns null when the summary fetch fails", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse(["some page", ["Some Page"], [""], ["https://pl.wikipedia.org/wiki/Some_Page"]]))
      .mockResolvedValueOnce(jsonResponse({}, false));

    const result = await lookupHerbImage("some page");

    expect(result).toBeNull();
  });

  it("returns null for a blank name without making any request", async () => {
    const fetchMock = vi.spyOn(global, "fetch");

    const result = await lookupHerbImage("   ");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
