import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import type { CustomParams } from "@refinedev/core";
import { supabaseClient } from "./supabase-client";

const baseProvider = supabaseDataProvider(supabaseClient);

export const dataProvider = {
  ...baseProvider,
  custom: async <TData = any>({ url, method, payload }: CustomParams) => {
    if (method === "get" || method === "post") {
      const { data, error } = await supabaseClient.rpc(url, payload as any);
      if (error) throw error;
      return { data: data as TData };
    }
    throw new Error("Not implemented on refine-supabase data provider.");
  },
};
