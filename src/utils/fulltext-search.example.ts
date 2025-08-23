import { LocationService } from '../monitor/location.service';

export class FulltextSearchExamples {
  constructor(private readonly locationService: LocationService) {}

  /*   async searchByName(searchQuery: string) {
    return this.locationService.searchLocations({
      query: searchQuery,
      language: 'simple',
      usePrefix: true, // Використовуємо префіксний пошук
      limit: 10
    });
  } */

  /*  async searchWithFilters(searchQuery: string, category: string, region: string) {
    return this.locationService.searchLocationsWithRanking({
      query: searchQuery,
      category,
      region,
      language: 'simple',
      usePrefix: true,
      rankThreshold: 0.1,
      limit: 20
    });
  } */

  /*   async searchWithPagination(searchQuery: string, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    return this.locationService.searchLocations({
      query: searchQuery,
      language: 'simple',
      usePrefix: true,
      limit: pageSize,
      offset
    });
  } */

  /*   async searchByCategoryOnly(category: string) {
    return this.locationService.searchLocations({
      category,
      limit: 50
    });
  }
 */
  /*   async complexSearch(options: {
    query?: string;
    category?: string;
    region?: string;
    community?: string;
    language?: 'simple' | 'english' | 'russian';
    usePrefix?: boolean;
    rankThreshold?: number;
    limit?: number;
    offset?: number;
  }) {
    if (options.query) {
      //return this.locationService.searchLocationsWithRanking(options);
    } else {
      //return this.locationService.searchLocations(options);
    }
  } */

  async exactSearch(searchQuery: string) {
    /* return this.locationService.searchLocations({
      query: searchQuery,
      language: 'simple',
      usePrefix: false, // Точний пошук без префіксів
      limit: 10
    }); */
  }

  async searchWithDifferentLanguages(searchQuery: string) {
    /* const ukResults = await this.locationService.searchLocations({
      query: searchQuery,
      language: 'simple',
      usePrefix: true,
      limit: 5
    }); */
    /*  const enResults = await this.locationService.searchLocations({
      query: searchQuery,
      language: 'english',
      usePrefix: true,
      limit: 5
    }); */
    //return { ukResults, enResults };
  }
}


export const FulltextSearchSQLExamples = {
  basicSearchWithPrefix: `
    SELECT id, name, category, region, community, 
           ts_rank(name_vector, plainto_tsquery_prefix('simple', 'search_term')) as rank
    FROM locations 
    WHERE name_vector @@ plainto_tsquery_prefix('simple', 'search_term')
    ORDER BY rank DESC;
  `,

  searchWithFiltersAndPrefix: `
    SELECT id, name, category, region, community,
           ts_rank(name_vector, plainto_tsquery_prefix('simple', 'search_term')) as rank
    FROM locations 
    WHERE name_vector @@ plainto_tsquery_prefix('simple', 'search_term')
      AND category = 'restaurant'
      AND region = 'Kyiv'
    ORDER BY rank DESC;
  `,

  searchWithMinRankAndPrefix: `
    SELECT id, name, category, region, community,
           ts_rank(name_vector, plainto_tsquery_prefix('simple', 'search_term')) as rank
    FROM locations 
    WHERE name_vector @@ plainto_tsquery_prefix('simple', 'search_term')
      AND ts_rank(name_vector, plainto_tsquery_prefix('simple', 'search_term')) > 0.1
    ORDER BY rank DESC;
  `,

  comparisonSearch: `
    -- Звичайний пошук (точний)
    SELECT id, name, 
           ts_rank(name_vector, to_tsquery('simple', 'search_term')) as rank_exact
    FROM locations 
    WHERE name_vector @@ to_tsquery('simple', 'search_term');
    
    -- Префіксний пошук (частковий)
    SELECT id, name, 
           ts_rank(name_vector, plainto_tsquery_prefix('simple', 'search_term')) as rank_prefix
    FROM locations 
    WHERE name_vector @@ plainto_tsquery_prefix('simple', 'search_term');
  `,

  searchWithLanguageAndPrefix: `
    -- Для англійської мови з префіксним пошуком
    SELECT id, name, category, region, community,
           ts_rank(name_vector, plainto_tsquery_prefix('english', 'search_term')) as rank
    FROM locations 
    WHERE name_vector @@ plainto_tsquery_prefix('english', 'search_term')
    ORDER BY rank DESC;
    
    -- Для російської мови з префіксним пошуком
    SELECT id, name, category, region, community,
           ts_rank(name_vector, plainto_tsquery_prefix('russian', 'search_term')) as rank
    FROM locations 
    WHERE name_vector @@ plainto_tsquery_prefix('russian', 'search_term')
    ORDER BY rank DESC;
  `,

  functionUsage: `
    -- Функція автоматично додає :* до кожного слова
    -- 'ресторан' стає 'ресторан:*'
    -- 'кафе бар' стає 'кафе:* & бар:*'
    
    SELECT plainto_tsquery_prefix('simple', 'ресторан') as query1,
           plainto_tsquery_prefix('simple', 'кафе бар') as query2,
           plainto_tsquery_prefix('simple', '') as query3;
  `
};
