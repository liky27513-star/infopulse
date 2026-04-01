// 使用Groq AI（免费）
export {
  generateSummary,
  generateDetailedIntroduction,
  generateDigestOverview,
  classifyNews,
  rateImportance,
  detectBreakingNews,
  processArticle,
  processArticles,
} from './groq-processor'
export type { ProcessedArticle } from './groq-processor'

export {
  deduplicateArticles,
  groupByCategory,
  sortByImportance,
  filterBreakingNews,
  filterImportantNews,
  getTopNewsByCategory,
  generateStatistics,
  filterByTimeRange,
  mergeSimilarNews,
} from './classifier'

export {
  detectBreakingEvents,
  hasBreakingNewsBeenSent,
  filterUnsentBreakingNews,
  detectCategoryBreakingNews,
  generateBreakingSummary,
} from './breaking'
export type { BreakingAlert } from './breaking'
