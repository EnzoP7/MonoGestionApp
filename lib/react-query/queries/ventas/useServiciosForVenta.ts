import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Servicio } from "@prisma/client";
import { DEFAULT_QUERY_OPTIONS } from "../../options";

export const useServiciosForVenta = () => {
  return useQuery({
    queryKey: ["servicios"],
    queryFn: async (): Promise<Servicio[]> => {
      const { data } = await axios.get("/api/servicios");
      return data;
    },
    ...DEFAULT_QUERY_OPTIONS,
  });
};