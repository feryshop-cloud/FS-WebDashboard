import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTopupProducts } from "@/app/actions/topup-products";

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
  const [products, setProducts] = useState<TopupProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [, startTransition] = useTransition();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = parseInt(searchParams.get("limit") || "10", 10);
  const searchQuery = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "game_slug";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
  const isActiveFilter = searchParams.get("isActive") || "";
  const isGangguanFilter = searchParams.get("isGangguan") || "";

  const loadProducts = useCallback(
    async (
      filters: {
        page?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        isActive?: string;
        isGangguan?: string;
      } = {},
    ) => {
      try {
        setIsLoading(true);
        setError("");
        const res = await getTopupProducts({
          page: filters.page ?? currentPage,
          limit: itemsPerPage,
          search: filters.search ?? searchQuery,
          sortBy: filters.sortBy ?? sortBy,
          sortOrder: (filters.sortOrder ?? sortOrder) as "asc" | "desc",
          isActive: filters.isActive ?? isActiveFilter,
          isGangguan: filters.isGangguan ?? isGangguanFilter,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setProducts((res.data as TopupProduct[]) || []);
          setTotalCount(res.totalCount || 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengambil data produk");
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, searchQuery, sortBy, sortOrder, isActiveFilter, isGangguanFilter, itemsPerPage],
  );

  useEffect(() => {
    let active = true;
    getTopupProducts({
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery,
      sortBy,
      sortOrder,
      isActive: isActiveFilter,
      isGangguan: isGangguanFilter,
    })
      .then((res) => {
        if (!active) return;
        if (res.error) {
          setError(res.error);
        } else {
          setProducts((res.data as TopupProduct[]) || []);
          setTotalCount(res.totalCount || 0);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal mengambil data produk");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentPage, searchQuery, sortBy, sortOrder, isActiveFilter, isGangguanFilter, itemsPerPage]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/dashboard/topup-products?${params.toString()}`);
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
    error,
    uiState: {
      isAddModalOpen,
      searchQuery,
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
