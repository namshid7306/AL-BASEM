import { searchApi } from "../services/searchApi";

export const emptySearchResults = {
  customers: [],
  services: [],
  invoices: [],
  quotations: [],
  expenses: []
};

export const searchRecords = async (query) => {
  if (!query?.trim()) {
    return emptySearchResults;
  }

  try {
    const data = await searchApi.search(query.trim());
    return {
      customers: (data?.customers || []).map((c) => ({ ...c, id: c.id || c._id })),
      services: (data?.services || []).map((s) => ({ ...s, id: s.id || s._id })),
      invoices: (data?.invoices || []).map((i) => ({ ...i, id: i.id || i._id })),
      quotations: (data?.quotations || []).map((q) => ({ ...q, id: q.id || q._id })),
      expenses: (data?.expenses || []).map((e) => ({ ...e, id: e.id || e._id }))
    };
  } catch {
    return emptySearchResults;
  }
};