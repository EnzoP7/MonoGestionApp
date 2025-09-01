import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Servicio } from "@/types/servicio";

export function useServicios(userId: string) {
  return useQuery({
    queryKey: ["servicios", userId],
    queryFn: async (): Promise<Servicio[]> => {
      const { data } = await axios.get(`/api/servicios?userId=${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function useServicio(servicioId: string) {
  return useQuery({
    queryKey: ["servicio", servicioId],
    queryFn: async (): Promise<Servicio> => {
      const { data } = await axios.get(`/api/servicios/${servicioId}`);
      return data;
    },
    enabled: !!servicioId,
  });
}