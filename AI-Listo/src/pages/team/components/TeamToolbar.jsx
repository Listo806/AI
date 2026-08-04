import { Search, Sparkles, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TEAM_FILTERS } from "../utils/teamConstants";

export default function TeamToolbar({
  search,
  onSearch,
  filter,
  onFilter,
  onInvite,
  onRunAI,
  runningAI,
  teams,
  selectedTeam,
  setSelectedTeam,
}) {
  const { t } = useTranslation();

  const filterLabels = {
    all: t("team.toolbar.filterAll", "All"),
    active: t("team.toolbar.filterActive", "Active"),
    pending: t("team.toolbar.filterPending", "Pending"),
    manager: t("team.toolbar.filterManagers", "Managers"),
    agent: t("team.toolbar.filterAgents", "Agents"),
    "high-performers": t("team.toolbar.filterHighPerformers", "High Performers"),
  };

  return (
    <div className="team-toolbar">
      {/* LEFT */}
      <div className="team-toolbar-left">
        {/* SEARCH */}
        <div className="team-search-box">
          <Search size={16} className="team-search-icon" />

          <input
            type="text"
            placeholder={t("team.toolbar.searchPlaceholder", "Search members...")}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="team-search-input"
          />
        </div>
        {/* TEAM SELECT */}
        <div className="team-select-box">
          <select
            value={selectedTeam || ""}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="team-select-input"
          >
            <option value="" disabled>
              {t("team.toolbar.selectTeam", "Select Team")}
            </option>

            {(teams || []).map((team) => (
              <option key={team.id || team._id} value={team.id || team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        {/* FILTERS */}
        <div className="team-filter-list">
          {TEAM_FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => onFilter(item.key)}
              className={
                filter === item.key
                  ? "team-filter-btn active"
                  : "team-filter-btn"
              }
            >
              {filterLabels[item.key] || item.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="team-toolbar-right">
        <button onClick={onRunAI} className="team-ai-btn team-secondary-btn">
          <Sparkles size={16} />

          {runningAI
            ? t("team.toolbar.running", "Running...")
            : t("team.toolbar.aiInsights", "AI Insights")}
        </button>

        {/*<button onClick={onInvite} className="team-primary-btn">
          <Plus size={16} />
          Invite Member
        </button>*/}
      </div>
    </div>
  );
}
