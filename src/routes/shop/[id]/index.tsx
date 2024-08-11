import { component$, useStore, useTask$, $ } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import './index.css';

interface GameDeal {
  [x: string]: string;
  dealID: string;
  title: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  steamRatingText: string;
  steamRatingPercent: string;
  thumb: string;
}

export default component$(() => {
  const params = useLocation();
  const shopID = params.params.id;
  const state = useStore({
    deals: [] as GameDeal[],
    isLoading: true,
    error: null as string | null,
    sortBy: 'salePrice' as 'salePrice' | 'savings' | 'steamRatingPercent',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  const sortDeals = $(() => {
    state.deals.sort((a, b) => {
      let valueA: number;
      let valueB: number;
      
      if (state.sortBy === 'salePrice' || state.sortBy === 'savings') {
        valueA = Number.parseFloat(a[state.sortBy]);
        valueB = Number.parseFloat(b[state.sortBy]);
      } else {
        valueA = Number.parseInt(a[state.sortBy]);
        valueB = Number.parseInt(b[state.sortBy]);
      }

      return state.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
  });

  useTask$(({ track }) => {
    track(() => state.sortBy);
    track(() => state.sortOrder);
    sortDeals();
  });

  useTask$(async () => {
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/1.0/deals?storeID=${shopID}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      state.deals = data.filter((deal: GameDeal) => deal.isOnSale === "1");
      sortDeals();
      state.isLoading = false;
    } catch (e) {
      state.error = e instanceof Error ? e.message : "An unknown error occurred";
      state.isLoading = false;
    }
  });

  return (
    <div class="container">
      <h1 class="title">Active Game Deals</h1>
      {state.isLoading ? (
        <div class="loading">
          <div class="spinner" />
          <p>Loading deals...</p>
        </div>
      ) : state.error ? (
        <p class="error">Error: {state.error}</p>
      ) : (
        <>
          <div class="sort-controls">
            <select
              value={state.sortBy}
              onChange$={(e) => {
                const target = e.target as HTMLSelectElement;
                state.sortBy = target.value as typeof state.sortBy;
                sortDeals();
              }}
            >
              <option value="salePrice">Price</option>
              <option value="savings">Savings</option>
              <option value="steamRatingPercent">Rating</option>
            </select>
            <button
              type="button"
              onClick$={() => {
                state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
                sortDeals();
              }}
            >
              {state.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          <div class="deals-grid">
            {state.deals.map((deal) => (
              <div key={deal.dealID} class="deal-card">
                <div class="deal-thumbnail">
                  <img
                    src={deal.thumb}
                    alt={`${deal.title} thumbnail`}
                    width="120"
                    height="120"
                  />
                </div>
                <h2 class="deal-title">{deal.title}</h2>
                <div class="deal-price">
                  <p>Sale Price: ${deal.salePrice}</p>
                  <p>
                    Normal Price: <span style={{ textDecoration: 'line-through' }}>${deal.normalPrice}</span>
                  </p>
                  <p>Savings: {Number.parseFloat(deal.savings).toFixed(1)}%</p>
                </div>
                <p class="deal-rating">
                  {deal.steamRatingText} ({deal.steamRatingPercent}%)
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Game Deals List",
  meta: [
    {
      name: "description",
      content: "List of active game deals from the CheapShark API",
    },
  ],
};