// src/hooks/useModels.ts
import { useEffect, useState } from "react";
import { fetchModels } from "../app/api/modelApi";
import { Model } from "../types";

export function useModels() {
  const [data, setData] = useState<Model[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels()
      .then((data) => setData(data)) 
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}