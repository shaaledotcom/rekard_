import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: User | null; session: Session | null }>
    ) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.accessToken = action.payload.session?.access_token || null;
      state.isAuthenticated = !!action.payload.session;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, clearAuth, setLoading } = authSlice.actions;
export default authSlice.reducer;

