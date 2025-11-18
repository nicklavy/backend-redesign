// src/ProductProvider.tsx
import React, { createContext, useContext, useState } from "react";

export type ProductKey =
  | "control"
  | "spa"
  | "pool"
  | "activities"
  | "compendium"
  | "fnb"
  | "restaurant";

type Location = { id: string; name: string };

type ProductContextValue = {
  product: ProductKey;
  setProduct: (p: ProductKey) => void;
  locationsByProduct: Record<ProductKey, Location[]>;
  selectedLocation: Location;
  setSelectedLocation: (locationId: string) => void;
};

const ProductContext = createContext<ProductContextValue | undefined>(
  undefined
);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [product, setProduct] = useState<ProductKey>("spa");

  // Demo locations – scoped per product so devs can replace with real data later
  const locationsByProduct: Record<ProductKey, Location[]> = {
    control: [
      { id: "soluna-nash", name: "Soluna Spa Nashville" },
      { id: "soluna-tlh", name: "Soluna Spa Tallahassee" },
      { id: "soluna-nyc", name: "Soluna Spa New York City" },
    ],
    spa: [
      { id: "soluna-nash", name: "Soluna Spa Nashville" },
      { id: "soluna-tlh", name: "Soluna Spa Tallahassee" },
      { id: "soluna-nyc", name: "Soluna Spa New York City" },
    ],
    pool: [
      { id: "pool-nash", name: "Soluna Pool Nashville" },
      { id: "pool-tlh", name: "Soluna Pool Tallahassee" },
    ],
    activities: [
      { id: "act-nash", name: "Soluna Activities Nashville" },
      { id: "act-tlh", name: "Soluna Activities Tallahassee" },
    ],
    compendium: [
      { id: "comp-nash", name: "Soluna Nashville" },
      { id: "comp-tlh", name: "Soluna Tallahassee" },
    ],
    fnb: [
      { id: "fnb-nash", name: "Soluna F&B Nashville" },
      { id: "fnb-tlh", name: "Soluna F&B Tallahassee" },
    ],
    restaurant: [
      { id: "rest-nash", name: "Soluna Restaurant Nashville" },
      { id: "rest-tlh", name: "Soluna Restaurant Tallahassee" },
    ],
  };

  // Keep a selected location *per product* (demo only, no API)
  const [selectedLocations, setSelectedLocations] = useState<
    Record<ProductKey, string>
  >({
    control: "soluna-nash",
    spa: "soluna-nash",
    pool: "pool-nash",
    activities: "act-nash",
    compendium: "comp-nash",
    fnb: "fnb-nash",
    restaurant: "rest-nash",
  });

  const selectedLocationId = selectedLocations[product];
  const selectedLocation =
    locationsByProduct[product].find((l) => l.id === selectedLocationId) ??
    locationsByProduct[product][0];

  const setSelectedLocation = (locationId: string) => {
    setSelectedLocations((prev) => ({
      ...prev,
      [product]: locationId,
    }));
  };

  return (
    <ProductContext.Provider
      value={{
        product,
        setProduct,
        locationsByProduct,
        selectedLocation,
        setSelectedLocation,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) {
    throw new Error("useProduct must be used inside ProductProvider");
  }
  return ctx;
};