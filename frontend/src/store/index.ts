export { store } from "./store";
export type { RootState, AppDispatch } from "./store";
export { useAppDispatch, useAppSelector } from "./hooks";
export {
  api,
  useGetMeQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useHealthCheckQuery,
  // Events exports
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  usePublishEventMutation,
  useCancelEventMutation,
  useCompleteEventMutation,
} from "./api";
export type {
  Event,
  EventStatus,
  EventListResponse,
  EventResponse,
  CreateEventRequest,
  UpdateEventRequest,
  EventQueryParams,
} from "./api";
export { setAuth, clearAuth, setLoading } from "./slices/authSlice";

