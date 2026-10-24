import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
} from "../../constants/defaultSettings";
import { formatInrPrice } from "../../constants/serviceCatalogue";
import {
  DEFAULT_FESTIVALS,
  DEFAULT_POSTER_TEMPLATES,
  POSTER_FORMATS,
  POSTER_THEMES,
  REFERENCE_POSTER_PRESETS,
} from "../../poster/posterTemplates";
import {
  exportPosterToPng,
  exportSnapshotPreviewCardToPng,
  renderPosterToCanvas,
} from "../../poster/posterRenderer";
import {
  buildPosterSnapshot,
  validatePosterCampaignInput,
} from "../../poster/snapshotResolver";
import { fetchAdminSiteSettings } from "../../services/settingsService";
import { fetchAdminServices } from "../../services/serviceCatalogueService";
import { fetchAdminPackages } from "../../services/packageService";
import { fetchAdminBundles } from "../../services/bundleService";
import {
  createFestivalRecord,
  fetchAdminFestivals,
  fetchPosterTemplates,
} from "../../services/festivalService";
import {
  archivePosterRecord,
  fetchAdminPosters,
  recordPosterExportMetadata,
  savePosterDraft,
} from "../../services/posterService";
import RichTextCampaignField, {
  DEFAULT_CAMPAIGN_TEXT_STYLES,
} from "../../components/admin/RichTextCampaignField";
import { useAuth } from "../../context/AuthContext";

export default function AdminPosterStudioPage() {
  const { client } = useAuth();
  const canvasRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [brand, setBrand] = useState(DEFAULT_BRAND_SETTINGS);
  const [contact, setContact] = useState(DEFAULT_CONTACT_SETTINGS);
  const [festivals, setFestivals] = useState(DEFAULT_FESTIVALS);
  const [templates, setTemplates] = useState(DEFAULT_POSTER_TEMPLATES);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [savedPosters, setSavedPosters] = useState([]);

  const [editingPosterId, setEditingPosterId] = useState(null);
  const [lockedSnapshot, setLockedSnapshot] = useState(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState("");

  const [campaignName, setCampaignName] = useState(
    "Karwa Chauth Festive Campaign"
  );
  const [selectedFestivalId, setSelectedFestivalId] = useState(
    DEFAULT_FESTIVALS[0].id
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(
    DEFAULT_POSTER_TEMPLATES[0].template_key
  );
  const [formatKey, setFormatKey] = useState("square_1080");
  const [themeKey, setThemeKey] = useState("royal_dark_gold");
  const [headline, setHeadline] = useState(
    DEFAULT_FESTIVALS[0].default_headline
  );
  const [subheadline, setSubheadline] = useState(
    DEFAULT_FESTIVALS[0].default_subheadline
  );
  const [secondarySubheadline, setSecondarySubheadline] = useState(
    "Celebrate the bond of love with Self-Care & Confidence"
  );
  const [sectionTitle, setSectionTitle] = useState("MULTI SERVICE PACKAGES");
  const [sectionSubtitle, setSectionSubtitle] = useState(
    "Pamper Yourself This Festive Season"
  );
  const [badgeText, setBadgeText] = useState(
    "GLOW\nINSIDE & OUT\nBECAUSE\nYOU DESERVE IT!"
  );
  const [ctaText, setCtaText] = useState("BOOK YOUR APPOINTMENT NOW!");
  const [footerTagline, setFooterTagline] = useState(
    "THIS TEEJ, GIFT YOUR SISTER THE GLOW SHE DESERVES."
  );
  const [portraitUrl, setPortraitUrl] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [validityNote, setValidityNote] = useState("");
  const [textStyles, setTextStyles] = useState(DEFAULT_CAMPAIGN_TEXT_STYLES);

  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState([]);

  const [savingDraft, setSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [exportError, setExportError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archivingPoster, setArchivingPoster] = useState(false);

  // Custom Festival Dialog state
  const [festivalDialogOpen, setFestivalDialogOpen] = useState(false);
  const [newFestivalForm, setNewFestivalForm] = useState({
    name: "",
    category: "Indian Festival",
    default_headline: "",
    default_subheadline: "",
    motif_label: "✨",
    accent_color: "#c2185b",
  });
  const [festivalFieldErrors, setFestivalFieldErrors] = useState({});
  const [festivalFormError, setFestivalFormError] = useState("");
  const [savingFestival, setSavingFestival] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetchAdminSiteSettings(client),
      fetchAdminFestivals(client),
      fetchPosterTemplates(client),
      fetchAdminPackages(client),
      fetchAdminBundles(client),
      fetchAdminPosters(client),
      fetchAdminServices(client),
    ]).then(
      ([
        settingsRes,
        festRes,
        tplRes,
        pkgRes,
        bndRes,
        postersRes,
        svcRes,
      ]) => {
        if (!isMounted) return;
        setBrand(settingsRes.brand);
        setContact(settingsRes.contact);

        const loadedFestivals =
          festRes.data && festRes.data.length > 0
            ? festRes.data
            : DEFAULT_FESTIVALS;
        setFestivals(loadedFestivals);
        setSelectedFestivalId(loadedFestivals[0].id);
        setHeadline(loadedFestivals[0].default_headline || "");
        setSubheadline(loadedFestivals[0].default_subheadline || "");

        const loadedTemplates =
          tplRes.data && tplRes.data.length > 0
            ? tplRes.data
            : DEFAULT_POSTER_TEMPLATES;
        setTemplates(loadedTemplates);
        setSelectedTemplateKey(loadedTemplates[0].template_key);

        const activeSvcs = (svcRes?.data || []).filter(
          (s) => s.status !== "archived"
        );
        const activePkgs = (pkgRes.data || []).filter(
          (p) => p.status !== "archived"
        );
        const activeBnds = (bndRes.data || []).filter(
          (b) => b.status !== "archived"
        );
        setServices(activeSvcs);
        setPackages(activePkgs);
        setBundles(activeBnds);
        setSavedPosters(postersRes.data || []);

        if (activePkgs.length > 0) {
          setSelectedPackageIds(activePkgs.slice(0, 4).map((p) => p.id));
        }

        setLoadError(pkgRes.error || bndRes.error || "");
        setLoading(false);
      }
    );
    return () => {
      isMounted = false;
    };
  }, [client]);

  const activeFestival = useMemo(
    () =>
      festivals.find((f) => f.id === selectedFestivalId) ||
      festivals[0] ||
      DEFAULT_FESTIVALS[0],
    [festivals, selectedFestivalId]
  );

  const activeTemplate = useMemo(
    () =>
      templates.find((t) => t.template_key === selectedTemplateKey) ||
      DEFAULT_POSTER_TEMPLATES.find(
        (t) => t.template_key === selectedTemplateKey
      ) ||
      templates[0] ||
      DEFAULT_POSTER_TEMPLATES[0],
    [templates, selectedTemplateKey]
  );

  const selectedPackages = useMemo(
    () => packages.filter((p) => selectedPackageIds.includes(p.id)),
    [packages, selectedPackageIds]
  );

  const selectedBundles = useMemo(
    () => bundles.filter((b) => selectedBundleIds.includes(b.id)),
    [bundles, selectedBundleIds]
  );

  const validation = useMemo(
    () =>
      validatePosterCampaignInput({
        campaignName,
        headline,
        subheadline,
        validityNote,
        formatKey,
        themeKey,
        template: activeTemplate,
        selectedPackages,
        selectedBundles,
      }),
    [
      campaignName,
      headline,
      subheadline,
      validityNote,
      formatKey,
      themeKey,
      activeTemplate,
      selectedPackages,
      selectedBundles,
    ]
  );

  const liveSnapshot = useMemo(
    () =>
      buildPosterSnapshot({
        campaignName,
        headline,
        subheadline,
        secondarySubheadline,
        sectionTitle,
        sectionSubtitle,
        badgeText,
        ctaText,
        footerTagline,
        validityNote,
        portraitUrl,
        showQrCode,
        textStyles,
        festival: activeFestival,
        template: activeTemplate,
        formatKey,
        themeKey,
        brand,
        contact,
        selectedPackages,
        selectedBundles,
        catalogueServices: services,
      }),
    [
      campaignName,
      headline,
      subheadline,
      secondarySubheadline,
      sectionTitle,
      sectionSubtitle,
      badgeText,
      ctaText,
      footerTagline,
      validityNote,
      portraitUrl,
      showQrCode,
      textStyles,
      activeFestival,
      activeTemplate,
      formatKey,
      themeKey,
      brand,
      contact,
      selectedPackages,
      selectedBundles,
      services,
    ]
  );

  const handleTextStyleChange = (fieldKey, nextStyle) => {
    setLockedSnapshot(null);
    setTextStyles((prev) => ({
      ...prev,
      [fieldKey]: {
        ...(prev[fieldKey] || {}),
        ...(nextStyle || {}),
      },
    }));
  };

  const displayedSnapshot = lockedSnapshot || liveSnapshot;

  useEffect(() => {
    if (canvasRef.current && displayedSnapshot) {
      renderPosterToCanvas(canvasRef.current, displayedSnapshot);
    }
  }, [displayedSnapshot]);

  const handleApplyPreset = (presetKey) => {
    setSelectedPresetKey(presetKey);
    const preset = REFERENCE_POSTER_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    setLockedSnapshot(null);
    setSelectedTemplateKey(preset.templateKey);
    setFormatKey(preset.formatKey);
    setThemeKey(preset.themeKey);
    setCampaignName(preset.campaignName);
    setHeadline(preset.headline);
    setSubheadline(preset.subheadline);
    if (preset.secondarySubheadline !== undefined) {
      setSecondarySubheadline(preset.secondarySubheadline);
    }
    if (preset.sectionTitle !== undefined) {
      setSectionTitle(preset.sectionTitle);
    }
    if (preset.sectionSubtitle !== undefined) {
      setSectionSubtitle(preset.sectionSubtitle);
    }
    if (preset.badgeText !== undefined) {
      setBadgeText(preset.badgeText);
    }
    if (preset.ctaText !== undefined) {
      setCtaText(preset.ctaText);
    }
    if (preset.footerTagline !== undefined) {
      setFooterTagline(preset.footerTagline);
    }
    setShowQrCode(Boolean(preset.showQrCode));

    const matchFest = festivals.find(
      (f) => f.name.toLowerCase() === (preset.festivalName || "").toLowerCase()
    );
    if (matchFest) {
      setSelectedFestivalId(matchFest.id);
    }

    if (Array.isArray(preset.packageNames) && packages.length > 0) {
      const matchedIds = packages
        .filter((pkg) =>
          preset.packageNames.some(
            (pName) => pName.toLowerCase() === (pkg.name || "").toLowerCase()
          )
        )
        .map((pkg) => pkg.id);
      if (matchedIds.length > 0) {
        setSelectedPackageIds(matchedIds);
        setSelectedBundleIds([]);
      }
    }
  };

  const handleTemplateSelect = (nextTemplateKey) => {
    setLockedSnapshot(null);
    setSelectedTemplateKey(nextTemplateKey);

    const matchingPreset = REFERENCE_POSTER_PRESETS.find(
      (p) => p.templateKey === nextTemplateKey
    );
    if (!matchingPreset) return;

    setFormatKey(matchingPreset.formatKey);
    setThemeKey(matchingPreset.themeKey);
    if (matchingPreset.sectionTitle !== undefined) {
      setSectionTitle(matchingPreset.sectionTitle);
    }
    if (matchingPreset.sectionSubtitle !== undefined) {
      setSectionSubtitle(matchingPreset.sectionSubtitle);
    }
    if (matchingPreset.badgeText !== undefined) {
      setBadgeText(matchingPreset.badgeText);
    }
    if (matchingPreset.ctaText !== undefined) {
      setCtaText(matchingPreset.ctaText);
    }
    if (matchingPreset.footerTagline !== undefined) {
      setFooterTagline(matchingPreset.footerTagline);
    }
    setShowQrCode(Boolean(matchingPreset.showQrCode));

    if (Array.isArray(matchingPreset.packageNames) && packages.length > 0) {
      const matchedIds = packages
        .filter((pkg) =>
          matchingPreset.packageNames.some(
            (pName) => pName.toLowerCase() === (pkg.name || "").toLowerCase()
          )
        )
        .map((pkg) => pkg.id);
      if (matchedIds.length > 0) {
        setSelectedPackageIds(matchedIds);
        setSelectedBundleIds([]);
      }
    }
  };

  const handleFestivalSelect = (event) => {
    const nextId = event.target.value;
    setLockedSnapshot(null);
    setSelectedFestivalId(nextId);
    const fest = festivals.find((f) => f.id === nextId);
    if (fest) {
      setHeadline(fest.default_headline || "");
      setSubheadline(fest.default_subheadline || "");
      setCampaignName(`${fest.name} Festive Campaign`);
      setSectionSubtitle(`Pamper Yourself This ${fest.name}`);
      setFooterTagline(
        `THIS ${fest.name.toUpperCase()}, GIFT YOUR SISTER THE GLOW SHE DESERVES.`
      );
    }
  };

  const handleTogglePackage = (pkgId) => {
    setLockedSnapshot(null);
    setSelectedPackageIds((prev) =>
      prev.includes(pkgId)
        ? prev.filter((id) => id !== pkgId)
        : [...prev, pkgId]
    );
  };

  const handleToggleBundle = (bundleId) => {
    setLockedSnapshot(null);
    setSelectedBundleIds((prev) =>
      prev.includes(bundleId)
        ? prev.filter((id) => id !== bundleId)
        : [...prev, bundleId]
    );
  };

  const handleSaveDraft = async () => {
    setDraftError("");
    setExportError("");
    setStatusMessage("");

    const snapshotToSave = displayedSnapshot;
    if (!lockedSnapshot && !validation.valid) {
      setDraftError(
        validation.errors.campaignName ||
          validation.errors.headline ||
          validation.errors.offerings ||
          "Please fix the highlighted campaign fields before saving."
      );
      return;
    }

    setSavingDraft(true);
    const result = await savePosterDraft(
      {
        id: editingPosterId,
        campaignName: snapshotToSave.campaign?.campaign_name || campaignName,
        festivalId: snapshotToSave.festival?.id || activeFestival?.id || null,
        templateKey:
          snapshotToSave.template?.template_key || activeTemplate.template_key,
        templateVersion:
          snapshotToSave.template?.version || activeTemplate.version || 1,
        formatKey: snapshotToSave.template?.format_key || formatKey,
        structuredConfig: {
          themeKey: snapshotToSave.template?.theme_key || themeKey,
          selectedPackageIds,
          selectedBundleIds,
          showQrCode,
          portraitUrl,
          textStyles,
        },
        snapshot: snapshotToSave,
      },
      client
    );
    setSavingDraft(false);

    if (result.error) {
      setDraftError(result.error);
      return;
    }

    const saved = result.data;
    setEditingPosterId(saved.id);
    setSavedPosters((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });
    setStatusMessage(
      `Saved poster draft "${saved.campaign_name}" (not published to public website).`
    );
  };

  const handleExportPng = async () => {
    setExportError("");
    setDraftError("");
    setStatusMessage("");

    const result = exportPosterToPng(canvasRef.current, displayedSnapshot);
    if (!result.ok) {
      setExportError(result.error);
      return;
    }

    if (editingPosterId) {
      await recordPosterExportMetadata(
        editingPosterId,
        {
          filename: result.filename,
          width: result.width,
          height: result.height,
          formatKey: displayedSnapshot.template?.format_key || formatKey,
        },
        client
      );
    }

    setStatusMessage(`Exported PNG "${result.filename}".`);
  };

  const handleExportPreviewCardPng = () => {
    setExportError("");
    setDraftError("");
    setStatusMessage("");

    const result = exportSnapshotPreviewCardToPng(displayedSnapshot);
    if (!result.ok) {
      setExportError(result.error);
      return;
    }

    setStatusMessage(
      `Exported Snapshot Preview Card PNG "${result.filename}".`
    );
  };

  const handleOpenSavedPoster = (poster) => {
    setDraftError("");
    setExportError("");
    setStatusMessage("");
    setEditingPosterId(poster.id);

    const snap = poster.content_snapshot;
    setLockedSnapshot(snap);
    setCampaignName(
      snap?.campaign?.campaign_name || poster.campaign_name || ""
    );
    setHeadline(snap?.campaign?.headline || "");
    setSubheadline(snap?.campaign?.subheadline || "");
    setValidityNote(snap?.campaign?.validity_note || "");
    if (snap?.campaign?.secondary_subheadline !== undefined) {
      setSecondarySubheadline(snap.campaign.secondary_subheadline);
    }
    if (snap?.campaign?.section_title) {
      setSectionTitle(snap.campaign.section_title);
    }
    if (snap?.campaign?.section_subtitle !== undefined) {
      setSectionSubtitle(snap.campaign.section_subtitle);
    }
    if (snap?.campaign?.badge_text !== undefined) {
      setBadgeText(snap.campaign.badge_text);
    }
    if (snap?.campaign?.cta_text) {
      setCtaText(snap.campaign.cta_text);
    }
    if (snap?.campaign?.footer_tagline) {
      setFooterTagline(snap.campaign.footer_tagline);
    }
    if (snap?.campaign?.text_styles) {
      setTextStyles({
        ...DEFAULT_CAMPAIGN_TEXT_STYLES,
        ...snap.campaign.text_styles,
      });
    }
    if (snap?.template?.template_key) {
      setSelectedTemplateKey(snap.template.template_key);
    }
    if (snap?.template?.format_key) {
      setFormatKey(snap.template.format_key);
    }
    if (snap?.template?.theme_key) {
      setThemeKey(snap.template.theme_key);
    }
    if (Array.isArray(poster.structured_config?.selectedPackageIds)) {
      setSelectedPackageIds(poster.structured_config.selectedPackageIds);
    }
    if (Array.isArray(poster.structured_config?.selectedBundleIds)) {
      setSelectedBundleIds(poster.structured_config.selectedBundleIds);
    }
  };

  const handleResetNewPoster = () => {
    setEditingPosterId(null);
    setLockedSnapshot(null);
    setDraftError("");
    setExportError("");
    setStatusMessage("");
  };

  const handleResetForm = () => {
    const defaultFest = festivals[0] || DEFAULT_FESTIVALS[0];
    const defaultTpl = templates[0] || DEFAULT_POSTER_TEMPLATES[0];
    setEditingPosterId(null);
    setLockedSnapshot(null);
    setSelectedPresetKey("");
    setSelectedFestivalId(defaultFest.id);
    setSelectedTemplateKey(defaultTpl.template_key);
    setFormatKey("square_1080");
    setThemeKey("royal_dark_gold");
    setCampaignName(`${defaultFest.name} Festive Campaign`);
    setHeadline(defaultFest.default_headline || "");
    setSubheadline(defaultFest.default_subheadline || "");
    setSecondarySubheadline(
      "Celebrate the bond of love with Self-Care & Confidence"
    );
    setSectionTitle("MULTI SERVICE PACKAGES");
    setSectionSubtitle(`Pamper Yourself This ${defaultFest.name}`);
    setBadgeText("GLOW\nINSIDE & OUT\nBECAUSE\nYOU DESERVE IT!");
    setCtaText("BOOK YOUR APPOINTMENT NOW!");
    setFooterTagline(
      `THIS ${defaultFest.name.toUpperCase()}, GIFT YOUR SISTER THE GLOW SHE DESERVES.`
    );
    setPortraitUrl("");
    setShowQrCode(false);
    setValidityNote("");
    setTextStyles(DEFAULT_CAMPAIGN_TEXT_STYLES);
    setSelectedPackageIds(packages.slice(0, 4).map((p) => p.id));
    setSelectedBundleIds([]);
    setDraftError("");
    setExportError("");
    setStatusMessage("Reset Poster Configuration form to default values.");
  };

  const handleClearForm = () => {
    setLockedSnapshot(null);
    setSelectedPresetKey("");
    setCampaignName("");
    setHeadline("");
    setSubheadline("");
    setSecondarySubheadline("");
    setSectionTitle("");
    setSectionSubtitle("");
    setBadgeText("");
    setCtaText("");
    setFooterTagline("");
    setPortraitUrl("");
    setShowQrCode(false);
    setValidityNote("");
    setTextStyles(DEFAULT_CAMPAIGN_TEXT_STYLES);
    setSelectedPackageIds([]);
    setSelectedBundleIds([]);
    setDraftError("");
    setExportError("");
    setStatusMessage("Cleared all Poster Configuration form inputs.");
  };

  const handleConfirmArchivePoster = async () => {
    if (!archiveTarget) return;
    setArchivingPoster(true);
    setDraftError("");
    setStatusMessage("");

    const result = await archivePosterRecord(archiveTarget.id, client);
    setArchivingPoster(false);

    if (result.error) {
      setDraftError(result.error);
      setArchiveTarget(null);
      return;
    }

    const updated = result.data;
    setSavedPosters((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (editingPosterId === updated.id) {
      handleResetNewPoster();
    }
    setStatusMessage(`Archived poster draft "${updated.campaign_name}".`);
    setArchiveTarget(null);
  };

  const handleCreateFestival = async (event) => {
    event.preventDefault();
    setFestivalFormError("");
    setFestivalFieldErrors({});

    setSavingFestival(true);
    const result = await createFestivalRecord(newFestivalForm, client);
    setSavingFestival(false);

    if (result.error) {
      setFestivalFieldErrors(result.fieldErrors || {});
      setFestivalFormError(result.error);
      return;
    }

    const created = result.data;
    setFestivals((prev) => [...prev, created]);
    setLockedSnapshot(null);
    setSelectedFestivalId(created.id);
    setHeadline(created.default_headline || "");
    setSubheadline(created.default_subheadline || "");
    setCampaignName(`${created.name} Festive Campaign`);
    setFestivalDialogOpen(false);
    setNewFestivalForm({
      name: "",
      category: "Indian Festival",
      default_headline: "",
      default_subheadline: "",
      motif_label: "✨",
      accent_color: "#c2185b",
    });
    setStatusMessage(`Added festival "${created.name}".`);
  };

  const activeDraftPosters = useMemo(
    () => savedPosters.filter((p) => p.status !== "archived"),
    [savedPosters]
  );

  if (loading) {
    return (
      <Box
        role="status"
        aria-live="polite"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress color="primary" aria-label="Loading Poster Studio" />
        <Typography variant="body1" color="text.secondary">
          Loading Festival Poster Studio...
        </Typography>
      </Box>
    );
  }

  const maxOfferings =
    Number(activeTemplate?.layout_config?.max_offerings) || 4;
  const allTemplateOptions =
    templates.length >= DEFAULT_POSTER_TEMPLATES.length
      ? templates
      : [
          ...templates,
          ...DEFAULT_POSTER_TEMPLATES.filter(
            (dt) => !templates.some((t) => t.template_key === dt.template_key)
          ),
        ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{ bgcolor: "background.paper" }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 2, flexWrap: "wrap", py: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
              }}
            >
              Festival Poster Studio
            </Typography>
            <Button
              component={RouterLink}
              to="/admin"
              variant="outlined"
              size="small"
            >
              &larr; Back to Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/"
              variant="text"
              size="small"
              color="inherit"
            >
              Public Site
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        {loadError && (
          <Alert severity="warning" role="alert" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {draftError && (
          <Alert severity="error" role="alert" sx={{ mb: 3 }}>
            {draftError}
          </Alert>
        )}

        {exportError && (
          <Alert
            severity="error"
            role="alert"
            sx={{ mb: 3 }}
            action={
              <Button
                type="button"
                color="inherit"
                size="small"
                onClick={handleExportPng}
              >
                Retry PNG Export
              </Button>
            }
          >
            {exportError}
          </Alert>
        )}

        {statusMessage && (
          <Alert severity="success" role="status" sx={{ mb: 3 }}>
            {statusMessage}
          </Alert>
        )}

        {lockedSnapshot && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            action={
              <Button
                type="button"
                color="inherit"
                size="small"
                onClick={() => setLockedSnapshot(null)}
              >
                Refresh Snapshot with Current Catalogue Data
              </Button>
            }
          >
            Viewing immutable saved snapshot for{" "}
            <strong>{lockedSnapshot.campaign?.campaign_name}</strong>. Source
            catalogue price edits do not alter this saved poster unless you
            refresh it.
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Left Column: Campaign, Festival, Template & Offerings Controls */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                borderTop: "4px solid",
                borderColor: "primary.main",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                  mb={2}
                >
                  <Typography variant="h5" component="h1" fontWeight="bold">
                    Poster Configuration
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {editingPosterId && (
                      <Button
                        type="button"
                        size="small"
                        variant="text"
                        onClick={handleResetNewPoster}
                      >
                        + New Poster
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={handleResetForm}
                    >
                      Reset Form
                    </Button>
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={handleClearForm}
                    >
                      Clear Form
                    </Button>
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      onClick={() => setFestivalDialogOpen(true)}
                    >
                      + Add Festival
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/admin/festivals"
                      size="small"
                      variant="text"
                    >
                      Manage Festivals
                    </Button>
                  </Box>
                </Box>

                <TextField
                  id="poster-preset-select"
                  select
                  label="Quick-Load Reference Poster Preset"
                  fullWidth
                  size="small"
                  margin="dense"
                  value={selectedPresetKey}
                  onChange={(e) => handleApplyPreset(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Custom Configuration</em>
                  </MenuItem>
                  {REFERENCE_POSTER_PRESETS.map((preset) => (
                    <MenuItem key={preset.key} value={preset.key}>
                      {preset.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  id="poster-festival-select"
                  select
                  label="Select Festival / Occasion"
                  fullWidth
                  margin="normal"
                  value={selectedFestivalId}
                  onChange={handleFestivalSelect}
                >
                  {festivals.map((fest) => (
                    <MenuItem key={fest.id} value={fest.id}>
                      {fest.name} ({fest.category})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  id="poster-template-select"
                  select
                  label="Poster Template"
                  fullWidth
                  margin="normal"
                  value={selectedTemplateKey}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  {allTemplateOptions.map((tpl) => (
                    <MenuItem key={tpl.template_key} value={tpl.template_key}>
                      {tpl.name} (up to{" "}
                      {tpl.layout_config?.max_offerings || 4} items)
                    </MenuItem>
                  ))}
                </TextField>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="poster-format-select"
                      select
                      label="Output Dimensions"
                      fullWidth
                      value={formatKey}
                      onChange={(e) => {
                        setLockedSnapshot(null);
                        setFormatKey(e.target.value);
                      }}
                    >
                      {Object.values(POSTER_FORMATS).map((fmt) => (
                        <MenuItem key={fmt.key} value={fmt.key}>
                          {fmt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="poster-theme-select"
                      select
                      label="Color Theme"
                      fullWidth
                      value={themeKey}
                      onChange={(e) => {
                        setLockedSnapshot(null);
                        setThemeKey(e.target.value);
                      }}
                    >
                      {Object.values(POSTER_THEMES).map((thm) => (
                        <MenuItem key={thm.key} value={thm.key}>
                          {thm.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2.5 }} />

                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Campaign Copy &amp; Typography Styling (Tiptap Rich Editor)
                </Typography>

                <TextField
                  id="poster-campaign-name"
                  label="Campaign Name"
                  fullWidth
                  required
                  margin="dense"
                  value={campaignName}
                  onChange={(e) => {
                    setLockedSnapshot(null);
                    setCampaignName(e.target.value);
                  }}
                  error={Boolean(validation.errors.campaignName)}
                  helperText={validation.errors.campaignName}
                />

                <RichTextCampaignField
                  id="poster-headline"
                  fieldKey="headline"
                  label="Poster Headline"
                  required
                  value={headline}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setHeadline(nextVal);
                  }}
                  styleValue={textStyles.headline}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("headline", nextStyle)
                  }
                  error={Boolean(validation.errors.headline)}
                  helperText={validation.errors.headline}
                />

                <RichTextCampaignField
                  id="poster-subheadline"
                  fieldKey="subheadline"
                  label="Poster Subheadline (Ribbon Banner)"
                  value={subheadline}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setSubheadline(nextVal);
                  }}
                  styleValue={textStyles.subheadline}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("subheadline", nextStyle)
                  }
                  error={Boolean(validation.errors.subheadline)}
                  helperText={validation.errors.subheadline}
                />

                <RichTextCampaignField
                  id="poster-secondary-subheadline"
                  fieldKey="secondarySubheadline"
                  label="Secondary Subheadline (Optional Accent Copy)"
                  value={secondarySubheadline}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setSecondarySubheadline(nextVal);
                  }}
                  styleValue={textStyles.secondarySubheadline}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("secondarySubheadline", nextStyle)
                  }
                />

                <RichTextCampaignField
                  id="poster-section-title"
                  fieldKey="sectionTitle"
                  label="Section Banner Title"
                  value={sectionTitle}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setSectionTitle(nextVal);
                  }}
                  styleValue={textStyles.sectionTitle}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("sectionTitle", nextStyle)
                  }
                />

                <RichTextCampaignField
                  id="poster-section-subtitle"
                  fieldKey="sectionSubtitle"
                  label="Section Banner Subtitle"
                  value={sectionSubtitle}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setSectionSubtitle(nextVal);
                  }}
                  styleValue={textStyles.sectionSubtitle}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("sectionSubtitle", nextStyle)
                  }
                />

                <RichTextCampaignField
                  id="poster-badge-text"
                  fieldKey="badgeText"
                  label="Circular Emblem Badge Copy"
                  multiline
                  minRows={2}
                  value={badgeText}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setBadgeText(nextVal);
                  }}
                  styleValue={textStyles.badgeText}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("badgeText", nextStyle)
                  }
                />

                <RichTextCampaignField
                  id="poster-cta-text"
                  fieldKey="ctaText"
                  label="CTA Ribbon Text"
                  value={ctaText}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setCtaText(nextVal);
                  }}
                  styleValue={textStyles.ctaText}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("ctaText", nextStyle)
                  }
                />

                <RichTextCampaignField
                  id="poster-footer-tagline"
                  fieldKey="footerTagline"
                  label="Footer Closing Tagline"
                  value={footerTagline}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setFooterTagline(nextVal);
                  }}
                  styleValue={textStyles.footerTagline}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("footerTagline", nextStyle)
                  }
                />

                <TextField
                  id="poster-portrait-url"
                  label="Custom Portrait Image URL (optional)"
                  fullWidth
                  size="small"
                  margin="dense"
                  placeholder="/poster-assets/bride-portrait-arch.png"
                  value={portraitUrl}
                  onChange={(e) => {
                    setLockedSnapshot(null);
                    setPortraitUrl(e.target.value);
                  }}
                />

                <RichTextCampaignField
                  id="poster-validity-note"
                  fieldKey="validityNote"
                  label="Optional Validity / Offer Note"
                  placeholder="Valid until Diwali Eve • Prior appointment required"
                  value={validityNote}
                  onChange={(nextVal) => {
                    setLockedSnapshot(null);
                    setValidityNote(nextVal);
                  }}
                  styleValue={textStyles.validityNote}
                  onStyleChange={(nextStyle) =>
                    handleTextStyleChange("validityNote", nextStyle)
                  }
                  error={Boolean(validation.errors.validityNote)}
                  helperText={
                    validation.errors.validityNote ||
                    "Leave blank if there is no specific date restriction."
                  }
                />

                <FormControlLabel
                  sx={{ mt: 0.5 }}
                  control={
                    <Checkbox
                      checked={showQrCode}
                      onChange={(e) => {
                        setLockedSnapshot(null);
                        setShowQrCode(e.target.checked);
                      }}
                    />
                  }
                  label="Display Scannable Booking QR Code in Footer"
                />

                <Divider sx={{ my: 2.5 }} />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Featured Packages &amp; Bundles
                  </Typography>
                  <Chip
                    label={`Selected: ${
                      selectedPackages.length + selectedBundles.length
                    } / ${maxOfferings}`}
                    size="small"
                    color={validation.errors.offerings ? "error" : "primary"}
                  />
                </Box>

                {validation.errors.offerings && !lockedSnapshot && (
                  <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                    {validation.errors.offerings}
                  </Alert>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Packages
                </Typography>
                {packages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    No active packages available.
                  </Typography>
                ) : (
                  <FormGroup sx={{ mb: 2 }}>
                    {packages.map((pkg) => (
                      <FormControlLabel
                        key={pkg.id}
                        control={
                          <Checkbox
                            checked={selectedPackageIds.includes(pkg.id)}
                            onChange={() => handleTogglePackage(pkg.id)}
                          />
                        }
                        label={`${pkg.name} (${formatInrPrice(pkg.price_inr)})`}
                      />
                    ))}
                  </FormGroup>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  gutterBottom
                >
                  Promotional Bundles
                </Typography>
                {bundles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No active bundles available.
                  </Typography>
                ) : (
                  <FormGroup>
                    {bundles.map((bundle) => (
                      <FormControlLabel
                        key={bundle.id}
                        control={
                          <Checkbox
                            checked={selectedBundleIds.includes(bundle.id)}
                            onChange={() => handleToggleBundle(bundle.id)}
                          />
                        }
                        label={`${bundle.name} (${formatInrPrice(
                          bundle.price_inr
                        )})`}
                      />
                    ))}
                  </FormGroup>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Live Snapshot, Export Actions & Saved Drafts */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1.5}
                  mb={2}
                >
                  <Box>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Live Poster Artwork Preview
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Saving a draft or exporting a PNG does not publish content
                      to the public website.
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1.5} flexWrap="wrap">
                    <Button
                      type="button"
                      variant="outlined"
                      color="primary"
                      disabled={savingDraft}
                      onClick={handleSaveDraft}
                    >
                      {savingDraft
                        ? "Saving Draft..."
                        : editingPosterId
                        ? "Update Poster Draft"
                        : "Save Poster Draft"}
                    </Button>
                    <Button
                      type="button"
                      variant="contained"
                      color="primary"
                      onClick={handleExportPng}
                    >
                      Export PNG
                    </Button>
                  </Box>
                </Box>

                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={`${displayedSnapshot.template.name} (v${displayedSnapshot.template.version})`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${displayedSnapshot.template.width} × ${displayedSnapshot.template.height} px`}
                    size="small"
                    color="primary"
                  />
                  {lockedSnapshot && (
                    <Chip
                      label="Snapshot Mode: Immutable"
                      size="small"
                      color="info"
                    />
                  )}
                </Box>
{/* Canvas Renderer Surface */}
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={1}
                  >
                    High-Resolution Fabric.js Canvas Surface (
                    {displayedSnapshot.template.width} ×{" "}
                    {displayedSnapshot.template.height})
                  </Typography>
                  <canvas
                    ref={canvasRef}
                    aria-label="Poster artwork canvas"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      border: "2px solid #d4af63",
                      borderRadius: "6px",
                      backgroundColor: "#0f0506",
                    }}
                  />
                </Box>
                
                {/* Accessible Luxury Snapshot Preview Card */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                  mt={3}
                  mb={1.5}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Accessible Luxury Snapshot Preview Card
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={handleExportPreviewCardPng}
                  >
                    Export Preview Card PNG
                  </Button>
                </Box>

                <Box
                  data-testid="poster-snapshot-preview"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor:
                      displayedSnapshot.template.theme?.background || "#0f0506",
                    color:
                      displayedSnapshot.template.theme?.textPrimary ||
                      "#fdf8f2",
                    border: `3px solid ${
                      displayedSnapshot.template.theme?.secondary || "#d4af63"
                    }`,
                    boxShadow: "inset 0 0 0 2px rgba(212, 175, 99, 0.35)",
                    textAlign: "center",
                    mb: 3,
                  }}
                >
                  <Chip
                    label={displayedSnapshot.festival.motif_label}
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: displayedSnapshot.festival.accent_color,
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: `'${displayedSnapshot.brand.heading_font}', serif`,
                      color:
                        displayedSnapshot.template.theme?.accent || "#f1cf85",
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    {displayedSnapshot.brand.brand_name}
                  </Typography>
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{
                      fontFamily: `'${
                        displayedSnapshot.campaign.text_styles?.headline
                          ?.fontFamily || displayedSnapshot.brand.heading_font
                      }', serif`,
                      color:
                        displayedSnapshot.campaign.text_styles?.headline
                          ?.color ||
                        displayedSnapshot.template.theme?.primary ||
                        "#e05368",
                      fontWeight:
                        displayedSnapshot.campaign.text_styles?.headline
                          ?.fontWeight || 700,
                      fontStyle:
                        displayedSnapshot.campaign.text_styles?.headline
                          ?.fontStyle || "italic",
                      textTransform:
                        displayedSnapshot.campaign.text_styles?.headline
                          ?.textTransform || "none",
                      ...(Number(
                        displayedSnapshot.campaign.text_styles?.headline
                          ?.fontSize
                      ) > 0
                        ? {
                            fontSize: `${Math.round(
                              Number(
                                displayedSnapshot.campaign.text_styles.headline
                                  .fontSize
                              ) * 0.65
                            )}px`,
                          }
                        : {}),
                      mt: 0.5,
                    }}
                  >
                    {displayedSnapshot.campaign.headline}
                  </Typography>
                  {displayedSnapshot.campaign.subheadline && (
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 2.5,
                        py: 0.5,
                        my: 1,
                        borderRadius: 1,
                        bgcolor:
                          displayedSnapshot.template.theme?.secondary ||
                          "#d4af63",
                        color:
                          displayedSnapshot.campaign.text_styles?.subheadline
                            ?.color || "#1b080a",
                        fontFamily: `'${
                          displayedSnapshot.campaign.text_styles?.subheadline
                            ?.fontFamily || displayedSnapshot.brand.heading_font
                        }', serif`,
                        fontWeight:
                          displayedSnapshot.campaign.text_styles?.subheadline
                            ?.fontWeight || 700,
                        fontStyle:
                          displayedSnapshot.campaign.text_styles?.subheadline
                            ?.fontStyle || "italic",
                        textTransform:
                          displayedSnapshot.campaign.text_styles?.subheadline
                            ?.textTransform || "none",
                        ...(Number(
                          displayedSnapshot.campaign.text_styles?.subheadline
                            ?.fontSize
                        ) > 0
                          ? {
                              fontSize: `${Math.round(
                                Number(
                                  displayedSnapshot.campaign.text_styles
                                    .subheadline.fontSize
                                ) * 0.65
                              )}px`,
                            }
                          : {}),
                      }}
                    >
                      ❈ {displayedSnapshot.campaign.subheadline} ❈
                    </Box>
                  )}

                  {displayedSnapshot.campaign.secondary_subheadline && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: `'${
                          displayedSnapshot.campaign.text_styles
                            ?.secondarySubheadline?.fontFamily ||
                          displayedSnapshot.brand.heading_font
                        }', serif`,
                        color:
                          displayedSnapshot.campaign.text_styles
                            ?.secondarySubheadline?.color || "#f5ebe6",
                        fontWeight:
                          displayedSnapshot.campaign.text_styles
                            ?.secondarySubheadline?.fontWeight || "normal",
                        fontStyle:
                          displayedSnapshot.campaign.text_styles
                            ?.secondarySubheadline?.fontStyle || "normal",
                        textTransform:
                          displayedSnapshot.campaign.text_styles
                            ?.secondarySubheadline?.textTransform || "none",
                        ...(Number(
                          displayedSnapshot.campaign.text_styles
                            ?.secondarySubheadline?.fontSize
                        ) > 0
                          ? {
                              fontSize: `${Math.round(
                                Number(
                                  displayedSnapshot.campaign.text_styles
                                    .secondarySubheadline.fontSize
                                ) * 0.65
                              )}px`,
                            }
                          : {}),
                        mt: 0.5,
                      }}
                    >
                      {displayedSnapshot.campaign.secondary_subheadline}
                    </Typography>
                  )}

                  {displayedSnapshot.campaign.badge_text && (
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 2,
                        py: 0.5,
                        mt: 1,
                        borderRadius: 4,
                        border: "1px solid #d4af63",
                        bgcolor: "rgba(18, 7, 9, 0.9)",
                        fontFamily: `'${
                          displayedSnapshot.campaign.text_styles?.badgeText
                            ?.fontFamily || displayedSnapshot.brand.heading_font
                        }', serif`,
                        color:
                          displayedSnapshot.campaign.text_styles?.badgeText
                            ?.color || "#f8efe6",
                        fontWeight:
                          displayedSnapshot.campaign.text_styles?.badgeText
                            ?.fontWeight || "bold",
                        fontStyle:
                          displayedSnapshot.campaign.text_styles?.badgeText
                            ?.fontStyle || "normal",
                        textTransform:
                          displayedSnapshot.campaign.text_styles?.badgeText
                            ?.textTransform || "none",
                        fontSize:
                          Number(
                            displayedSnapshot.campaign.text_styles?.badgeText
                              ?.fontSize
                          ) > 0
                            ? `${Math.round(
                                Number(
                                  displayedSnapshot.campaign.text_styles
                                    .badgeText.fontSize
                                ) * 0.6
                              )}px`
                            : "0.75rem",
                      }}
                    >
                      {String(displayedSnapshot.campaign.badge_text)
                        .split(/\r?\n/)
                        .filter(Boolean)
                        .join(" • ")}{" "}
                      ♥
                    </Box>
                  )}

                  {displayedSnapshot.campaign.section_title && (
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mt: 1.5,
                        fontFamily: `'${
                          displayedSnapshot.campaign.text_styles?.sectionTitle
                            ?.fontFamily || displayedSnapshot.brand.heading_font
                        }', serif`,
                        color:
                          displayedSnapshot.campaign.text_styles?.sectionTitle
                            ?.color || "#f1cf85",
                        fontWeight:
                          displayedSnapshot.campaign.text_styles?.sectionTitle
                            ?.fontWeight || "bold",
                        fontStyle:
                          displayedSnapshot.campaign.text_styles?.sectionTitle
                            ?.fontStyle || "normal",
                        textTransform:
                          displayedSnapshot.campaign.text_styles?.sectionTitle
                            ?.textTransform || "none",
                        ...(Number(
                          displayedSnapshot.campaign.text_styles?.sectionTitle
                            ?.fontSize
                        ) > 0
                          ? {
                              fontSize: `${Math.round(
                                Number(
                                  displayedSnapshot.campaign.text_styles
                                    .sectionTitle.fontSize
                                ) * 0.65
                              )}px`,
                            }
                          : {}),
                      }}
                    >
                      ❈ {displayedSnapshot.campaign.section_title} ❈
                    </Typography>
                  )}

                  {displayedSnapshot.campaign.section_subtitle && (
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{
                        mb: 1,
                        fontFamily: `'${
                          displayedSnapshot.campaign.text_styles
                            ?.sectionSubtitle?.fontFamily ||
                          displayedSnapshot.brand.heading_font
                        }', serif`,
                        color:
                          displayedSnapshot.campaign.text_styles
                            ?.sectionSubtitle?.color || "#ebd5c8",
                        fontWeight:
                          displayedSnapshot.campaign.text_styles
                            ?.sectionSubtitle?.fontWeight || "normal",
                        fontStyle:
                          displayedSnapshot.campaign.text_styles
                            ?.sectionSubtitle?.fontStyle || "italic",
                        textTransform:
                          displayedSnapshot.campaign.text_styles
                            ?.sectionSubtitle?.textTransform || "none",
                        ...(Number(
                          displayedSnapshot.campaign.text_styles
                            ?.sectionSubtitle?.fontSize
                        ) > 0
                          ? {
                              fontSize: `${Math.round(
                                Number(
                                  displayedSnapshot.campaign.text_styles
                                    .sectionSubtitle.fontSize
                                ) * 0.65
                              )}px`,
                            }
                          : {}),
                      }}
                    >
                      — {displayedSnapshot.campaign.section_subtitle} —
                    </Typography>
                  )}

                  <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                    {displayedSnapshot.offerings.map((off, idx) => {
                      const defaultCols = [
                        "#4e1014",
                        "#261326",
                        "#4f3811",
                        "#0c3329",
                      ];
                      const cardBg =
                        off.card_color || defaultCols[idx % defaultCols.length];
                      return (
                        <Grid
                          size={{
                            xs: 12,
                            sm:
                              Number(
                                displayedSnapshot.template.layout_config
                                  ?.columns
                              ) === 1 ||
                              displayedSnapshot.offerings.length === 1
                                ? 12
                                : 6,
                          }}
                          key={`${off.kind}-${off.id}`}
                        >
                          <Card
                            variant="outlined"
                            sx={{
                              textAlign: "left",
                              bgcolor: cardBg,
                              color: "#fdf8f2",
                              border: "1.5px solid #d4af63",
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              {off.badge_text && (
                                <Chip
                                  label={off.badge_text}
                                  size="small"
                                  sx={{
                                    mb: 0.5,
                                    bgcolor: "#e5b55f",
                                    color: "#1e0708",
                                    fontWeight: 700,
                                  }}
                                />
                              )}
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="baseline"
                                gap={1}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                  sx={{ color: "#f1cf85" }}
                                >
                                  {off.name}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  sx={{ color: "#fff1c1" }}
                                >
                                  {off.price_formatted}
                                </Typography>
                              </Box>
                              {off.items.map((line, lineIdx) => (
                                <Typography
                                  key={lineIdx}
                                  variant="caption"
                                  display="block"
                                  sx={{ color: "#f5ebe6", mt: 0.25 }}
                                >
                                  ✦ {line}
                                </Typography>
                              ))}
                              {off.tagline && (
                                <Typography
                                  variant="caption"
                                  display="block"
                                  sx={{
                                    color: "#f1cf85",
                                    fontWeight: "bold",
                                    mt: 1,
                                    pt: 0.5,
                                    borderTop:
                                      "1px dashed rgba(212,175,99,0.4)",
                                  }}
                                >
                                  {off.tagline}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {displayedSnapshot.campaign.validity_note && (
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{
                        fontFamily: `'${
                          displayedSnapshot.campaign.text_styles?.validityNote
                            ?.fontFamily || "Lato"
                        }', sans-serif`,
                        color:
                          displayedSnapshot.campaign.text_styles?.validityNote
                            ?.color || "#f1cf85",
                        fontWeight:
                          displayedSnapshot.campaign.text_styles?.validityNote
                            ?.fontWeight || "bold",
                        fontStyle:
                          displayedSnapshot.campaign.text_styles?.validityNote
                            ?.fontStyle || "normal",
                        textTransform:
                          displayedSnapshot.campaign.text_styles?.validityNote
                            ?.textTransform || "none",
                        ...(Number(
                          displayedSnapshot.campaign.text_styles?.validityNote
                            ?.fontSize
                        ) > 0
                          ? {
                              fontSize: `${Math.round(
                                Number(
                                  displayedSnapshot.campaign.text_styles
                                    .validityNote.fontSize
                                ) * 0.65
                              )}px`,
                            }
                          : {}),
                        mb: 1,
                      }}
                    >
                      {displayedSnapshot.campaign.validity_note}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      bgcolor: "#1a0709",
                      border: "1px solid #d4af63",
                      color: "#fff",
                      p: 1.5,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: `'${
                          displayedSnapshot.campaign.text_styles?.ctaText
                            ?.fontFamily || displayedSnapshot.brand.heading_font
                        }', serif`,
                        color:
                          displayedSnapshot.campaign.text_styles?.ctaText
                            ?.color || "#f1cf85",
                        fontWeight:
                          displayedSnapshot.campaign.text_styles?.ctaText
                            ?.fontWeight || "bold",
                        fontStyle:
                          displayedSnapshot.campaign.text_styles?.ctaText
                            ?.fontStyle || "normal",
                        textTransform:
                          displayedSnapshot.campaign.text_styles?.ctaText
                            ?.textTransform || "none",
                        ...(Number(
                          displayedSnapshot.campaign.text_styles?.ctaText
                            ?.fontSize
                        ) > 0
                          ? {
                              fontSize: `${Math.round(
                                Number(
                                  displayedSnapshot.campaign.text_styles.ctaText
                                    .fontSize
                                ) * 0.65
                              )}px`,
                            }
                          : {}),
                      }}
                    >
                      {displayedSnapshot.campaign.cta_text ||
                        "BOOK YOUR APPOINTMENT NOW!"}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      📞 {displayedSnapshot.contact.phone} (Call/WhatsApp)
                      &bull; WhatsApp: {displayedSnapshot.contact.whatsapp}
                    </Typography>
                    <Typography variant="caption" display="block">
                      📍 {displayedSnapshot.contact.address}
                    </Typography>
                    {displayedSnapshot.campaign.show_qr_code && (
                      <Box
                        sx={{
                          mt: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 0.75,
                          borderRadius: 1,
                          bgcolor: "#fff",
                          color: "#1b080a",
                        }}
                      >
                        <Box
                          component="img"
                          src={
                            displayedSnapshot.campaign.qr_code_url ||
                            "/aspen-glow-QR-code.png"
                          }
                          alt="Scannable Booking QR Code"
                          sx={{ width: 52, height: 52, objectFit: "contain" }}
                        />
                        <Typography variant="caption" fontWeight="bold">
                          SCAN TO BOOK NOW!
                        </Typography>
                      </Box>
                    )}
                    {displayedSnapshot.campaign.footer_tagline && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{
                          fontFamily: `'${
                            displayedSnapshot.campaign.text_styles
                              ?.footerTagline?.fontFamily ||
                            displayedSnapshot.brand.heading_font
                          }', serif`,
                          color:
                            displayedSnapshot.campaign.text_styles
                              ?.footerTagline?.color || "#e05368",
                          fontWeight:
                            displayedSnapshot.campaign.text_styles
                              ?.footerTagline?.fontWeight || "bold",
                          fontStyle:
                            displayedSnapshot.campaign.text_styles
                              ?.footerTagline?.fontStyle || "normal",
                          textTransform:
                            displayedSnapshot.campaign.text_styles
                              ?.footerTagline?.textTransform || "none",
                          ...(Number(
                            displayedSnapshot.campaign.text_styles
                              ?.footerTagline?.fontSize
                          ) > 0
                            ? {
                                fontSize: `${Math.round(
                                  Number(
                                    displayedSnapshot.campaign.text_styles
                                      .footerTagline.fontSize
                                  ) * 0.65
                                )}px`,
                              }
                            : {}),
                          mt: 0.5,
                        }}
                      >
                        {displayedSnapshot.campaign.footer_tagline} ♥
                      </Typography>
                    )}
                  </Box>
                </Box>

                
              </CardContent>
            </Card>

            {/* Saved Poster Drafts Library */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  fontWeight="bold"
                  gutterBottom
                >
                  Saved Poster Drafts ({activeDraftPosters.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Each saved draft stores an immutable snapshot of your brand,
                  contact details, and package prices at the moment it was
                  saved.
                </Typography>

                {activeDraftPosters.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No saved poster drafts yet. Click &ldquo;Save Poster
                    Draft&rdquo; above to save your campaign.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {activeDraftPosters.map((poster) => {
                      const snap = poster.content_snapshot || {};
                      const offeringSummary = Array.isArray(snap.offerings)
                        ? snap.offerings
                            .map((o) => `${o.name} (${o.price_formatted})`)
                            .join(" • ")
                        : "";
                      return (
                        <Grid size={{ xs: 12 }} key={poster.id}>
                          <Card variant="outlined">
                            <CardContent sx={{ pb: 1 }}>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                flexWrap="wrap"
                                gap={1}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {poster.campaign_name}
                                </Typography>
                                <Box display="flex" gap={1}>
                                  <Chip
                                    label={snap.festival?.name || "Festival"}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={poster.format_key}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                              {offeringSummary && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ mt: 0.5 }}
                                >
                                  Snapshot Offerings: {offeringSummary}
                                </Typography>
                              )}
                            </CardContent>
                            <CardActions sx={{ px: 2, pb: 1.5 }}>
                              <Button
                                type="button"
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenSavedPoster(poster)}
                              >
                                Open Saved Snapshot {poster.campaign_name}
                              </Button>
                              <Button
                                type="button"
                                size="small"
                                color="warning"
                                onClick={() => setArchiveTarget(poster)}
                              >
                                Archive {poster.campaign_name}
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Add Custom Festival Dialog */}
      <Dialog
        open={festivalDialogOpen}
        onClose={() => !savingFestival && setFestivalDialogOpen(false)}
        aria-labelledby="add-festival-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="add-festival-dialog-title">
          Add Custom Festival
        </DialogTitle>
        <Box component="form" noValidate onSubmit={handleCreateFestival}>
          <DialogContent>
            {festivalFormError && (
              <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                {festivalFormError}
              </Alert>
            )}
            <TextField
              id="new-festival-name"
              label="Festival Name"
              fullWidth
              required
              margin="dense"
              value={newFestivalForm.name}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.name)}
              helperText={festivalFieldErrors.name}
              disabled={savingFestival}
            />
            <TextField
              id="new-festival-headline"
              label="Default Headline"
              fullWidth
              margin="dense"
              value={newFestivalForm.default_headline}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  default_headline: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.default_headline)}
              helperText={festivalFieldErrors.default_headline}
              disabled={savingFestival}
            />
            <TextField
              id="new-festival-motif"
              label="Motif Badge Text"
              fullWidth
              required
              margin="dense"
              value={newFestivalForm.motif_label}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  motif_label: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.motif_label)}
              helperText={festivalFieldErrors.motif_label}
              disabled={savingFestival}
            />
            <TextField
              id="new-festival-accent"
              label="Accent Color (Hex)"
              type="color"
              fullWidth
              required
              margin="dense"
              value={newFestivalForm.accent_color || "#c2185b"}
              onChange={(e) =>
                setNewFestivalForm((prev) => ({
                  ...prev,
                  accent_color: e.target.value,
                }))
              }
              error={Boolean(festivalFieldErrors.accent_color)}
              helperText={festivalFieldErrors.accent_color}
              disabled={savingFestival}
            />
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => setFestivalDialogOpen(false)}
              disabled={savingFestival}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingFestival}
            >
              {savingFestival ? "Saving..." : "Save Festival"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Archive Poster Draft Confirmation Dialog */}
      <Dialog
        open={Boolean(archiveTarget)}
        onClose={() => !archivingPoster && setArchiveTarget(null)}
        aria-labelledby="archive-poster-dialog-title"
      >
        <DialogTitle id="archive-poster-dialog-title">
          Archive Poster Draft?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Archiving <strong>{archiveTarget?.campaign_name}</strong> hides it
            from the active drafts list while keeping its historical snapshot
            record in the database.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            onClick={() => setArchiveTarget(null)}
            disabled={archivingPoster}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            color="warning"
            onClick={handleConfirmArchivePoster}
            disabled={archivingPoster}
          >
            {archivingPoster ? "Archiving..." : "Confirm Archive"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
