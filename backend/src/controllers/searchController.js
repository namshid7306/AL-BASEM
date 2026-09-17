import { searchService } from "../services/searchService.js";

export const searchController = {
  search: async (req, res, next) => {
    try {
      const q = req.query.q || req.query.query || "";
      const result = await searchService.globalSearch(q);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
