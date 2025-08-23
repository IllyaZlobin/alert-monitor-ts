import { SelectQueryBuilder } from 'typeorm';

export interface FulltextSearchOptions {
  query: string;
  fields?: string[];
  language?: 'simple' | 'english' | 'russian';
  rankThreshold?: number;
  usePrefix?: boolean;
}

/**
 * Adds full-text search to a query builder
 * @param queryBuilder - TypeORM query builder
 * @param options - Search options
 * @returns Modified query builder with full-text search
 */
/* export function addFulltextSearch<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: FulltextSearchOptions
): SelectQueryBuilder<T> {
  const { query, language = 'simple', rankThreshold = 0.1, usePrefix = true } = options;

  if (!query.trim()) {
    return queryBuilder;
  }

  const searchQuery = usePrefix
    ? `plainto_tsquery_prefix('${language}', :searchQuery)`
    : `to_tsquery('${language}', :searchQuery)`;

  queryBuilder
    .andWhere(`name_vector @@ ${searchQuery}`)
    .addSelect(`ts_rank(name_vector, ${searchQuery})`, 'rank')
    .setParameter('searchQuery', query)
    .orderBy('rank', 'DESC')
    .andWhere(`ts_rank(name_vector, ${searchQuery}) > :rankThreshold`)
    .setParameter('rankThreshold', rankThreshold);

  return queryBuilder;
} */

/**
 * Creates a full-text search query for locations
 * @param query - Search query string
 * @param language - Language for text search (default: 'simple')
 * @param usePrefix - Use prefix search (default: true)
 * @returns Raw SQL condition for full-text search
 */
/* export function createFulltextSearchCondition(
  query: string,
  language: 'simple' | 'english' | 'russian' = 'simple',
  usePrefix: boolean = true
): string {
  if (!query.trim()) {
    return '1=1';
  }

  const searchQuery = usePrefix
    ? `plainto_tsquery_prefix('${language}', '${query}')`
    : `to_tsquery('${language}', '${query}')`;

  return `name_vector @@ ${searchQuery}`;
} */

/**
 * Creates a ranking function for full-text search results
 * @param query - Search query string
 * @param language - Language for text search (default: 'simple')
 * @param usePrefix - Use prefix search (default: true)
 * @returns Raw SQL ranking function
 */
export function createRankingFunction(
  query: string,
  language: 'simple' | 'english' | 'russian' = 'simple',
  usePrefix: boolean = true
): string {
  if (!query.trim()) {
    return '0'; // No ranking
  }

  const searchQuery = usePrefix
    ? `plainto_tsquery_prefix('${language}', '${query}')`
    : `to_tsquery('${language}', '${query}')`;

  return `ts_rank(name_vector, ${searchQuery})`;
}

/**
 * Advanced search with multiple search strategies
 * @param queryBuilder - TypeORM query builder
 * @param options - Advanced search options
 * @returns Modified query builder with advanced search
 */
/* export function addAdvancedFulltextSearch<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: FulltextSearchOptions & {
    searchStrategies?: ('exact' | 'prefix' | 'fuzzy')[];
    fuzzyDistance?: number;
  }
): SelectQueryBuilder<T> {
  const { query, language = 'simple', rankThreshold = 0.1, searchStrategies = ['prefix'], fuzzyDistance = 2 } = options;

  if (!query.trim()) {
    return queryBuilder;
  }

  const searchConditions: string[] = [];

  if (searchStrategies.includes('exact')) {
    searchConditions.push(`name_vector @@ to_tsquery('${language}', :exactQuery)`);
    queryBuilder.setParameter('exactQuery', query);
  }

  if (searchStrategies.includes('prefix')) {
    searchConditions.push(`name_vector @@ plainto_tsquery_prefix('${language}', :prefixQuery)`);
    queryBuilder.setParameter('prefixQuery', query);
  }

  if (searchStrategies.includes('fuzzy')) {
    searchConditions.push(`similarity(name, :fuzzyQuery) > 0.3`);
    queryBuilder.setParameter('fuzzyQuery', query);
  }

  if (searchConditions.length > 0) {
    queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`);
  }

  if (searchStrategies.includes('prefix')) {
    const searchQuery = `plainto_tsquery_prefix('${language}', :prefixQuery)`;
    queryBuilder
      .addSelect(`ts_rank(name_vector, ${searchQuery})`, 'rank')
      .orderBy('rank', 'DESC')
      .andWhere(`ts_rank(name_vector, ${searchQuery}) > :rankThreshold`)
      .setParameter('rankThreshold', rankThreshold);
  }

  return queryBuilder;
} */
