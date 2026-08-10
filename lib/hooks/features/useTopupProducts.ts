import { useState, useCallback, useTransition, useEffect } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { getTopupProducts } from "@/app/actions/topup-products";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

export type TopupProduct = {
  id: string;
  game_slug: string;
  brand?: string | null;
  title: string;
  selling_price: number;
  cost_price: number;
  sku: string | null;
  is_active: boolean;
  is_gangguan: boolean;
};

export function useTopupProducts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [, startTransition] = useTransition();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = parseInt(searchParams.get("limit") || "10", 10);
  const searchQuery = searchParams.get("search") || "";
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebouncedValue(localSearch, 300);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }
      pushWithParams(params);
    }
  }, [debouncedSearch]);
  const sortBy = searchParams.get("sortBy") || "game_slug";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
  const isActiveFilter = searchParams.get("isActive") || "";
  const isGangguanFilter = searchParams.get("isGangguan") || "";

  const queryKey = {
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    sortBy,
    sortOrder,
    isActive: isActiveFilter,
    isGangguan: isGangguanFilter,
  };

  const { data, isLoading, error, mutate } = useSWR<{
    products: TopupProduct[];
    totalCount: number;
  }>(["topup-products", queryKey], async () => {
    const res = await getTopupProducts(queryKey);
    if (res.error) throw new Error(res.error);
    return { products: (res.data as TopupProduct[]) || [], totalCount: res.totalCount || 0 };
  });

  const products = data?.products ?? [];
  const totalCount = data?.totalCount ?? 0;
  const errorMessage = error instanceof Error ? error.message : "";

  const loadProducts = useCallback(
    (filters: Parameters<typeof getTopupProducts>[0] = {}) => {
      startTransition(() => {
        mutate();
        void filters;
      });
    },
    [mutate],
  );

  const pushWithParams = (params: URLSearchParams) => {
    params.set("page", "1");
    router.push(`/dashboard/topup-products?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === "search") {
      setLocalSearch(value);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    pushWithParams(params);
  };

  const handleResetFilters = () => {
    router.push("/dashboard/topup-products");
  };

  const handlePageSizeChange = (size: number) => {
    if (size === itemsPerPage) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(size));
    params.set("page", "1");
    router.push(`/dashboard/topup-products?${params.toString()}`);
  };

  const handleSortChange = (newSortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === newSortBy) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      params.set("sortOrder", newOrder);
    } else {
      params.set("sortBy", newSortBy);
      params.set("sortOrder", "asc");
    }
    params.set("page", "1");
    router.push(`/dashboard/topup-products?${params.toString()}`);
  };

  const hasActiveFilters =
    searchQuery ||
    isActiveFilter ||
    isGangguanFilter ||
    sortBy !== "game_slug" ||
    sortOrder !== "asc";

  return {
    data: {
      products,
      totalCount,
      currentPage,
      itemsPerPage,
    },
    isLoading,
    error: errorMessage,
    uiState: {
      isAddModalOpen,
      searchQuery: localSearch,
      sortBy,
      sortOrder,
      isActiveFilter,
      isGangguanFilter,
      hasActiveFilters,
    },
    actions: {
      setIsAddModalOpen,
      handleFilterChange,
      handleResetFilters,
      handlePageSizeChange,
      handleSortChange,
      loadProducts: () => startTransition(() => loadProducts()),
    },
  };
}
