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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

    if (!window.confirm(t("properties.confirmDeleteImage"))) return;

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
      title: t("properties.totalProperties"),
      value: dashboard?.totalProperties?.value ?? 0,
      trend: dashboard?.totalProperties?.trend?.text || t("properties.trendAllTime"),
      trendType: dashboard?.totalProperties?.trend?.direction || "flat",
      icon: <Home size={20} />,
      className: "blue",
    },
    {
      title: t("properties.activeListings"),
      value: dashboard?.activeListings?.value ?? 0,
      trend: dashboard?.activeListings?.trend?.text || t("properties.trendAllTime"),
      trendType: dashboard?.activeListings?.trend?.direction || "flat",
      icon: <CheckCircle2 size={20} />,
      className: "green",
    },
    {
      title: t("properties.totalValue"),
      value: `$${Number(dashboard?.totalValue?.value || 0).toLocaleString()}`,
      trend: dashboard?.totalValue?.trend?.text || t("properties.trendAllTime"),
      trendType: dashboard?.totalValue?.trend?.direction || "flat",
      icon: <DollarSign size={20} />,
      className: "purple",
    },
    {
      title: t("properties.hotProperties"),
      value: dashboard?.hotProperties?.value ?? 0,
      trend: dashboard?.hotProperties?.trend?.text || t("properties.trendComingSoon"),
      trendType: dashboard?.hotProperties?.trend?.direction || "flat",
      icon: <Flame size={20} />,
      className: "orange",
    },
    {
      title: t("properties.aiOptimized"),
      value: dashboard?.aiOptimized?.value ?? 0,
      trend: dashboard?.aiOptimized?.trend?.text || t("properties.trendComingSoon"),
      trendType: dashboard?.aiOptimized?.trend?.direction || "flat",
      icon: <Bot size={20} />,
      className: "cyan",
    },
    {
      title: t("properties.conversionRate"),
      value: `${dashboard?.conversionRate?.value ?? 0}%`,
      trend: dashboard?.conversionRate?.trend?.text || t("properties.trendAllTime"),
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
    if (score >= 80) return t("properties.statusExcellent");
    if (score >= 60) return t("properties.statusGood");
    if (score >= 40) return t("properties.statusNeedsWork");
    return t("properties.statusPoor");
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
      title: t("properties.totalProperties"),
      value: dashboard?.totalProperties?.value ?? 0,
      trend: dashboard?.totalProperties?.trend?.text || t("properties.trendAllTime"),
    },
    {
      title: t("properties.activeListings"),
      value: dashboard?.activeListings?.value ?? 0,
      trend: dashboard?.activeListings?.trend?.text || t("properties.trendAllTime"),
    },
    {
      title: t("properties.totalValue"),
      value: `$${Number(dashboard?.totalValue?.value || 0).toLocaleString()}`,
      trend: dashboard?.totalValue?.trend?.text || t("properties.trendAllTime"),
    },
    {
      title: t("properties.hotProperties"),
      value: dashboard?.hotProperties?.value ?? 0,
      trend: dashboard?.hotProperties?.trend?.text || t("properties.trendComingSoon"),
    },
    {
      title: t("properties.aiOptimized"),
      value: dashboard?.aiOptimized?.value ?? 0,
      trend: dashboard?.aiOptimized?.trend?.text || t("properties.trendComingSoon"),
    },
    {
      title: t("properties.conversionRate"),
      value: `${dashboard?.conversionRate?.value ?? 0}%`,
      trend: dashboard?.conversionRate?.trend?.text || t("properties.trendAllTime"),
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
          return t("properties.recUploadImages");

        case "Description is too short":
          return t("properties.recGenerateDescription");

        case "Address incomplete":
          return t("properties.recCompleteAddress");

        case "Price missing":
          return t("properties.recSetPrice");

        case "Missing property specifications":
          return t("properties.recAddSpecs");

        case "Property not published":
          return t("properties.recPublishListing");

        default:
          return issue;
      }
    });
  };

  const getPropertyTimeline = (property) => {
    if (!property) return [];

    return [
      {
        title: t("properties.timelinePropertyCreated"),
        time: property.createdAt,
        description: t("properties.timelineListingCreated"),
      },

      property.updatedAt && {
        title: t("properties.timelineLastUpdated"),
        time: property.updatedAt,
        description: t("properties.timelineListingUpdated"),
      },

      property.publishedAt && {
        title: t("properties.published"),
        time: property.publishedAt,
        description: t("properties.timelinePublishedSuccessfully"),
      },

      {
        title: t("properties.timelineAiAnalysis"),
        time: new Date().toISOString(),
        description: t("properties.aiScoreValue", { score: property.aiScore || 0 }),
      },

      {
        title: t("properties.timelineLeadMatching"),
        time: new Date().toISOString(),
        description: t("properties.matchedLeadsCount", {
          count: property.matchedLeads || 0,
        }),
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
        <h1>{t("properties.pageTitle")}</h1>
        <p className="next_head">{t("properties.commandCenter")}</p>
        <Sparkles size={16} color="#2563eb" />
      </div>
      <p className="sub_head">{t("properties.subheading")}</p>
      <div className="page-header">
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setAnalysisOpen(true)}
          >
            <Sparkles size={16} color="#2563eb" /> {t("properties.analyzeProperties")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedAnalysisProperty(null);
              setAnalysisOpen(true);
            }}
          >
            <Pipette size={16} />
            {t("properties.autoOptimizeListings")}
          </button>
          <button className="btn btn-secondary" onClick={printPropertyReport}>
            <Download size={16} className="blue" /> {t("properties.exportPropertyReport")}
          </button>
          <button className="btn btn-primary" onClick={openAddPropertyModal}>
            <Plus size={16} />
            {t("properties.addProperty")}
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
            placeholder={t("properties.searchPlaceholder")}
          />
        </div>

        <div className="filter-select-wrapper search-date">
          <select
            className="filter-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">{t("properties.dateAll")}</option>
            <option value="today">{t("properties.dateToday")}</option>
            <option value="last_7_days">{t("properties.dateLast7Days")}</option>
            <option value="last_30_days">{t("properties.dateLast30Days")}</option>
            <option value="this_month">{t("properties.dateThisMonth")}</option>
          </select>
          <Calendar size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">{t("properties.allCities")}</option>
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
            <option value="">{t("properties.allListingTypes")}</option>
            <option value="sale">{t("properties.forSale")}</option>
            <option value="rent">{t("properties.forRent")}</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="">{t("properties.allPropertyTypes")}</option>
            <option value="house">{t("properties.propertyType_house")}</option>
            <option value="apartment">{t("properties.propertyType_apartment")}</option>
            <option value="land">{t("properties.propertyType_land")}</option>
            <option value="commercial">{t("properties.propertyType_commercial")}</option>
            <option value="villa">{t("properties.propertyType_villa")}</option>
            <option value="office">{t("properties.propertyType_office")}</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("properties.allStatus")}</option>
            <option value="draft">{t("properties.draft")}</option>
            <option value="pending_review">{t("properties.pendingReview")}</option>
            <option value="approved">{t("properties.approved")}</option>
            <option value="rejected">{t("properties.rejected")}</option>
            <option value="published">{t("properties.published")}</option>
            <option value="reserved">{t("properties.reserved")}</option>
            <option value="sold">{t("properties.sold")}</option>
            <option value="rented">{t("properties.rented")}</option>
            <option value="archived">{t("properties.archived")}</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input
            type="number"
            placeholder={t("properties.minPrice")}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>

        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input
            type="number"
            placeholder={t("properties.maxPrice")}
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
            <option value="">{t("properties.allAiScores")}</option>
            <option value="high">{t("properties.aiScoreHigh")}</option>
            <option value="medium">{t("properties.aiScoreMedium")}</option>
            <option value="low">{t("properties.aiScoreLow")}</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            <option value="">{t("properties.allAgents")}</option>
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
            <option value="">{t("properties.allTeams")}</option>
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
          {t("properties.clearFilters")}
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
          {t("common.search")}
        </button>
        <button
          className="btn btn-secondary export"
          style={{ height: "38px" }}
          onClick={exportPropertiesCsv}
        >
          <Download size={15} className="blue" /> {t("properties.export")}
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
              <div className="card-body">{t("properties.loadingProperties")}</div>
            </div>
          ) : properties.length === 0 ? (
            <div className="property-card">
              <div className="card-body">{t("properties.noPropertiesFound")}</div>
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
                      {t("properties.propertyImagePlaceholder")}
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
                          {t("properties.viewAnalysis")}
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
                          {t("properties.publish")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditPropertyModal(property);
                            setOpenActionId(null);
                          }}
                        >
                          {t("properties.edit")}
                        </button>
                        <button
                          className="danger"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm(t("properties.confirmDeleteProperty")))
                              return;
                            await deleteProperty(property.id);
                            setOpenActionId(null);
                            await loadProperties();
                            await loadDashboard();
                          }}
                        >
                          {t("common.delete")}
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
                        : t("properties.noPrice")}
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
                      <span>{t("properties.aiScore")}</span>
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
                      .join(", ") || t("properties.noAddress")}
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
                        ? t("properties.sqftValue", { value: property.squareFeet })
                        : "—"}
                    </div>
                  </div>

                  <div className="financials-row">
                    <div className="financial-item">
                      <span>{t("properties.revenuePotential")}</span>
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
                      <span>{t("properties.matchedLeads")}</span>
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
                            t("properties.unassigned")}
                        </h5>
                        <p>{property.teamName || t("properties.noTeam")}</p>
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
            {t("properties.showingCount", {
              shown: properties.length,
              total: total,
            })}
          </div>

          <div className="pagination-controls">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={8}>{t("properties.perPageOption", { count: 8 })}</option>
              <option value={12}>{t("properties.perPageOption", { count: 12 })}</option>
              <option value={24}>{t("properties.perPageOption", { count: 24 })}</option>
            </select>

            <button
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              {t("common.previous")}
            </button>

            <span>
              {t("properties.pageOf", { page: page, total: totalPages })}
            </span>

            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              {t("common.next")}
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
                {t("properties.inventoryHealth")}
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
                    <span>{t("properties.total")}</span>
                  </div>
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-label">
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span>{t("common.active")}</span>
                    </div>
                    <span className="legend-value">
                      {healthActive} ({getPercent(healthActive, healthTotal)}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <Clock3 size={14} color="#ea580c" />
                      <span>{t("properties.underReview")}</span>
                    </div>
                    {healthUnderReview} (
                    {getPercent(healthUnderReview, healthTotal)}%)
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <FileText size={14} color="#64748b" />
                      <span>{t("properties.draft")}</span>
                    </div>
                    {healthDraft} ({getPercent(healthDraft, healthTotal)}%)
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <AlertCircle size={14} color="#dc2626" />
                      <span>{t("common.inactive")}</span>
                    </div>
                    {healthInactive} ({getPercent(healthInactive, healthTotal)}
                    %)
                  </div>
                </div>
              </div>
              <div className="inventory-score-box">
                <div className="score-info">
                  <h5>{t("properties.inventoryScore")}</h5>
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
                {t("properties.viewFullAnalysis")} <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* SECTION 2: MATCHED LEADS */}
          <div className="sidebar-section">
            <div className="section-header">
              <h3>
                <Users size={18} className="blue" />
                {t("properties.matchedLeads")}
              </h3>
              <a
                href="#view-all-leads"
                className="section-link"
                onClick={() => navigate("/dashboard/leads")}
              >
                {t("properties.viewAllLeads")}
                <ArrowRight size={13} />
              </a>
            </div>

            <div className="matched-leads-list">
              {matchedLeads.length === 0 ? (
                <div className="matched-lead-item">
                  <div className="lead-details">
                    <h4>{t("properties.noMatchedLeads")}</h4>
                    <p>{t("properties.matchingHint")}</p>
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
                      <span className="budget">
                        {t("properties.budgetLabel", { budget: lead.budget })}
                      </span>
                      <span className="matches-count">
                        {t("properties.matchedPropertiesLabel")}{" "}
                        <strong>{lead.count}</strong>
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
                <div className="drawer-label">{t("properties.propertyDetail")}</div>

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
              <div className="drawer-loading">{t("common.loading")}</div>
            ) : (
              <>
                <div className="drawer-image">
                  {selectedProperty?.thumbnailUrl ? (
                    <img src={selectedProperty.thumbnailUrl} alt="" />
                  ) : (
                    <div className="drawer-placeholder">{t("properties.noImage")}</div>
                  )}
                </div>

                <div className="drawer-kpis">
                  <div>
                    <span>{t("properties.price")}</span>

                    <strong>
                      ${Number(selectedProperty?.price || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>{t("properties.aiScore")}</span>

                    <strong>{selectedProperty?.aiScore || 0}/100</strong>
                  </div>

                  <div>
                    <span>{t("properties.revenuePotential")}</span>

                    <strong>
                      $
                      {Number(
                        selectedProperty?.revenuePotential || 0,
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <span>{t("properties.matchedLeads")}</span>

                    <strong>{selectedProperty?.matchedLeads || 0}</strong>
                  </div>
                </div>

                <div className="drawer-section">
                  <h3>{t("properties.aiSuggestions")}</h3>

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
                  <h3>{t("properties.timeline")}</h3>

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
              <h3>{editingProperty ? t("properties.editProperty") : t("properties.addProperty")}</h3>
              <button onClick={closePropertyModal}>×</button>
            </div>

            <form onSubmit={handleSubmitProperty} className="property-form">
              <input
                required
                placeholder={t("properties.propertyTitlePlaceholder")}
                value={propertyForm.title}
                onChange={(e) =>
                  setPropertyForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />

              <input
                placeholder={t("properties.address")}
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
                  placeholder={t("properties.city")}
                  value={propertyForm.city}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />

                <input
                  placeholder={t("properties.state")}
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
                  placeholder={t("properties.price")}
                  value={propertyForm.price}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />

                <input
                  placeholder={t("properties.zipCodePlaceholder")}
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
                  <option value="sale">{t("properties.forSale")}</option>
                  <option value="rent">{t("properties.forRent")}</option>
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
                  <option value="house">{t("properties.propertyType_house")}</option>
                  <option value="apartment">{t("properties.propertyType_apartment")}</option>
                  <option value="land">{t("properties.propertyType_land")}</option>
                  <option value="commercial">{t("properties.propertyType_commercial")}</option>
                  <option value="villa">{t("properties.propertyType_villa")}</option>
                  <option value="office">{t("properties.propertyType_office")}</option>
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
                  <option value="draft">{t("properties.draft")}</option>
                  <option value="pending_review">{t("properties.pendingReview")}</option>
                  <option value="approved">{t("properties.approved")}</option>
                  <option value="published">{t("properties.published")}</option>
                  <option value="reserved">{t("properties.reserved")}</option>
                  <option value="sold">{t("properties.sold")}</option>
                  <option value="rented">{t("properties.rented")}</option>
                  <option value="archived">{t("properties.archived")}</option>
                </select>

                <input
                  type="number"
                  placeholder={t("properties.sqft")}
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
                  placeholder={t("properties.beds")}
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
                  placeholder={t("properties.baths")}
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
                placeholder={t("properties.description")}
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
                    <h4>{t("properties.propertyImages")}</h4>
                    <p>{t("properties.uploadImagesHint")}</p>
                  </div>

                  <label className="btn btn-secondary image-upload-btn">
                    <Plus size={14} />
                    {t("properties.addImages")}
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
                        <img src={media.url} alt={t("properties.propertyMediaAlt")} />

                        <div className="image-preview-actions">
                          <button
                            type="button"
                            onClick={() => handleSetThumbnail(media)}
                          >
                            {t("properties.setCover")}
                          </button>

                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteExistingMedia(media)}
                          >
                            {t("common.delete")}
                          </button>
                        </div>

                        {editingProperty?.thumbnailUrl === media.url && (
                          <span className="cover-badge">{t("properties.cover")}</span>
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
                            {t("properties.remove")}
                          </button>
                        </div>

                        <span className="new-badge">{t("properties.newBadge")}</span>
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
                  {t("common.cancel")}
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProperty || uploadingImages}
                >
                  {savingProperty || uploadingImages
                    ? t("properties.saving")
                    : editingProperty
                      ? t("properties.saveChanges")
                      : t("properties.createProperty")}
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
                  : t("properties.inventoryAnalysis")}
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
                <h4>{t("properties.listingsToOptimize")}</h4>

                {weakProperties.slice(0, 8).map((item) => (
                  <div className="analysis-row" key={item.id}>
                    <div>
                      <strong>{item.title || t("properties.untitledProperty")}</strong>
                      <p>
                        {item.city || t("properties.noCity")} •{" "}
                        {t("properties.aiScoreValue", { score: item.aiScore || 0 })}
                      </p>
                    </div>
                    <span>
                      {Number(item.aiScore || 0) < 50
                        ? t("properties.needsContentMedia")
                        : t("properties.canBeImproved")}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selectedAnalysisProperty ? (
              <div className="analysis-grid">
                <div>
                  <span>{t("properties.aiScore")}</span>
                  <strong>{selectedAnalysisProperty.aiScore || 0}/100</strong>
                </div>
                <div>
                  <span>{t("properties.revenuePotential")}</span>
                  <strong>
                    $
                    {Number(
                      selectedAnalysisProperty.revenuePotential || 0,
                    ).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span>{t("properties.matchedLeads")}</span>
                  <strong>{selectedAnalysisProperty.matchedLeads || 0}</strong>
                </div>
                <div>
                  <span>{t("properties.status")}</span>
                  <strong>{selectedAnalysisProperty.status}</strong>
                </div>
              </div>
            ) : (
              <div className="analysis-grid">
                <div>
                  <span>{t("properties.totalProperties")}</span>
                  <strong>{healthTotal}</strong>
                </div>
                <div>
                  <span>{t("common.active")}</span>
                  <strong>{healthActive}</strong>
                </div>
                <div>
                  <span>{t("properties.underReview")}</span>
                  <strong>{healthUnderReview}</strong>
                </div>
                <div>
                  <span>{t("properties.inventoryScore")}</span>
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
              <p>{t("properties.propertyInventoryReport")}</p>
            </div>

            <div className="report-meta">
              <strong>{dashboard?.rangeLabel || t("properties.dateAll")}</strong>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="report-section">
            <h2>{t("properties.summaryMetrics")}</h2>

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
            <h2>{t("properties.inventoryHealth")}</h2>

            <div className="report-health-grid">
              <div>
                <span>{t("properties.total")}</span>
                <strong>{healthTotal}</strong>
              </div>
              <div>
                <span>{t("common.active")}</span>
                <strong>{healthActive}</strong>
              </div>
              <div>
                <span>{t("properties.underReview")}</span>
                <strong>{healthUnderReview}</strong>
              </div>
              <div>
                <span>{t("properties.draft")}</span>
                <strong>{healthDraft}</strong>
              </div>
              <div>
                <span>{t("common.inactive")}</span>
                <strong>{healthInactive}</strong>
              </div>
              <div>
                <span>{t("properties.inventoryScore")}</span>
                <strong>{inventoryScore}/100</strong>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h2>{t("properties.topProperties")}</h2>

            <table className="report-table">
              <thead>
                <tr>
                  <th>{t("properties.propertyColumn")}</th>
                  <th>{t("properties.city")}</th>
                  <th>{t("properties.status")}</th>
                  <th>{t("properties.price")}</th>
                  <th>{t("properties.aiScore")}</th>
                  <th>{t("properties.revenuePotential")}</th>
                  <th>{t("properties.matchedLeads")}</th>
                </tr>
              </thead>

              <tbody>
                {properties.slice(0, 20).map((property) => (
                  <tr key={property.id}>
                    <td>{property.title || t("properties.untitled")}</td>
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
            <h2>{t("properties.matchedLeads")}</h2>

            <table className="report-table">
              <thead>
                <tr>
                  <th>{t("properties.leadColumn")}</th>
                  <th>{t("properties.location")}</th>
                  <th>{t("properties.budget")}</th>
                  <th>{t("properties.matchedProperties")}</th>
                </tr>
              </thead>

              <tbody>
                {(dashboard?.matchedLeads || []).length === 0 ? (
                  <tr>
                    <td colSpan="4">{t("properties.noMatchedLeadsTable")}</td>
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
            {t("properties.reportFooter")}
          </div>
        </div>
      )}
    </div>
  );
}
