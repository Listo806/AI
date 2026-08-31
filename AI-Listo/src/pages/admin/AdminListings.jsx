import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  EyeOff,
  Filter,
  Grid2X2,
  Home,
  List,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import {
  getAdminListings,
  getAdminListingById,
  updateAdminListingStatus,
  updateAdminListing,
  getAdminTeams,
} from '../../api/platformApi';
import { getPropertyMedia } from '../../api/propertiesApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import '../platform/platform.css';
import './admin.css';
import './AdminListings.css';

const API_STATUS_VALUES = new Set(['pending_review', 'approved', 'rejected', 'published']);

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'unpublished', label: 'Unpublished' },
  { value: 'sold_rented', label: 'Sold / Rented' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const ORIGIN_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'platform', label: 'Platform' },
  { value: 'va', label: 'VA' },
  { value: 'crm', label: 'CRM' },
];

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function initials(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function listingType(item) {
  const raw = item?.listingType ?? item?.listing_type ?? item?.transactionType ?? item?.transaction_type ?? item?.purpose;
  if (raw) return String(raw).replaceAll('_', ' ');
  if (item?.forRent === true || item?.for_rent === true) return 'For Rent';
  if (item?.forSale === true || item?.for_sale === true) return 'For Sale';
  return 'For Sale';
}

function propertyType(item) {
  return item?.propertyType ?? item?.property_type ?? item?.type ?? item?.category ?? 'Property';
}

function locationText(item) {
  return [item?.address, item?.city, item?.state].filter(Boolean).join(', ') || '—';
}

function shortLocation(item) {
  return [item?.city, item?.state].filter(Boolean).join(', ') || item?.address || '—';
}

function agentOwnerName(item) {
  return item?.agentName ?? item?.agent_name ?? item?.ownerName ?? item?.owner_name ?? item?.uploaderName ?? item?.uploader_name ?? item?.uploaderEmail ?? '—';
}

function sourceLabel(item) {
  const value = normalize(item?.origin);
  if (value === 'va') return 'Agency';
  if (value === 'crm') return 'Owner';
  if (value === 'platform') return 'Agent';
  return item?.origin ? String(item.origin) : 'AI / Seed';
}

function displayStatus(item) {
  const status = normalize(item?.status || 'pending_review');
  if (status === 'sold' || status === 'rented') return status === 'sold' ? 'Sold' : 'Rented';
  if (status === 'published') return 'Published';
  if (status === 'pending_review') return 'Pending Review';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'unpublished' || status === 'draft') return 'Unpublished';
  return String(item?.status || 'Pending Review').replaceAll('_', ' ');
}

function statusTone(item) {
  const status = normalize(item?.status || 'pending_review');
  if (status === 'published') return 'published';
  if (status === 'pending_review') return 'pending';
  if (status === 'sold' || status === 'rented') return 'sold';
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'unpublished';
}

function matchesSpecialStatus(item, filterStatus) {
  if (!filterStatus) return true;
  const status = normalize(item?.status);
  if (filterStatus === 'sold_rented') return status === 'sold' || status === 'rented';
  if (filterStatus === 'unpublished') {
    return !['published', 'pending_review', 'sold', 'rented'].includes(status);
  }
  return status === filterStatus;
}

export default function AdminListings() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [detail, setDetail] = useState(null);
  const [media, setMedia] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [updatingTeam, setUpdatingTeam] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalId, setRejectModalId] = useState(null);

  const [viewMode, setViewMode] = useState('grid');
  const [showMoreFilters, setShowMoreFilters] = useState(true);
  const [openActionId, setOpenActionId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [filters, setFilters] = useState({
    status: '',
    origin: '',
    createdBy: '',
    title: '',
    uploaderEmail: '',
    propertyType: '',
    listingType: '',
    location: '',
    agentOwner: '',
  });

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const opts = {};
      if (filters.status && API_STATUS_VALUES.has(filters.status)) opts.status = filters.status;
      if (filters.origin) opts.origin = filters.origin;
      if (filters.createdBy) opts.createdBy = filters.createdBy;
      if (filters.title) opts.title = filters.title;
      if (filters.uploaderEmail) opts.uploaderEmail = filters.uploaderEmail;
      const data = await getAdminListings(opts);
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t('admin.loadListingsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && user) loadListings();
  }, [
    isAuthenticated,
    user,
    filters.status,
    filters.origin,
    filters.createdBy,
    filters.title,
    filters.uploaderEmail,
  ]);

  useEffect(() => {
    if (isAuthenticated() && user) {
      getAdminTeams().then((list) => setTeams(Array.isArray(list) ? list : []));
    }
  }, [isAuthenticated, user]);

  const filteredListings = useMemo(() => {
    const typeNeedle = normalize(filters.propertyType);
    const listingNeedle = normalize(filters.listingType);
    const locationNeedle = normalize(filters.location);
    const agentNeedle = normalize(filters.agentOwner);

    return listings.filter((item) => {
      if (!matchesSpecialStatus(item, filters.status)) return false;
      if (typeNeedle && normalize(propertyType(item)) !== typeNeedle) return false;
      if (listingNeedle && normalize(listingType(item)) !== listingNeedle) return false;
      if (locationNeedle && !normalize(locationText(item)).includes(locationNeedle)) return false;
      if (agentNeedle && !normalize(agentOwnerName(item)).includes(agentNeedle)) return false;
      return true;
    });
  }, [listings, filters.status, filters.propertyType, filters.listingType, filters.location, filters.agentOwner]);

  const stats = useMemo(() => {
    const total = listings.length;
    const published = listings.filter((x) => normalize(x.status) === 'published').length;
    const pending = listings.filter((x) => normalize(x.status) === 'pending_review').length;
    const soldRented = listings.filter((x) => ['sold', 'rented'].includes(normalize(x.status))).length;
    const unpublished = listings.filter((x) => !['published', 'pending_review', 'sold', 'rented'].includes(normalize(x.status))).length;
    return { total, published, pending, soldRented, unpublished };
  }, [listings]);

  const propertyTypes = useMemo(() => [...new Set(listings.map(propertyType).filter(Boolean))].sort(), [listings]);
  const locations = useMemo(() => [...new Set(listings.map(shortLocation).filter((x) => x && x !== '—'))].sort(), [listings]);
  const agents = useMemo(() => [...new Set(listings.map(agentOwnerName).filter((x) => x && x !== '—'))].sort(), [listings]);

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedListings = filteredListings.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetPage = () => setPage(1);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    resetPage();
  };

  const clearFilters = () => {
    setFilters({
      status: '', origin: '', createdBy: '', title: '', uploaderEmail: '',
      propertyType: '', listingType: '', location: '', agentOwner: '',
    });
    setPage(1);
  };

  const loadDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setMedia([]);
    setRejectionReason('');
    setOpenActionId(null);
    try {
      const [data, mediaList] = await Promise.all([
        getAdminListingById(id),
        getPropertyMedia(id),
      ]);
      setDetail(data);
      setMedia(Array.isArray(mediaList) ? mediaList.filter((m) => m.type === 'image') : []);
    } catch (err) {
      showError(err.message || t('admin.loadListingError'));
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setSelectedId(null);
    setMedia([]);
  };

  const handleTeamChange = async (id, teamId) => {
    setUpdatingTeam(true);
    try {
      await updateAdminListing(id, { teamId: teamId || null });
      showSuccess(t('admin.teamAssigned'));
      if (detail?.id === id) setDetail((d) => (d ? { ...d, teamId: teamId || null } : d));
      loadListings();
    } catch (err) {
      showError(err.message || t('admin.assignTeamError'));
    } finally {
      setUpdatingTeam(false);
    }
  };

  const handleStatusChange = async (id, status, reason = null) => {
    setUpdating(id);
    try {
      await updateAdminListingStatus(
        id,
        status,
        status === 'rejected' ? (reason ?? rejectionReason) : null,
      );
      showSuccess(t('admin.listingUpdated'));
      setRejectionReason('');
      setRejectModalId(null);
      if (detail?.id === id) {
        const refreshed = await getAdminListingById(id).catch(() => null);
        if (refreshed) setDetail(refreshed);
      }
      await loadListings();
    } catch (err) {
      showError(err.message || t('admin.updateStatusError'));
    } finally {
      setUpdating(null);
    }
  };

  const openRejectModal = (id) => {
    setRejectModalId(id);
    setRejectionReason('');
    setOpenActionId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatPrice = (price) => {
    if (price == null || price === '') return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const allPageSelected = paginatedListings.length > 0 && paginatedListings.every((x) => selectedIds.includes(x.id));
  const toggleSelectPage = () => {
    const pageIds = paginatedListings.map((x) => x.id);
    setSelectedIds((prev) => allPageSelected
      ? prev.filter((id) => !pageIds.includes(id))
      : [...new Set([...prev, ...pageIds])]);
  };

  const exportCsv = () => {
    const rows = filteredListings.map((item) => ({
      Property: item.title || 'Untitled',
      Source: sourceLabel(item),
      Status: displayStatus(item),
      Price: item.price ?? '',
      Location: locationText(item),
      AgentOwner: agentOwnerName(item),
      Created: item.createdAt ?? '',
    }));
    const headers = Object.keys(rows[0] || { Property: '', Source: '', Status: '', Price: '', Location: '', AgentOwner: '', Created: '' });
    const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => esc(row[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin-listings.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return <div className="alx-loading">{t('admin.loading')}</div>;
  }
  if (!isAuthenticated() || !user) return null;

  const metricCards = [
    { key: 'total', label: 'Total Listings', value: stats.total, note: 'All marketplace listings', Icon: Home, tone: 'blue' },
    { key: 'published', label: 'Published', value: stats.published, note: `${stats.total ? ((stats.published / stats.total) * 100).toFixed(1) : '0.0'}% of total`, Icon: Check, tone: 'green' },
    { key: 'pending', label: 'Pending Review', value: stats.pending, note: `${stats.total ? ((stats.pending / stats.total) * 100).toFixed(1) : '0.0'}% of total`, Icon: Clock3, tone: 'amber' },
    { key: 'sold', label: 'Sold / Rented', value: stats.soldRented, note: `${stats.total ? ((stats.soldRented / stats.total) * 100).toFixed(1) : '0.0'}% of total`, Icon: Users, tone: 'purple' },
    { key: 'unpublished', label: 'Unpublished', value: stats.unpublished, note: `${stats.total ? ((stats.unpublished / stats.total) * 100).toFixed(1) : '0.0'}% of total`, Icon: EyeOff, tone: 'slate' },
  ];

  return (
    <div className="platform-page alx-page">
      <header className="alx-header">
        <div className="alx-header-main">
          <div className="alx-header-icon"><Home size={25} /></div>
          <div>
            <h1>Listings</h1>
            <p>Manage every property across the Cortexa marketplace.</p>
          </div>
        </div>
        <Link to="/dashboard/properties" className="alx-add-btn">
          <Plus size={18} /> Add Listing
        </Link>
      </header>

      <section className="alx-metrics" aria-label="Listing statistics">
        {metricCards.map(({ key, label, value, note, Icon, tone }) => (
          <article className={`alx-metric-card is-${tone}`} key={key}>
            <div className="alx-metric-icon"><Icon size={21} /></div>
            <div className="alx-metric-copy">
              <span>{label}</span>
              <strong>{value.toLocaleString()}</strong>
              <small>{note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="alx-controls-card">
        <div className="alx-controls-top">
          <div className="alx-view-toggle" role="group" aria-label="View mode">
            <button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              <Grid2X2 size={16} /> Grid View
            </button>
            <button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
              <List size={17} /> List View
            </button>
          </div>

          <label className="alx-search">
            <Search size={17} />
            <input
              value={filters.title}
              onChange={(e) => setFilter('title', e.target.value)}
              placeholder="Search by title, location, agent, or ID..."
            />
          </label>

          <button type="button" className={`alx-outline-btn ${showMoreFilters ? 'active' : ''}`} onClick={() => setShowMoreFilters((v) => !v)}>
            <Filter size={17} /> More Filters
          </button>
          <button type="button" className="alx-outline-btn" onClick={exportCsv}>
            <Download size={17} /> Export CSV
          </button>
        </div>

        {showMoreFilters && (
          <div className="alx-filter-grid">
            <label>
              <span>Status</span>
              <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>
              <span>Property Type</span>
              <select value={filters.propertyType} onChange={(e) => setFilter('propertyType', e.target.value)}>
                <option value="">All</option>
                {propertyTypes.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label>
              <span>For Sale / Rent</span>
              <select value={filters.listingType} onChange={(e) => setFilter('listingType', e.target.value)}>
                <option value="">All</option>
                <option value="For Sale">For Sale</option>
                <option value="For Rent">For Rent</option>
              </select>
            </label>
            <label>
              <span>Source / Origin</span>
              <select value={filters.origin} onChange={(e) => setFilter('origin', e.target.value)}>
                {ORIGIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>
              <span>Location</span>
              <select value={filters.location} onChange={(e) => setFilter('location', e.target.value)}>
                <option value="">All</option>
                {locations.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label>
              <span>Agent / Owner</span>
              <select value={filters.agentOwner} onChange={(e) => setFilter('agentOwner', e.target.value)}>
                <option value="">All</option>
                {agents.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <button type="button" className="alx-clear-btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        )}
      </section>

      <section className="alx-bulk-row">
        <label className="alx-select-all">
          <input type="checkbox" checked={allPageSelected} onChange={toggleSelectPage} />
          <span>Select All ({paginatedListings.length})</span>
        </label>
        <button type="button" className="alx-bulk-btn" disabled={!selectedIds.length}>
          Bulk Actions <ChevronDown size={15} />
        </button>
        <div className="alx-page-size-top">
          <span>Show</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {[6, 12, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>per page</span>
        </div>
      </section>

      {error && <div className="crm-error alx-error">{error}</div>}

      <section className={`alx-table-card mode-${viewMode}`}>
        {loading ? (
          <div className="alx-state">Loading listings...</div>
        ) : filteredListings.length === 0 ? (
          <div className="alx-state">{t('admin.noListingsMatch')}</div>
        ) : (
          <div className="alx-table-scroll">
            <table className="alx-table">
              <thead>
                <tr>
                  <th className="alx-check-col"><input type="checkbox" checked={allPageSelected} onChange={toggleSelectPage} /></th>
                  <th>Property</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Agent / Owner</th>
                  <th>Views / Leads</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedListings.map((item) => {
                  const date = formatDate(item.createdAt);
                  const source = sourceLabel(item);
                  const owner = agentOwnerName(item);
                  const views = item.viewsCount ?? item.views_count ?? item.views ?? 0;
                  const leads = item.leadsCount ?? item.leads_count ?? item.matchedLeads ?? item.matched_leads ?? 0;
                  return (
                    <tr key={item.id} className={selectedId === item.id ? 'selected' : ''}>
                      <td className="alx-check-col">
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                      </td>
                      <td>
                        <div className="alx-property-cell">
                          <button type="button" className="alx-thumb-btn" onClick={() => loadDetail(item.id)}>
                            {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : <Building2 size={22} />}
                          </button>
                          <div>
                            <strong>{item.title || t('admin.untitled')}</strong>
                            <small>{formatPrice(item.price)} <i /> {listingType(item)}</small>
                            <small className="alx-specs">{item.bedrooms ?? item.beds ?? 0} bed <i /> {item.bathrooms ?? item.baths ?? 0} bath <i /> {item.area ?? item.squareFeet ?? item.sqft ?? '—'} {item.area ? 'm²' : ''}</small>
                            <small><MapPin size={12} /> {shortLocation(item)}</small>
                          </div>
                        </div>
                      </td>
                      <td><span className={`alx-source-badge source-${normalize(source).replace(/[^a-z0-9]+/g, '-')}`}>{source}</span></td>
                      <td><span className={`alx-status-badge is-${statusTone(item)}`}>{displayStatus(item)}</span></td>
                      <td className="alx-price">{formatPrice(item.price)}</td>
                      <td className="alx-muted">{shortLocation(item)}</td>
                      <td>
                        <div className="alx-owner-cell">
                          <span className="alx-avatar">{initials(owner)}</span>
                          <div><strong>{owner}</strong><small>{source === 'Owner' ? 'Owner' : teams.find((x) => x.id === item.teamId)?.name || item.uploaderEmail || source}</small></div>
                        </div>
                      </td>
                      <td>
                        <div className="alx-activity-cell"><span><Eye size={13} /> {Number(views).toLocaleString()}</span><span><Users size={13} /> {Number(leads).toLocaleString()}</span></div>
                      </td>
                      <td className="alx-date-cell"><span>{date.date}</span><small>{date.time}</small></td>
                      <td>
                        <div className="alx-actions">
                          <button type="button" className="alx-view-btn" onClick={() => loadDetail(item.id)}>View</button>
                          <button type="button" className="alx-edit-btn" onClick={() => loadDetail(item.id)}>Edit</button>
                          <div className="alx-action-menu-wrap">
                            <button type="button" className="alx-more-btn" onClick={() => setOpenActionId((id) => id === item.id ? null : item.id)}><MoreVertical size={17} /></button>
                            {openActionId === item.id && (
                              <div className="alx-action-menu">
                                {(normalize(item.status) === 'pending_review' || !item.status) && <button onClick={() => handleStatusChange(item.id, 'approved')}>Approve</button>}
                                {normalize(item.status) !== 'published' && <button onClick={() => handleStatusChange(item.id, 'published')}>Publish</button>}
                                <button onClick={() => openRejectModal(item.id)}>Reject / Unpublish</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredListings.length > 0 && (
          <footer className="alx-table-footer">
            <span>Showing {pageStart + 1}–{Math.min(pageStart + pageSize, filteredListings.length)} of {filteredListings.length.toLocaleString()} listings</span>
            <div className="alx-pagination">
              <button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let number = i + 1;
                if (totalPages > 5 && safePage > 3) number = Math.min(totalPages - 4 + i, safePage - 2 + i);
                return <button key={number} className={safePage === number ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>;
              })}
              <button disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={16} /></button>
            </div>
            <label className="alx-footer-size">Rows per page:
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                {[6, 12, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </footer>
        )}
      </section>

      {detail && (
        <div className="alx-detail-overlay" onClick={closeDetail}>
          <aside className="alx-detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="alx-detail-head">
              <div><small>Listing Details</small><h2>{detail.title || t('admin.untitled')}</h2></div>
              <button onClick={closeDetail}><X size={20} /></button>
            </div>

            <div className="alx-detail-body">
              {(detail.thumbnailUrl || media.length > 0) && (
                <div className="alx-detail-hero"><img src={detail.thumbnailUrl || media[0]?.url} alt="" /></div>
              )}
              <div className="alx-detail-meta-row">
                <span className={`alx-status-badge is-${statusTone(detail)}`}>{displayStatus(detail)}</span>
                <span className="alx-source-badge">{sourceLabel(detail)}</span>
                <strong>{formatPrice(detail.price)}</strong>
              </div>
              <div className="alx-detail-location"><MapPin size={15} /> {locationText(detail)}</div>
              {detail.description && <p className="alx-detail-description">{detail.description}</p>}

              <label className="alx-detail-field">
                <span>Assign to Team</span>
                <select value={detail.teamId || ''} onChange={(e) => handleTeamChange(detail.id, e.target.value || null)} disabled={updatingTeam}>
                  <option value="">{t('admin.noTeamOption')}</option>
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </label>

              {media.length > 0 && (
                <div className="alx-gallery">
                  {media.map((m) => <a key={m.id} href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt="" /></a>)}
                </div>
              )}

              <div className="alx-detail-actions">
                {(normalize(detail.status) === 'pending_review' || !detail.status) && (
                  <button className="primary" disabled={updating !== null} onClick={() => handleStatusChange(detail.id, 'approved')}><CheckCircle2 size={16} /> Approve</button>
                )}
                {normalize(detail.status) !== 'published' && (
                  <button className="primary" disabled={updating !== null} onClick={() => handleStatusChange(detail.id, 'published')}>Publish</button>
                )}
                <button className="danger" disabled={updating !== null} onClick={() => openRejectModal(detail.id)}>Reject / Unpublish</button>
                <Link to={`/listings/${detail.id}`} className="secondary">View on Marketplace</Link>
              </div>
            </div>
          </aside>
        </div>
      )}

      {rejectModalId && (
        <div className="admin-reject-modal-overlay" onClick={() => setRejectModalId(null)}>
          <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.rejectListingTitle')}</h3>
            <p className="admin-table-muted">{t('admin.rejectReasonPrompt')}</p>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder={t('admin.rejectReasonPlaceholder')} rows={3} />
            <div className="alx-reject-actions">
              <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setRejectModalId(null)}>{t('admin.cancel')}</button>
              <button type="button" className="crm-btn crm-btn-danger" disabled={updating !== null} onClick={() => handleStatusChange(rejectModalId, 'rejected', rejectionReason)}>{t('admin.reject')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
