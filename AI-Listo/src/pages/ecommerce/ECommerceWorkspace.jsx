import React, { useMemo, useState } from "react";
import {
  Box,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Plus,
  Upload,
  Store,
  Search,
  RefreshCw,
  MoreHorizontal,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";
import "./ECommerceWorkspace.css";

/*
 * IMPORTANT:
 * This page intentionally does NOT import anything from platformApi/AdminCustomers.
 *
 * E-Commerce Workspace is customer/tenant data only.
 *
 * Backend endpoints to connect later should be tenant-scoped endpoints such as:
 *   GET    /api/ecommerce/summary
 *   GET    /api/ecommerce/products
 *   POST   /api/ecommerce/products
 *   POST   /api/ecommerce/products/import
 *   GET    /api/ecommerce/orders
 *   GET    /api/ecommerce/customers
 *   GET    /api/ecommerce/inventory
 *   POST   /api/ecommerce/store/connect
 *
 * The backend MUST derive tenant/account/workspace identity from the authenticated
 * JWT/session. Never trust a tenantId supplied by the browser.
 */

const KPI_ITEMS = [
  {
    key: "products",
    label: "Products",
    value: 0,
    sub: "Products in your catalog",
    Icon: Box,
    tone: "blue",
  },
  {
    key: "orders",
    label: "Orders",
    value: 0,
    sub: "Orders in this workspace",
    Icon: ShoppingCart,
    tone: "purple",
  },
  {
    key: "customers",
    label: "Customers",
    value: 0,
    sub: "Your store customers",
    Icon: Users,
    tone: "green",
  },
  {
    key: "inventory",
    label: "Inventory",
    value: 0,
    sub: "Units currently tracked",
    Icon: Package,
    tone: "amber",
  },
  {
    key: "revenue",
    label: "Revenue",
    value: "$0",
    sub: "Revenue from your store",
    Icon: DollarSign,
    tone: "teal",
  },
];

const TABS = ["Products", "Orders", "Customers", "Inventory"];

export default function ECommerceWorkspace() {
  // Until tenant-scoped APIs are wired, the workspace starts clean by design.
  // Do NOT replace these values with Admin Customers data or demo data.
  const [activeTab, setActiveTab] = useState("Products");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => [], []);

  const emptyState = {
    Products: {
      Icon: Box,
      title: "No products yet",
      text: "Add your first product, import a catalog, or connect your store to begin.",
      primary: "Add Product",
      secondary: "Import Products",
    },
    Orders: {
      Icon: ShoppingCart,
      title: "No orders yet",
      text: "Orders for this account will appear here after your store is connected or orders are created.",
      primary: "Connect Store",
      secondary: null,
    },
    Customers: {
      Icon: Users,
      title: "No customers yet",
      text: "Only customers belonging to this E-Commerce Workspace will appear here.",
      primary: "Add Customer",
      secondary: "Import Customers",
    },
    Inventory: {
      Icon: Package,
      title: "No inventory yet",
      text: "Inventory will appear after products are added or a connected store is synchronized.",
      primary: "Add Product",
      secondary: "Connect Store",
    },
  }[activeTab];

  const EmptyIcon = emptyState.Icon;

  return (
    <div className="ecw-page">
      <div className="ecw-header">
        <div>
          <h1>E-Commerce</h1>
          <p>
            Manage your products, orders, customers, inventory, and store revenue
            in one tenant-specific workspace.
          </p>
        </div>

        <div className="ecw-header-actions">
          <button type="button" className="ecw-btn">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button type="button" className="ecw-btn">
            <Store size={15} />
            Connect Store
          </button>
          <button type="button" className="ecw-btn ecw-btn-primary">
            <Plus size={15} />
            Add Product
          </button>
        </div>
      </div>

      <div className="ecw-isolation-note">
        <LockKeyhole size={17} />
        <div>
          <strong>Your business data only</strong>
          <span>
            This workspace is isolated from Cortexa Admin Customers and other
            customer accounts.
          </span>
        </div>
      </div>

      <section className="ecw-kpis">
        {KPI_ITEMS.map(({ key, label, value, sub, Icon, tone }) => (
          <article className={`ecw-kpi ecw-kpi-${tone}`} key={key}>
            <div className="ecw-kpi-top">
              <span className="ecw-kpi-icon">
                <Icon size={19} />
              </span>
              <span>{label}</span>
            </div>
            <strong>{value}</strong>
            <small>{sub}</small>
          </article>
        ))}
      </section>

      <section className="ecw-panel">
        <div className="ecw-panel-head">
          <div className="ecw-tabs">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => {
                  setActiveTab(tab);
                  setQuery("");
                }}
              >
                {tab}
                <span>0</span>
              </button>
            ))}
          </div>

          <div className="ecw-panel-actions">
            <label className="ecw-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${activeTab.toLowerCase()}...`}
              />
            </label>

            {activeTab === "Products" && (
              <label className="ecw-btn">
                <Upload size={15} />
                Import Products
                <input type="file" accept=".csv,text/csv" hidden />
              </label>
            )}

            <button type="button" className="ecw-icon-btn" aria-label="More actions">
              <MoreHorizontal size={17} />
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="ecw-empty">
            <span className="ecw-empty-icon">
              <EmptyIcon size={30} />
            </span>
            <h2>{emptyState.title}</h2>
            <p>{emptyState.text}</p>

            <div className="ecw-empty-actions">
              <button type="button" className="ecw-btn ecw-btn-primary">
                {emptyState.primary === "Connect Store" ? (
                  <Store size={15} />
                ) : (
                  <Plus size={15} />
                )}
                {emptyState.primary}
              </button>

              {emptyState.secondary && (
                <button type="button" className="ecw-btn">
                  {emptyState.secondary.includes("Import") ? (
                    <Upload size={15} />
                  ) : (
                    <Store size={15} />
                  )}
                  {emptyState.secondary}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <div className="ecw-dev-note">
        <AlertCircle size={15} />
        <span>
          Tenant-scoped backend is not connected yet, so no global/admin/demo
          records are loaded.
        </span>
      </div>
    </div>
  );
}