import { component$, useStore, useTask$ } from "@builder.io/qwik";
import { useNavigate, type DocumentHead } from "@builder.io/qwik-city";
import './index.css'

interface StoreData {
  storeID: string;
  storeName: string;
  isActive: number;
  images: {
    banner: string;
    logo: string;
    icon: string;
  };
}

export default component$(() => {
  const nav = useNavigate();
  const state = useStore({
    stores: [] as StoreData[],
    isLoading: true,
    error: null as string | null,
  });

  useTask$(async () => {
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/1.0/stores`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      state.stores = data.filter((store: StoreData) => store.isActive === 1);
      state.isLoading = false;
    } catch (e) {
      state.error = e instanceof Error ? e.message : "An unknown error occurred";
      state.isLoading = false;
    }
  });

  return (
    <div class="container">
      <h1 class="title">Active Game Stores</h1>
      {state.isLoading ? (
        <div class="loading">
          <div class="spinner" />
          <p>Loading stores...</p>
        </div>
      ) : state.error ? (
        <p class="error">Error: {state.error}</p>
      ) : (
        <div class="stores-grid">
          {state.stores.map((store) => (
            <div key={store.storeID} class="store-card" onClick$={() => nav(`/shop/${store.storeID}`)}>
              <div class="store-logo">
                <img
                  src={`${import.meta.env.PUBLIC_API_URL}${store.images.logo}`}
                  alt={`${store.storeName} logo`}
                  width="200"
                  height="100"
                />
              </div>
              <h2 class="store-name">{store.storeName}</h2>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Game Stores List",
  meta: [
    {
      name: "description",
      content: "List of active game stores from CheapShark API",
    },
  ],
};