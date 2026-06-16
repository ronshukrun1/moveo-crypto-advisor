export interface CachedProviderResult<T> {
  data: T;
  isStale: boolean;
}
