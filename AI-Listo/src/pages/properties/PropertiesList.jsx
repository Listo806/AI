import React, { useEffect, useMemo, useState } from "react";
import "./properties.css";
import {
  getProperties,
  getPropertiesDashboard,
  createProperty,
  publishProperty,
  deleteProperty,
  updateProperty,
  getPropertyById,
  getPropertyMedia,
  uploadPropertyImage,
  deletePropertyMedia,
  setPropertyThumbnail,
} from "../../api/propertiesApi";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Download,
  Plus,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Home,
  CheckCircle2,
  DollarSign,
  Flame,
  Bot,
  Percent,
  MoreVertical,
  BedDouble,
  Bath,
  Maximize,
  Pipette,
  Calendar,
  RotateCcw,
  Clock3,
  FileText,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [dateRange, setDateRange] = useState("all");

  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [savingProperty, setSavingProperty] = useState(false);
  const [propertyImages, setPropertyImages] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [agentId, setAgentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [aiScore, setAiScore] = useState("");
  const [openActionId, setOpenActionId] = useState(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedAnalysisProperty, setSelectedAnalysisProperty] =
    useState(null);
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentOffset = (page - 1) * perPage;

  const defaultPropertyForm = {
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    price: "",
    type: "sale",
    propertyType: "house",
    status: "draft",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
  };
  const [propertyForm, setPropertyForm] = useState(defaultPropertyForm);

  const cityOptions = useMemo(
    () => [...new Set(properties.map((p) => p.city).filter(Boolean))],
    [properties],
  );

  const agentOptions = useMemo(() => {
    const map = new Map();

    properties.forEach((p) => {
      if (p.assignedAgentId && p.agentName) {
        map.set(p.assignedAgentId, p.agentName);
      }
    });

    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [properties]);

  const teamOptions = useMemo(() => {
    const map = new Map();

    properties.forEach((p) => {
      if (p.teamId && p.teamName) {
        map.set(p.teamId, p.teamName);
      }
    });

    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [properties]);

  const openAddPropertyModal = () => {
    setEditingProperty(null);
    setPropertyForm(defaultPropertyForm);
    setPropertyImages([]);
    setExistingMedia([]);
    setPropertyModalOpen(true);
  };

  const openEditPropertyModal = async (property) => {
    setEditingProperty(property);

    setPropertyForm({
      title: property.title || "",
      description: property.description || "",
      address: property.address || "",
      city: property.city || "",
      state: property.state || "",
      zipCode: property.zipCode || "",
      price: property.price || "",
      type: property.type || "sale",
      propertyType: property.propertyType || "house",
      status: property.status || "draft",
      bedrooms: property.bedrooms || "",
      bathrooms: property.bathrooms || "",
      squareFeet: property.squareFeet || "",
    });

    setPropertyImages([]);
    setExistingMedia([]);
    setPropertyModalOpen(true);

    try {
      const media = await getPropertyMedia(property.id);
      setExistingMedia(Array.isArray(media) ? media : []);
    } catch (error) {
      console.error("Load property media failed:", error);
    }
  };

  const closePropertyModal = () => {
    setPropertyModalOpen(false);
    setEditingProperty(null);
    setPropertyForm(defaultPropertyForm);
    setPropertyImages([]);
    setExistingMedia([]);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);

    const imageFiles = files.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );

    setPropertyImages((prev) => [...prev, ...imageFiles].slice(0, 20));
  };

  const removeSelectedImage = (index) => {
    setPropertyImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImagesForProperty = async (propertyId) => {
    if (!propertyImages.length) return null;

    setUploadingImages(true);

    try {
      let firstUploadedUrl = null;

      for (const file of propertyImages) {
        const media = await uploadPropertyImage(propertyId, file);
        const mediaUrl = media?.url || media?.data?.url;

        if (!firstUploadedUrl && mediaUrl) {
          firstUploadedUrl = mediaUrl;
        }
      }

      if (firstUploadedUrl) {
        await setPropertyThumbnail(propertyId, firstUploadedUrl);
      }

      return firstUploadedUrl;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteExistingMedia = async (media) => {
    if (!editingProperty?.id || !media?.id) return;

    if (!window.confirm("Delete this image?")) return;

    try {
      await deletePropertyMedia(editingProperty.id, media.id);

      setExistingMedia((prev) => prev.filter((item) => item.id !== media.id));

      if (editingProperty.thumbnailUrl === media.url) {
        await setPropertyThumbnail(editingProperty.id, null);
      }

      await loadProperties(null, page);
    } catch (error) {
      console.error("Delete property media failed:", error);
    }
  };

  const handleSetThumbnail = async (media) => {
    if (!editingProperty?.id || !media?.url) return;

    try {
      await setPropertyThumbnail(editingProperty.id, media.url);
      setEditingProperty((prev) => ({ ...prev, thumbnailUrl: media.url }));
      await loadProperties(null, page);
    } catch (error) {
      console.error("Set thumbnail failed:", error);
    }
  };

  const handleSubmitProperty = async (e) => {
    e.preventDefault();

    const payload = {
      title: propertyForm.title,
      description: propertyForm.description || null,
      address: propertyForm.address || null,
      city: propertyForm.city || null,
      state: propertyForm.state || null,
      zipCode: propertyForm.zipCode || null,
      price: propertyForm.price ? Number(propertyForm.price) : null,
      type: propertyForm.type,
      propertyType: propertyForm.propertyType,
      status: propertyForm.status,
      bedrooms: propertyForm.bedrooms ? Number(propertyForm.bedrooms) : null,
      bathrooms: propertyForm.bathrooms ? Number(propertyForm.bathrooms) : null,
      squareFeet: propertyForm.squareFeet
        ? Number(propertyForm.squareFeet)
        : null,
      listingType: "marketplace",
    };

    try {
      setSavingProperty(true);

      let savedProperty;

      if (editingProperty?.id) {
        savedProperty = await updateProperty(editingProperty.id, payload);
      } else {
        savedProperty = await createProperty(payload);
      }

      if (savedProperty?.id && propertyImages.length) {
        await uploadImagesForProperty(savedProperty.id);
      }

      closePropertyModal();
      await loadProperties(null, page);
      await loadDashboard();
    } catch (error) {
      console.error(
        editingProperty ? "Update property failed:" : "Create property failed:",
        error,
      );
    } finally {
      setSavingProperty(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const data = await getPropertiesDashboard({
        range: dateRange,
      });

      setDashboard(data);
    } catch (error) {
      console.error("Load properties dashboard failed:", error);
    }
  };

  const loadProperties = async (overrideFilters = null, nextPage = page) => {
    try {
      setLoading(true);

      const filters = overrideFilters || {
        search,
        type,
        status,
        city,
        propertyType,
        minPrice,
        maxPrice,
        agentId,
        teamId,
        aiScore,
      };

      const data = await getProperties({
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        city: filters.city || undefined,
        propertyType: filters.propertyType || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        agentId: filters.agentId || undefined,
        teamId: filters.teamId || undefined,
        aiScore: filters.aiScore || undefined,
        limit: perPage,
        offset: (nextPage - 1) * perPage,
      });

      setProperties(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total || 0));
    } catch (error) {
      console.error("Load properties failed:", error);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadProperties(null, page);
  }, [dateRange, page, perPage]);

  const formatTrend = (item) => {
    const trend = item?.trend;

    if (!trend) return "—";

    return `${trend.symbol} ${trend.changePercent}% vs ${dashboard?.compareLabel || "previous period"}`;
  };

  const metrics = [
    {
      title: "Total Properties",
      value: dashboard?.totalProperties?.value ?? 0,
      trend: dashboard?.totalProperties?.trend?.text || "→ 0% all time",
      trendType: dashboard?.totalProperties?.trend?.direction || "flat",
      icon: <Home size={20} />,
      className: "blue",
    },
    {
      title: "Active Listings",
      value: dashboard?.activeListings?.value ?? 0,
      trend: dashboard?.activeListings?.trend?.text || "→ 0% all time",
      trendType: dashboard?.activeListings?.trend?.direction || "flat",
      icon: <CheckCircle2 size={20} />,
      className: "green",
    },
    {
      title: "Total Value",
      value: `$${Number(dashboard?.totalValue?.value || 0).toLocaleString()}`,
      trend: dashboard?.totalValue?.trend?.text || "→ 0% all time",
      trendType: dashboard?.totalValue?.trend?.direction || "flat",
      icon: <DollarSign size={20} />,
      className: "purple",
    },
    {
      title: "Hot Properties",
      value: dashboard?.hotProperties?.value ?? 0,
      trend: dashboard?.hotProperties?.trend?.text || "→ 0% coming soon",
      trendType: dashboard?.hotProperties?.trend?.direction || "flat",
      icon: <Flame size={20} />,
      className: "orange",
    },
    {
      title: "AI Optimized",
      value: dashboard?.aiOptimized?.value ?? 0,
      trend: dashboard?.aiOptimized?.trend?.text || "→ 0% coming soon",
      trendType: dashboard?.aiOptimized?.trend?.direction || "flat",
      icon: <Bot size={20} />,
      className: "cyan",
    },
    {
      title: "Conversion Rate",
      value: `${dashboard?.conversionRate?.value ?? 0}%`,
      trend: dashboard?.conversionRate?.trend?.text || "→ 0% all time",
      trendType: dashboard?.conversionRate?.trend?.direction || "flat",
      icon: <Percent size={20} />,
      className: "green",
    },
  ];

  const inventoryHealth = dashboard?.inventoryHealth || {};

  const getPercent = (value, totalValue) => {
    if (!totalValue) return 0;
    return Math.round((Number(value || 0) / Number(totalValue || 0)) * 100);
  };

  const healthTotal = Number(inventoryHealth.total || 0);
  const healthActive = Number(inventoryHealth.active || 0);
  const healthUnderReview = Number(inventoryHealth.underReview || 0);
  const healthDraft = Number(inventoryHealth.draft || 0);
  const healthInactive = Number(inventoryHealth.inactive || 0);
  const inventoryScore = Number(inventoryHealth.inventoryScore || 0);

  const getInventoryStatus = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Poor";
  };

  const exportPropertiesCsv = () => {
    const rows = properties.map((p) => ({
      title: p.title || "",
      price: p.price || "",
      type: p.type || "",
      propertyType: p.propertyType || "",
      status: p.status || "",
      city: p.city || "",
      state: p.state || "",
      address: p.address || "",
      bedrooms: p.bedrooms || "",
      bathrooms: p.bathrooms || "",
      squareFeet: p.squareFeet || "",
      aiScore: p.aiScore || 0,
      agent: p.agentName || p.createdByName || "",
      team: p.teamName || "",
    }));

    const headers = Object.keys(
      rows[0] || {
        title: "",
        price: "",
        type: "",
        propertyType: "",
        status: "",
        city: "",
        state: "",
        address: "",
        bedrooms: "",
        bathrooms: "",
        squareFeet: "",
        aiScore: "",
        agent: "",
        team: "",
      },
    );

    const csv = [headers, ...rows.map((row) => headers.map((key) => row[key]))]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "properties-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const matchedLeads = dashboard?.matchedLeads || [];

  const weakProperties = useMemo(() => {
    return properties
      .filter((p) => Number(p.aiScore || 0) < 80)
      .sort((a, b) => Number(a.aiScore || 0) - Number(b.aiScore || 0));
  }, [properties]);

  const reportMetrics = [
    {
      title: "Total Properties",
      value: dashboard?.totalProperties?.value ?? 0,
      trend: dashboard?.totalProperties?.trend?.text || "→ 0% all time",
    },
    {
      title: "Active Listings",
      value: dashboard?.activeListings?.value ?? 0,
      trend: dashboard?.activeListings?.trend?.text || "→ 0% all time",
    },
    {
      title: "Total Value",
      value: `$${Number(dashboard?.totalValue?.value || 0).toLocaleString()}`,
      trend: dashboard?.totalValue?.trend?.text || "→ 0% all time",
    },
    {
      title: "Hot Properties",
      value: dashboard?.hotProperties?.value ?? 0,
      trend: dashboard?.hotProperties?.trend?.text || "→ 0% coming soon",
    },
    {
      title: "AI Optimized",
      value: dashboard?.aiOptimized?.value ?? 0,
      trend: dashboard?.aiOptimized?.trend?.text || "→ 0% coming soon",
    },
    {
      title: "Conversion Rate",
      value: `${dashboard?.conversionRate?.value ?? 0}%`,
      trend: dashboard?.conversionRate?.trend?.text || "→ 0% all time",
    },
  ];

  const printPropertyReport = () => {
    setReportOpen(true);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  const openPropertyDrawer = async (property) => {
    try {
      setDrawerOpen(true);
      setDrawerLoading(true);

      setSelectedProperty(property);

      const detail = await getPropertyById(property.id);

      setSelectedProperty({
        ...property,
        ...detail,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closePropertyDrawer = () => {
    setDrawerOpen(false);
    setSelectedProperty(null);
  };

  const getPropertyAiIssues = (property) => {
    if (!property) return [];

    const issues = [];

    if (!property.thumbnailUrl) issues.push("Missing property images");

    if (!property.description || property.description.length < 120)
      issues.push("Description is too short");

    if (!property.address) issues.push("Address incomplete");

    if (!property.price) issues.push("Price missing");

    if (!property.bedrooms && !property.bathrooms && !property.squareFeet)
      issues.push("Missing property specifications");

    if (property.status !== "published") issues.push("Property not published");

    return issues;
  };

  const getPropertyRecommendations = (property) => {
    const issues = getPropertyAiIssues(property);

    return issues.map((issue) => {
      switch (issue) {
        case "Missing property images":
          return "Upload high-quality images";

        case "Description is too short":
          return "Generate AI description";

        case "Address incomplete":
          return "Complete address";

        case "Price missing":
          return "Set listing price";

        case "Missing property specifications":
          return "Add bedrooms, bathrooms and square feet";

        case "Property not published":
          return "Publish listing";

        default:
          return issue;
      }
    });
  };

  const getPropertyTimeline = (property) => {
    if (!property) return [];

    return [
      {
        title: "Property Created",
        time: property.createdAt,
        description: "Listing created",
      },

      property.updatedAt && {
        title: "Last Updated",
        time: property.updatedAt,
        description: "Listing updated",
      },

      property.publishedAt && {
        title: "Published",
        time: property.publishedAt,
        description: "Published successfully",
      },

      {
        title: "AI Analysis",
        time: new Date().toISOString(),
        description: `AI Score ${property.aiScore || 0}/100`,
      },

      {
        title: "Lead Matching",
        time: new Date().toISOString(),
        description: `${property.matchedLeads || 0} matched leads`,
      },
    ].filter(Boolean);
  };

  const formatDateTime = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleString();
  };

  return (
    <div className="properties-page">
      <div className="heading_page">
        <Home className="header-icon" size={20} />
        <h1>AI Property Inventory</h1>
        <p className="next_head">Command Center</p>
        <Sparkles size={16} color="#2563eb" />
      </div>
      <p className="sub_head">
        Manage, analyze and optimize your property listing with AI intelligence
      </p>
      <div className="page-header">
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setAnalysisOpen(true)}
          >
            <Sparkles size={16} color="#2563eb" /> Analyze Properties
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedAnalysisProperty(null);
              setAnalysisOpen(true);
            }}
          >
            <Pipette size={16} />
            Auto-Optimize Listings
          </button>
          <button className="btn btn-secondary" onClick={printPropertyReport}>
            <Download size={16} className="blue" /> Export Property Report
          </button>
          <button className="btn btn-primary" onClick={openAddPropertyModal}>
            <Plus size={16} />
            Add Property
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="metrics-grid">
        {metrics.map((item, idx) => (
          <div className="metric-card" key={idx}>
            <div className={`metric-icon ${item.className}`}>{item.icon}</div>
            <div className="metric-info">
              <span>{item.title}</span>
              <h2>{item.value}</h2>
              <span className={`metric-trend ${item.trendType}`}>
                {item.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS CONTROL ROW */}
      <div className="filters-row">
        <div className="search-box">
          <Search size={16} color="#94a3b8" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties, addresses, MLS ID..."
          />
        </div>

        <div className="filter-select-wrapper search-date">
          <select
            className="filter-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="this_month">This month</option>
          </select>
          <Calendar size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All Listing Types</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="">All Property Types</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
            <option value="villa">Villa</option>
            <option value="office">Office</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>

        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={aiScore}
            onChange={(e) => setAiScore(e.target.value)}
          >
            <option value="">All AI Scores</option>
            <option value="high">High 80+</option>
            <option value="medium">Medium 50-79</option>
            <option value="low">Low under 50</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            <option value="">All Agents</option>
            {agentOptions.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">All Teams</option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <button
          className="btn btn-secondary"
          style={{ height: "38px" }}
          onClick={() => {
            const emptyFilters = {
              search: "",
              type: "",
              status: "",
              city: "",
              propertyType: "",
              minPrice: "",
              maxPrice: "",
              agentId: "",
              teamId: "",
              aiScore: "",
            };

            setSearch("");
            setType("");
            setStatus("");
            setCity("");
            setPropertyType("");
            setMinPrice("");
            setMaxPrice("");
            setAgentId("");
            setTeamId("");
            setAiScore("");
            setDateRange("all");
            setPage(1);
            loadProperties(emptyFilters, 1);
            getPropertiesDashboard({ range: "all" }).then(setDashboard);
            loadProperties(emptyFilters);
            getPropertiesDashboard({ range: "all" }).then(setDashboard);
          }}
        >
          <RotateCcw size={14} />
          Clear Filters
        </button>
        <button
          className="btn btn-primary"
          style={{ height: "38px", padding: "0 12px" }}
          onClick={() => {
            setPage(1);
            loadProperties(null, 1);
            loadDashboard();
          }}
        >
          <Search size={14} />
          Search
        </button>
        <button
          className="btn btn-secondary export"
          style={{ height: "38px" }}
          onClick={exportPropertiesCsv}
        >
          <Download size={15} className="blue" /> Export
        </button>

        <div className="view-toggle-group">
          <button
            className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-layout">
        {/* LEFT COMPONENT: PROPERTIES LIST */}
        <div
          className={
            viewMode === "grid"
              ? "properties-grid"
              : "properties-grid properties-list-view"
          }
        >
          {loading ? (
            <div className="property-card">
              <div className="card-body">Loading properties...</div>
            </div>
          ) : properties.length === 0 ? (
            <div className="property-card">
              <div className="card-body">No properties found.</div>
            </div>
          ) : (
            properties.map((property, idx) => (
              <div
                className="property-card"
                key={property.id || idx}
                onClick={() => openPropertyDrawer(property)}
              >
                <div className="card-image-wrapper">
                  {/* Fallback pattern representing images in mockup */}
                  {property.thumbnailUrl ? (
                    <img
                      src={property.thumbnailUrl}
                      alt={property.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        background: "#e2e8f0",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                      }}
                    >
                      Property Image Layout
                    </div>
                  )}
                  <span
                    className={`badge-status ${property.status === "published" ? "active" : "under-review"}`}
                  >
                    {(property.status || "draft")
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                  <div className="property-card-actions">
                    <button
                      className="card-actions-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(
                          openActionId === property.id ? null : property.id,
                        );
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openActionId === property.id && (
                      <div className="property-actions-menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnalysisProperty(property);
                            setAnalysisOpen(true);
                            setOpenActionId(null);
                          }}
                        >
                          View Analysis
                        </button>

                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await publishProperty(property.id);
                            setOpenActionId(null);
                            await loadProperties();
                            await loadDashboard();
                          }}
                        >
                          Publish
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPropertyModal(property);
                            setOpenActionId(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="danger"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm("Delete this property?"))
                              return;
                            await deleteProperty(property.id);
                            setOpenActionId(null);
                            await loadProperties();
                            await loadDashboard();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  <div className="price-row">
                    <h3>
                      {property.price
                        ? `$${Number(property.price).toLocaleString()}`
                        : "No price"}
                    </h3>
                    <div className="ai-score-badge">
                      <strong
                        className={`score-number ${
                          Number(property.aiScore || 0) >= 80
                            ? "high"
                            : Number(property.aiScore || 0) >= 50
                              ? "medium"
                              : "low"
                        }`}
                      >
                        {Number(property.aiScore || 0)}
                      </strong>
                      <span>AI Score</span>
                    </div>
                  </div>

                  <p className="property-address">
                    {[
                      property.address,
                      property.city,
                      property.state,
                      property.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address"}
                  </p>

                  <div className="property-specs">
                    <div className="spec-item">
                      <BedDouble size={14} /> {property.bedrooms || 0}
                    </div>
                    <div className="spec-item">
                      <Bath size={14} /> {property.bathrooms || 0}
                    </div>
                    <div className="spec-item">
                      <Maximize size={14} />{" "}
                      {property.squareFeet
                        ? `${property.squareFeet} sqft`
                        : "—"}
                    </div>
                  </div>

                  <div className="financials-row">
                    <div className="financial-item">
                      <span>Revenue Potential</span>
                      <strong className="green-text">
                        $
                        {Number(
                          property.revenuePotential || 0,
                        ).toLocaleString()}
                      </strong>
                    </div>
                    <div
                      className="financial-item"
                      style={{ textAlign: "right" }}
                    >
                      <span>Matched Leads</span>
                      <strong className="text-align-right">
                        {Number(property.matchedLeads || 0)} ↗
                      </strong>
                    </div>
                  </div>

                  <div className="agent-footer">
                    <div className="agent-info">
                      <div className="agent-avatar fallback-avatar">
                        {(property.agentName || property.createdByName || "U")
                          .toString()
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h5>
                          {property.agentName ||
                            property.createdByName ||
                            "Unassigned"}
                        </h5>
                        <p>{property.teamName || "No team"}</p>
                      </div>
                    </div>

                    <span
                      className={`listing-status-tag ${
                        property.status === "published" ? "active" : "review"
                      }`}
                    >
                      {property.status || "draft"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="properties-pagination">
          <div className="pagination-info">
            Showing {properties.length} of {total} properties
          </div>

          <div className="pagination-controls">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={8}>8 / page</option>
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
            </select>

            <button
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>

            <span>
              Page {page} / {totalPages}
            </span>

            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
        {/* RIGHT COMPONENT: SIDEBAR PLATFORM PANEL */}
        <div className="sidebar-panel">
          {/* SECTION 1: INVENTORY HEALTH */}
          <div className="sidebar-section">
            <div className="section-header">
              <h3>
                <ShieldCheck size={18} className="blue" />
                Inventory Health
              </h3>
            </div>

            <div className="health-chart-wrapper">
              <div className="chart-wrap">
                <div
                  className="donut-chart-mock"
                  style={{
                    background: `conic-gradient(
      #16a34a 0 ${getPercent(healthActive, healthTotal)}%,
      #ea580c ${getPercent(healthActive, healthTotal)}% ${
        getPercent(healthActive, healthTotal) +
        getPercent(healthUnderReview, healthTotal)
      }%,
      #64748b ${
        getPercent(healthActive, healthTotal) +
        getPercent(healthUnderReview, healthTotal)
      }% ${
        getPercent(healthActive, healthTotal) +
        getPercent(healthUnderReview, healthTotal) +
        getPercent(healthDraft, healthTotal)
      }%,
      #dc2626 ${
        getPercent(healthActive, healthTotal) +
        getPercent(healthUnderReview, healthTotal) +
        getPercent(healthDraft, healthTotal)
      }% 100%
    )`,
                  }}
                >
                  <div className="chart-center">
                    <h4>{healthTotal}</h4>
                    <span>Total</span>
                  </div>
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-label">
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span>Active</span>
                    </div>
                    <span className="legend-value">
                      {healthActive} ({getPercent(healthActive, healthTotal)}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <Clock3 size={14} color="#ea580c" />
                      <span>Under Review</span>
                    </div>
                    {healthUnderReview} (
                    {getPercent(healthUnderReview, healthTotal)}%)
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <FileText size={14} color="#64748b" />
                      <span>Draft</span>
                    </div>
                    {healthDraft} ({getPercent(healthDraft, healthTotal)}%)
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <AlertCircle size={14} color="#dc2626" />
                      <span>Inactive</span>
                    </div>
                    {healthInactive} ({getPercent(healthInactive, healthTotal)}
                    %)
                  </div>
                </div>
              </div>
              <div className="inventory-score-box">
                <div className="score-info">
                  <h5>Inventory Score</h5>
                  <div className="score-display">
                    {inventoryScore} <span className="score-max">/100</span>
                  </div>
                  <span className="score-status">
                    {getInventoryStatus(inventoryScore)}
                  </span>
                </div>
                <div className="score-trend">
                  <span className="trend-up-text">
                    {dashboard?.activeListings?.trend?.text || "→ 0% all time"}
                  </span>
                  {/*<p>{dashboard?.rangeLabel || "All time"}</p>*/}
                </div>
              </div>
            </div>
            <div className="section-footer-link">
              <a
                href="#view-analysis"
                className="section-link"
                onClick={() => setAnalysisOpen(true)}
              >
                View Full Analysis <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* SECTION 2: MATCHED LEADS */}
          <div className="sidebar-section">
            <div className="section-header">
              <h3>
                <Users size={18} className="blue" />
                Matched Leads
              </h3>
              <a
                href="#view-all-leads"
                className="section-link"
                onClick={() => navigate("/dashboard/leads")}
              >
                View All Leads
                <ArrowRight size={13} />
              </a>
            </div>

            <div className="matched-leads-list">
              {matchedLeads.length === 0 ? (
                <div className="matched-lead-item">
                  <div className="lead-details">
                    <h4>No matched leads yet</h4>
                    <p>
                      Matching will appear when leads have city, budget, or
                      property interest.
                    </p>
                  </div>
                </div>
              ) : (
                matchedLeads.map((lead) => (
                  <div className="matched-lead-item" key={lead.id}>
                    <div className="lead-left-content">
                      <div className="lead-avatar-img fallback-avatar">
                        {(lead.name || "L").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="lead-details">
                        <h4>{lead.name}</h4>
                        <p>
                          <MapPin size={12} color="#94a3b8" /> {lead.location}
                        </p>
                      </div>
                    </div>

                    <div className="lead-right-meta">
                      <span className="budget">Budget: {lead.budget}</span>
                      <span className="matches-count">
                        Matched properties: <strong>{lead.count}</strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {drawerOpen && (
        <div className="property-drawer-backdrop" onClick={closePropertyDrawer}>
          <aside
            className="property-detail-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <div className="drawer-label">Property Detail</div>

                <h2>{selectedProperty?.title}</h2>

                <p>
                  {[
                    selectedProperty?.address,
                    selectedProperty?.city,
                    selectedProperty?.state,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <button onClick={closePropertyDrawer}>×</button>
            </div>

            {drawerLoading ? (
              <div className="drawer-loading">Loading...</div>
            ) : (
              <>
                <div className="drawer-image">
                  {selectedProperty?.thumbnailUrl ? (
                    <img src={selectedProperty.thumbnailUrl} alt="" />
                  ) : (
                    <div className="drawer-placeholder">No Image</div>
                  )}
                </div>

                <div className="drawer-kpis">
                  <div>
                    <span>Price</span>

                    <strong>
                      ${Number(selectedProperty?.price || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>AI Score</span>

                    <strong>{selectedProperty?.aiScore || 0}/100</strong>
                  </div>

                  <div>
                    <span>Revenue Potential</span>

                    <strong>
                      $
                      {Number(
                        selectedProperty?.revenuePotential || 0,
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>Matched Leads</span>

                    <strong>{selectedProperty?.matchedLeads || 0}</strong>
                  </div>
                </div>

                <div className="drawer-section">
                  <h3>AI Suggestions</h3>

                  <div className="drawer-list">
                    {getPropertyRecommendations(selectedProperty).map(
                      (item) => (
                        <div className="drawer-list-item" key={item}>
                          <Sparkles size={14} />

                          <span>{item}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="drawer-section">
                  <h3>Timeline</h3>

                  <div className="timeline">
                    {getPropertyTimeline(selectedProperty).map(
                      (item, index) => (
                        <div className="timeline-item" key={index}>
                          <div className="timeline-dot" />

                          <div>
                            <strong>{item.title}</strong>

                            <p>{item.description}</p>

                            <span>{formatDateTime(item.time)}</span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
      {propertyModalOpen && (
        <div className="modal-overlay">
          <div className="property-modal">
            <div className="modal-header">
              <h3>{editingProperty ? "Edit Property" : "Add Property"}</h3>
              <button onClick={closePropertyModal}>×</button>
            </div>

            <form onSubmit={handleSubmitProperty} className="property-form">
              <input
                required
                placeholder="Property title"
                value={propertyForm.title}
                onChange={(e) =>
                  setPropertyForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />

              <input
                placeholder="Address"
                value={propertyForm.address}
                onChange={(e) =>
                  setPropertyForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />

              <div className="form-grid-2">
                <input
                  placeholder="City"
                  value={propertyForm.city}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />

                <input
                  placeholder="State"
                  value={propertyForm.state}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-grid-2">
                <input
                  type="number"
                  placeholder="Price"
                  value={propertyForm.price}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />

                <input
                  placeholder="Zip code"
                  value={propertyForm.zipCode}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      zipCode: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-grid-2">
                <select
                  value={propertyForm.type}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>

                <select
                  value={propertyForm.propertyType}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      propertyType: e.target.value,
                    }))
                  }
                >
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                  <option value="villa">Villa</option>
                  <option value="office">Office</option>
                </select>
              </div>

              <div className="form-grid-2">
                <select
                  value={propertyForm.status}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="archived">Archived</option>
                </select>

                <input
                  type="number"
                  placeholder="Sqft"
                  value={propertyForm.squareFeet}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      squareFeet: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-grid-2">
                <input
                  type="number"
                  placeholder="Beds"
                  value={propertyForm.bedrooms}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      bedrooms: e.target.value,
                    }))
                  }
                />

                <input
                  type="number"
                  placeholder="Baths"
                  value={propertyForm.bathrooms}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      bathrooms: e.target.value,
                    }))
                  }
                />
              </div>

              <textarea
                placeholder="Description"
                value={propertyForm.description}
                onChange={(e) =>
                  setPropertyForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              <div className="property-image-uploader">
                <div className="image-uploader-header">
                  <div>
                    <h4>Property Images</h4>
                    <p>Upload JPG, PNG, or WebP images. Max 20 images.</p>
                  </div>

                  <label className="btn btn-secondary image-upload-btn">
                    <Plus size={14} />
                    Add Images
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      hidden
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>

                {existingMedia.length > 0 && (
                  <div className="image-preview-grid">
                    {existingMedia.map((media) => (
                      <div className="image-preview-item" key={media.id}>
                        <img src={media.url} alt="Property media" />

                        <div className="image-preview-actions">
                          <button
                            type="button"
                            onClick={() => handleSetThumbnail(media)}
                          >
                            Set Cover
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteExistingMedia(media)}
                          >
                            Delete
                          </button>
                        </div>

                        {editingProperty?.thumbnailUrl === media.url && (
                          <span className="cover-badge">Cover</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {propertyImages.length > 0 && (
                  <div className="image-preview-grid">
                    {propertyImages.map((file, index) => (
                      <div
                        className="image-preview-item"
                        key={`${file.name}-${index}`}
                      >
                        <img src={URL.createObjectURL(file)} alt={file.name} />

                        <div className="image-preview-actions">
                          <button
                            type="button"
                            className="danger"
                            onClick={() => removeSelectedImage(index)}
                          >
                            Remove
                          </button>
                        </div>

                        <span className="new-badge">New</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closePropertyModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProperty || uploadingImages}
                >
                  {savingProperty || uploadingImages
                    ? "Saving..."
                    : editingProperty
                      ? "Save Changes"
                      : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {analysisOpen && (
        <div className="modal-overlay">
          <div className="property-modal">
            <div className="modal-header">
              <h3>
                {selectedAnalysisProperty
                  ? selectedAnalysisProperty.title
                  : "Inventory Analysis"}
              </h3>
              <button
                onClick={() => {
                  setAnalysisOpen(false);
                  setSelectedAnalysisProperty(null);
                }}
              >
                ×
              </button>
            </div>
            {weakProperties.length > 0 && (
              <div className="analysis-section">
                <h4>Listings to optimize</h4>

                {weakProperties.slice(0, 8).map((item) => (
                  <div className="analysis-row" key={item.id}>
                    <div>
                      <strong>{item.title || "Untitled property"}</strong>
                      <p>
                        {item.city || "No city"} • AI Score {item.aiScore || 0}
                        /100
                      </p>
                    </div>
                    <span>
                      {Number(item.aiScore || 0) < 50
                        ? "Needs content + media"
                        : "Can be improved"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selectedAnalysisProperty ? (
              <div className="analysis-grid">
                <div>
                  <span>AI Score</span>
                  <strong>{selectedAnalysisProperty.aiScore || 0}/100</strong>
                </div>
                <div>
                  <span>Revenue Potential</span>
                  <strong>
                    $
                    {Number(
                      selectedAnalysisProperty.revenuePotential || 0,
                    ).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span>Matched Leads</span>
                  <strong>{selectedAnalysisProperty.matchedLeads || 0}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{selectedAnalysisProperty.status}</strong>
                </div>
              </div>
            ) : (
              <div className="analysis-grid">
                <div>
                  <span>Total Properties</span>
                  <strong>{healthTotal}</strong>
                </div>
                <div>
                  <span>Active</span>
                  <strong>{healthActive}</strong>
                </div>
                <div>
                  <span>Under Review</span>
                  <strong>{healthUnderReview}</strong>
                </div>
                <div>
                  <span>Inventory Score</span>
                  <strong>{inventoryScore}/100</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {reportOpen && (
        <div className="property-print-report">
          <div className="report-header">
            <div>
              <h1>Cortex AI CRM</h1>
              <p>Property Inventory Report</p>
            </div>

            <div className="report-meta">
              <strong>{dashboard?.rangeLabel || "All time"}</strong>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="report-section">
            <h2>Summary Metrics</h2>

            <div className="report-metrics-grid">
              {reportMetrics.map((item) => (
                <div className="report-metric-card" key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                  <p>{item.trend}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h2>Inventory Health</h2>

            <div className="report-health-grid">
              <div>
                <span>Total</span>
                <strong>{healthTotal}</strong>
              </div>
              <div>
                <span>Active</span>
                <strong>{healthActive}</strong>
              </div>
              <div>
                <span>Under Review</span>
                <strong>{healthUnderReview}</strong>
              </div>
              <div>
                <span>Draft</span>
                <strong>{healthDraft}</strong>
              </div>
              <div>
                <span>Inactive</span>
                <strong>{healthInactive}</strong>
              </div>
              <div>
                <span>Inventory Score</span>
                <strong>{inventoryScore}/100</strong>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h2>Top Properties</h2>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>AI Score</th>
                  <th>Revenue Potential</th>
                  <th>Matched Leads</th>
                </tr>
              </thead>

              <tbody>
                {properties.slice(0, 20).map((property) => (
                  <tr key={property.id}>
                    <td>{property.title || "Untitled"}</td>
                    <td>{property.city || "—"}</td>
                    <td>{(property.status || "draft").replace("_", " ")}</td>
                    <td>
                      {property.price
                        ? `$${Number(property.price).toLocaleString()}`
                        : "$0"}
                    </td>
                    <td>{Number(property.aiScore || 0)}/100</td>
                    <td>
                      ${Number(property.revenuePotential || 0).toLocaleString()}
                    </td>
                    <td>{Number(property.matchedLeads || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-section">
            <h2>Matched Leads</h2>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Matched Properties</th>
                </tr>
              </thead>

              <tbody>
                {(dashboard?.matchedLeads || []).length === 0 ? (
                  <tr>
                    <td colSpan="4">No matched leads yet.</td>
                  </tr>
                ) : (
                  dashboard.matchedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.name}</td>
                      <td>{lead.location}</td>
                      <td>{lead.budget}</td>
                      <td>{lead.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="report-footer">
            Generated by Cortex AI CRM Property Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
