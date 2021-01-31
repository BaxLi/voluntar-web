import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DemandsState } from './demands.state';
import { Demand } from '@demands/shared/demand';

export const selectRequests = createFeatureSelector<any, DemandsState>(
  'requests',
);

export const selectIsLoading = createSelector(
  selectRequests,
  (state: DemandsState): boolean => {
    return state.isLoading;
  },
);

export const selectRequestsData = createSelector(
  selectRequests,
  (state: DemandsState): Demand[] => {
    return state.data;
  },
);
export const selectRequestsCount = createSelector(
  selectRequests,
  (state: DemandsState): number => {
    return state.count;
  },
);

export const selectRequestsError = createSelector(
  selectRequests,
  (state: DemandsState) => state.error,
);
export const selectRequestsDetails = createSelector(
  selectRequests,
  (state: DemandsState) => state.details,
);
