import { evaluateQuery } from '../../../core/utils/query';

export interface FacetMap {
  [key: string]: string | null | undefined;
}

/**
 * Apply common filters to an array of records.
 * - searchText: free text search against a provided stringify(row)
 * - query: simple query language evaluated via evaluateQuery
 * - facets: exact match on provided key/value pairs (skip facet if value is falsy)
 */
export function applyCommonFilters<T>(rows: T[], opts: {
  searchText?: string;
  query?: string;
  facets?: FacetMap;
  stringify: (row: T) => string;
}): T[] {
  const search = (opts.searchText || '').toLowerCase();
  const query = opts.query || '';
  const facets = opts.facets || {};

  const bySearch = (row: T) => {
    if (!search) return true;
    const hay = opts.stringify(row).toLowerCase();
    return hay.includes(search);
  };

  const byQuery = (row: T) => {
    if (!query.trim()) return true;
    try { return evaluateQuery(row as any, query); } catch { return false; }
  };

  const byFacets = (row: any) => {
    for (const key of Object.keys(facets)) {
      const val = facets[key];
      if (val) {
        if (row?.[key] !== val) return false;
      }
    }
    return true;
  };

  return rows.filter(r => bySearch(r) && byQuery(r) && byFacets(r));
}
