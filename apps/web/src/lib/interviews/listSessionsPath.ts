/**
 * Path builder for GET /interviews list requests.
 */

import type { ListInterviewSessionsParams } from "./types";

/** Builds the collection path used by history/recent list calls. */
export function buildListInterviewSessionsPath(
  params: ListInterviewSessionsParams = {},
): string {
  const search = new URLSearchParams();
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  const query = search.toString();
  return query ? `/interviews?${query}` : "/interviews";
}
