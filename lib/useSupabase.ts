"use client";
export const dynamic = "force-dynamic";
import { useMemo } from "react";
import { getSupabaseClient } from "./supabaseClient";

export const useSupabase = () => {
  return useMemo(() => getSupabaseClient(), []);
};