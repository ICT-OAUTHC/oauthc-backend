import { PaginationQuery } from "../types";

export const getPaginationOptions = (query: PaginationQuery) => {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = {};

  if (query.sort) {
    sort[query.sort] = query.order === "asc" ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  return { page, limit, skip, sort };
};
