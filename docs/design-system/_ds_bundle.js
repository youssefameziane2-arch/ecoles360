/* @ds-bundle: {"format":3,"namespace":"Coles360DesignSystem_66e6db","components":[{"name":"CityCard","sourcePath":"components/cards/CityCard.jsx"},{"name":"EstablishmentCard","sourcePath":"components/cards/EstablishmentCard.jsx"},{"name":"PricingCard","sourcePath":"components/cards/PricingCard.jsx"},{"name":"RequestCard","sourcePath":"components/cards/RequestCard.jsx"},{"name":"ReviewCard","sourcePath":"components/cards/ReviewCard.jsx"},{"name":"StatCard","sourcePath":"components/cards/StatCard.jsx"},{"name":"BarChart","sourcePath":"components/charts/BarChart.jsx"},{"name":"SourceBars","sourcePath":"components/charts/SourceBars.jsx"},{"name":"ICONS","sourcePath":"components/core/Icon.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data/Badge.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"Pagination","sourcePath":"components/data/Pagination.jsx"},{"name":"PermissionToggle","sourcePath":"components/data/PermissionToggle.jsx"},{"name":"ProgressBar","sourcePath":"components/data/ProgressBar.jsx"},{"name":"Tag","sourcePath":"components/data/Tag.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"ProfileUnavailable","sourcePath":"components/feedback/ProfileUnavailable.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"SkeletonCard","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"BottomTabBar","sourcePath":"components/navigation/BottomTabBar.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Wordmark","sourcePath":"components/navigation/Header.jsx"},{"name":"Header","sourcePath":"components/navigation/Header.jsx"},{"name":"SidebarNav","sourcePath":"components/navigation/SidebarNav.jsx"},{"name":"Stepper","sourcePath":"components/navigation/Stepper.jsx"},{"name":"EquipmentItem","sourcePath":"components/profile/EquipmentItem.jsx"},{"name":"FaqAccordion","sourcePath":"components/profile/FaqAccordion.jsx"},{"name":"RatingBreakdown","sourcePath":"components/profile/RatingBreakdown.jsx"},{"name":"SocialLinks","sourcePath":"components/profile/SocialLinks.jsx"},{"name":"Tabs","sourcePath":"components/profile/Tabs.jsx"},{"name":"TeamMember","sourcePath":"components/profile/TeamMember.jsx"},{"name":"VideoEmbed","sourcePath":"components/profile/VideoEmbed.jsx"},{"name":"CitySelect","sourcePath":"components/search/CitySelect.jsx"},{"name":"FilterBar","sourcePath":"components/search/FilterBar.jsx"},{"name":"TypePicker","sourcePath":"components/search/TypePicker.jsx"}],"sourceHashes":{"components/cards/CityCard.jsx":"1998861f1aaf","components/cards/EstablishmentCard.jsx":"69d904fe46f6","components/cards/PricingCard.jsx":"6599aad8dd6e","components/cards/RequestCard.jsx":"d3016e86852a","components/cards/ReviewCard.jsx":"dd6615ae01bd","components/cards/StatCard.jsx":"6ede568b0829","components/charts/BarChart.jsx":"e61d4eb819db","components/charts/SourceBars.jsx":"6ad0325ad9a6","components/core/Icon.jsx":"808611c45262","components/data/Avatar.jsx":"008a21694b37","components/data/Badge.jsx":"54444e13cb2d","components/data/DataTable.jsx":"b952c0dd7330","components/data/Pagination.jsx":"e4df7d6bc283","components/data/PermissionToggle.jsx":"710cc9c29f4e","components/data/ProgressBar.jsx":"70840d4334de","components/data/Tag.jsx":"e665228c5e15","components/feedback/EmptyState.jsx":"90ff70532440","components/feedback/Modal.jsx":"3241a3fa66e1","components/feedback/ProfileUnavailable.jsx":"0ec732fb4684","components/feedback/Skeleton.jsx":"174eaa292f75","components/feedback/Toast.jsx":"c92bacc361dc","components/forms/Button.jsx":"722243db5ab7","components/forms/Checkbox.jsx":"979cd1e631d3","components/forms/Input.jsx":"a11dd84d784d","components/forms/Select.jsx":"d1a8ec4fbe6e","components/forms/Textarea.jsx":"56d08eb4c7a7","components/navigation/BottomTabBar.jsx":"2d49030c930f","components/navigation/Breadcrumb.jsx":"bc49a29704a1","components/navigation/Header.jsx":"8eb96e1481aa","components/navigation/SidebarNav.jsx":"6b8635031206","components/navigation/Stepper.jsx":"eccf614d56d6","components/profile/EquipmentItem.jsx":"5b4b43112503","components/profile/FaqAccordion.jsx":"347d1616807e","components/profile/RatingBreakdown.jsx":"21c4001a2f78","components/profile/SocialLinks.jsx":"b8956b38c6ad","components/profile/Tabs.jsx":"b7750ace37dc","components/profile/TeamMember.jsx":"40a1029513f2","components/profile/VideoEmbed.jsx":"69ef43e8affd","components/search/CitySelect.jsx":"4ae298fd3b7c","components/search/FilterBar.jsx":"0510b09c8627","components/search/TypePicker.jsx":"c94c8eaab4b1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.Coles360DesignSystem_66e6db = window.Coles360DesignSystem_66e6db || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/CityCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 CityCard — photo with a navy scrim and a count overlay.
 * Used in the "Explorer par ville" grid on the public homepage.
 */
function CityCard({
  city,
  count,
  image,
  height = 150,
  onClick,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    style: {
      position: 'relative',
      display: 'block',
      width: '100%',
      height,
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      textAlign: 'left',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      background: 'var(--surface-image)',
      ...style
    }
  }, rest), image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: city,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-navy)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 14,
      bottom: 12,
      right: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: `var(--fw-bold) var(--fs-h3)/1.1 var(--font-sans)`,
      color: '#fff'
    }
  }, city), count != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`,
      color: 'rgba(255,255,255,.82)',
      marginTop: 3
    }
  }, count, " \xE9tablissements") : null));
}
Object.assign(__ds_scope, { CityCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/CityCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PricingCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 PricingCard — credit pack / subscription tier.
 * "Populaire" variant gets a navy fill, red ribbon, and elevated emphasis.
 */
function PricingCard({
  name,
  price,
  unit = '',
  credits = null,
  features = [],
  popular = false,
  cta = 'Choisir',
  onSelect,
  style = {},
  ...rest
}) {
  const dark = popular;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      background: dark ? 'var(--surface-dark)' : 'var(--surface-card)',
      border: dark ? '1px solid var(--surface-dark)' : '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card-lg)',
      padding: '24px 22px',
      color: dark ? '#fff' : 'var(--text-primary)',
      ...style
    }
  }, rest), popular ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 16,
      right: 16,
      font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
      letterSpacing: '.4px',
      textTransform: 'uppercase',
      background: 'var(--action)',
      color: '#fff',
      borderRadius: 'var(--radius-badge)',
      padding: '5px 9px'
    }
  }, "Populaire") : null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-bold) var(--fs-h3)/1 var(--font-sans)`,
      color: dark ? '#fff' : 'var(--text-primary)',
      marginBottom: 12
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-extrabold) var(--fs-stat)/1 var(--font-sans)`,
      letterSpacing: 'var(--ls-tight)'
    }
  }, price), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-medium) var(--fs-sm)/1 var(--font-sans)`,
      color: dark ? 'var(--e360-navy-soft)' : 'var(--text-muted)'
    }
  }, unit) : null), credits != null ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      color: 'var(--action)',
      marginBottom: 16
    }
  }, credits, " cr\xE9dits") : /*#__PURE__*/React.createElement("div", {
    style: {
      height: 16
    }
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: '4px 0 20px',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      flex: 1
    }
  }, features.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      font: `var(--fw-regular) var(--fs-sm)/1.4 var(--font-sans)`,
      color: dark ? 'rgba(255,255,255,.86)' : 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: dark ? 'var(--action)' : 'var(--action-success)',
      fontWeight: 700
    }
  }, "\u2713"), f))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onSelect,
    style: {
      height: 46,
      width: '100%',
      border: 'none',
      borderRadius: 'var(--radius-control)',
      background: dark ? 'var(--action)' : 'var(--action-secondary)',
      color: '#fff',
      font: `var(--fw-semibold) var(--fs-body)/1 var(--font-sans)`,
      cursor: 'pointer'
    }
  }, cta));
}
Object.assign(__ds_scope, { PricingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PricingCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/ReviewCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 ReviewCard — a parent review with ★ rating, body, optional photos,
 * an establishment reply block, and a moderation status badge (admin/secrétaire).
 * Flagged reviews get a red-tinted border.
 */
function ReviewCard({
  author,
  date,
  rating = 5,
  body,
  reply = null,
  status = null,
  flagged = false,
  style = {},
  ...rest
}) {
  const stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
  const statusTones = {
    'Publié': {
      bg: 'var(--e360-green-tint)',
      fg: 'var(--e360-green)'
    },
    'En attente': {
      bg: 'var(--e360-amber-tint)',
      fg: 'var(--e360-amber-700)'
    },
    'Signalé': {
      bg: 'var(--e360-red-tint)',
      fg: 'var(--e360-red-700)'
    },
    'Rejeté': {
      bg: 'var(--surface-sunken)',
      fg: 'var(--text-secondary)'
    }
  };
  const st = status ? statusTones[status] || statusTones['En attente'] : null;
  const initials = (author || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: `1px solid ${flagged ? '#F3C9CD' : 'var(--border-hairline)'}`,
      borderRadius: 'var(--radius-card)',
      padding: 16,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      flex: 'none',
      borderRadius: '50%',
      background: 'var(--e360-navy-tint)',
      color: 'var(--e360-navy)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`
    }
  }, initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-semibold) var(--fs-sm)/1.2 var(--font-sans)`,
      color: 'var(--text-primary)'
    }
  }, author), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, date)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--rating)',
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      letterSpacing: '1px'
    }
  }, stars)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: `var(--fw-regular) var(--fs-sm)/1.5 var(--font-sans)`,
      color: 'var(--text-body)'
    }
  }, body), reply ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-control-lg)',
      padding: '11px 13px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-semibold) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--action-secondary)',
      marginBottom: 5
    }
  }, "\u21A9 R\xE9ponse de l'\xE9tablissement"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1.5 var(--font-sans)`,
      color: 'var(--text-body)'
    }
  }, reply)) : null, st ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`,
      background: st.bg,
      color: st.fg,
      borderRadius: 'var(--radius-badge)',
      padding: '4px 9px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: st.fg
    }
  }), status)) : null);
}
Object.assign(__ds_scope, { ReviewCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ReviewCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 StatCard — dashboard KPI: big numeral, label, optional delta vs
 * previous period (green up / red down), and a leading icon chip.
 */
function StatCard({
  label,
  value,
  delta = null,
  deltaDir = 'up',
  icon = null,
  tone = 'navy',
  style = {},
  ...rest
}) {
  const chipTones = {
    navy: {
      bg: 'var(--e360-navy-tint)',
      fg: 'var(--e360-navy)'
    },
    red: {
      bg: 'var(--e360-red-tint)',
      fg: 'var(--e360-red-700)'
    },
    green: {
      bg: 'var(--e360-green-tint)',
      fg: 'var(--e360-green)'
    },
    amber: {
      bg: 'var(--e360-amber-tint)',
      fg: 'var(--e360-amber-700)'
    }
  };
  const c = chipTones[tone] || chipTones.navy;
  const up = deltaDir === 'up';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card-lg)',
      padding: 'var(--pad-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      color: 'var(--text-secondary)'
    }
  }, label), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 'var(--radius-control-lg)',
      background: c.bg,
      color: c.fg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16
    }
  }, icon) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-extrabold) var(--fs-stat)/1 var(--font-sans)`,
      letterSpacing: 'var(--ls-tight)',
      color: 'var(--text-primary)'
    }
  }, value), delta != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-semibold) var(--fs-xs)/1 var(--font-sans)`,
      color: up ? 'var(--action-success)' : 'var(--action)'
    }
  }, up ? '▲' : '▼', " ", delta) : null));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/charts/BarChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 BarChart — flat vertical bars (e.g. monthly views/contacts).
 * The current/highlighted bar is red; the rest are navy-tinted. CSS only.
 * data: [{ label, value }]. `currentIndex` highlights one bar (default last).
 */
function BarChart({
  data = [],
  currentIndex = -1,
  height = 180,
  valueFormat = v => v,
  style = {},
  ...rest
}) {
  const max = Math.max(1, ...data.map(d => d.value));
  const current = currentIndex < 0 ? data.length - 1 : currentIndex;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 10,
      height
    }
  }, data.map((d, i) => {
    const on = i === current;
    const h = Math.round(d.value / max * (height - 26));
    return /*#__PURE__*/React.createElement("div", {
      key: d.label + i,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        height: '100%',
        justifyContent: 'flex-end'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
        color: on ? 'var(--action)' : 'var(--text-muted)'
      }
    }, valueFormat(d.value)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        maxWidth: 38,
        height: h,
        background: on ? 'var(--action)' : 'var(--e360-navy-tint)',
        borderRadius: '6px 6px 0 0',
        transition: 'height .3s ease'
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 8
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: d.label + i,
    style: {
      flex: 1,
      textAlign: 'center',
      font: `${i === current ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-xs)/1 var(--font-sans)`,
      color: i === current ? 'var(--text-primary)' : 'var(--text-muted)'
    }
  }, d.label))));
}
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/SourceBars.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 SourceBars — horizontal breakdown of where contacts come from
 * (WhatsApp, Appel, Formulaire, Fiche…). Labeled rows with value + share bar.
 * data: [{ label, value, tone? }]. Tones default to a rotating brand set.
 */
function SourceBars({
  data = [],
  showShare = true,
  style = {},
  ...rest
}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const toneColors = {
    green: 'var(--action-success)',
    navy: 'var(--action-secondary)',
    red: 'var(--action)',
    amber: 'var(--e360-amber)'
  };
  const rotation = ['green', 'navy', 'amber', 'red'];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      ...style
    }
  }, rest), data.map((d, i) => {
    const pct = d.value / total * 100;
    const color = toneColors[d.tone || rotation[i % rotation.length]];
    return /*#__PURE__*/React.createElement("div", {
      key: d.label + i
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: `var(--fw-medium) var(--fs-sm)/1 var(--font-sans)`,
        color: 'var(--text-body)'
      }
    }, d.label), /*#__PURE__*/React.createElement("span", {
      style: {
        font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`,
        color: 'var(--text-primary)'
      }
    }, d.value, showShare ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`,
        color: 'var(--text-muted)',
        marginLeft: 6
      }
    }, Math.round(pct), "%") : null)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: 9,
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: `${pct}%`,
        height: '100%',
        background: color,
        borderRadius: 'var(--radius-pill)',
        transition: 'width .3s ease'
      }
    })));
  }));
}
Object.assign(__ds_scope, { SourceBars });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/SourceBars.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Icon — Lucide-style line icons (24×24, 2px stroke, round caps).
 * Single source for iconography across the system. Pass `name` from the set
 * below; pair with `size`, `color` (defaults to currentColor) and `strokeWidth`.
 * Replaces the emoji placeholders used in early components.
 *
 * Icon paths are derived from Lucide (ISC license). To add an icon, drop its
 * Lucide path data into PATHS.
 */
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'graduation-cap': '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  baby: '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M17 5a4.5 4.5 0 0 0-5 0"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M10.27 21a2 2 0 0 0 3.46 0"/><path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  'bar-chart': '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.98-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
};
const SOLID = {
  star: true,
  heart: true
};
function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  fill,
  style = {},
  ...rest
}) {
  const path = ICONS[name];
  const resolvedFill = fill != null ? fill : SOLID[name] ? 'currentColor' : 'none';
  if (!path) {
    if (typeof console !== 'undefined') console.warn(`Icon: unknown name "${name}"`);
    return null;
  }
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: resolvedFill,
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      display: 'inline-block',
      flex: 'none',
      verticalAlign: 'middle',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: path
    }
  }, rest));
}
Object.assign(__ds_scope, { ICONS, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/cards/EstablishmentCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 EstablishmentCard — the core result/listing card.
 * Sponsored cards carry a 4px red left border + "Sponsorisé" badge.
 * Verified shows a green "✓ Vérifié" badge. ★ rating in amber.
 * layout="grid" (image on top) or "row" (image left, actions right).
 */
function EstablishmentCard({
  name,
  city,
  type,
  rating,
  reviews,
  image,
  sponsored = false,
  verified = false,
  price = null,
  tags = [],
  layout = 'grid',
  onCall,
  onWhatsApp,
  onView,
  style = {},
  ...rest
}) {
  const Stars = () => /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      color: 'var(--rating)',
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "star",
    size: 14
  }), " ", rating), reviews != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`
    }
  }, "(", reviews, " avis)") : null);
  const badges = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, sponsored ? /*#__PURE__*/React.createElement("span", {
    style: chip('var(--e360-red-tint)', 'var(--e360-red-700)')
  }, "Sponsoris\xE9") : null, verified ? /*#__PURE__*/React.createElement("span", {
    style: chip('var(--e360-green-tint)', 'var(--e360-green)')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 12
  }), " V\xE9rifi\xE9") : null);
  const actions = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCall,
    style: actionBtn('var(--action-secondary)', '#fff')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "phone",
    size: 16
  }), " Appeler"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onWhatsApp,
    style: actionBtn('var(--action-success)', '#fff')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "message-circle",
    size: 16
  }), " WhatsApp"));
  const wrap = {
    display: 'flex',
    flexDirection: layout === 'row' ? 'row' : 'column',
    gap: layout === 'row' ? 18 : 0,
    alignItems: layout === 'row' ? 'center' : 'stretch',
    background: 'var(--surface-card)',
    border: '1px solid var(--border-hairline)',
    borderLeft: sponsored ? '4px solid var(--action)' : '1px solid var(--border-hairline)',
    borderRadius: 'var(--radius-card)',
    overflow: 'hidden',
    padding: layout === 'row' ? 16 : 0,
    ...style
  };
  const img = /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      width: layout === 'row' ? 150 : '100%',
      height: layout === 'row' ? 104 : 140,
      background: 'var(--surface-image)',
      borderRadius: layout === 'row' ? 'var(--radius-control-lg)' : 0,
      position: 'relative',
      overflow: 'hidden'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : null, layout === 'grid' ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10
    }
  }, badges) : null);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: wrap
  }, rest), img, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: layout === 'row' ? 0 : 14,
      minWidth: 0
    }
  }, layout === 'row' ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 6
    }
  }, badges) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-bold) var(--fs-h3)/1.25 var(--font-sans)`,
      color: 'var(--text-primary)',
      marginBottom: 3
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--text-muted)',
      marginBottom: 9
    }
  }, city, type ? ` · ${type}` : ''), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 11,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Stars, null), price ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`,
      color: 'var(--text-body)'
    }
  }, price) : null), tags.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 11
    }
  }, tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--text-secondary)',
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-pill)',
      padding: '5px 10px'
    }
  }, t))) : null, actions, onView ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onView,
    style: {
      ...ghostBtn,
      marginTop: 7,
      width: '100%'
    }
  }, "Voir la fiche") : null));
}
function chip(bg, fg) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`,
    background: bg,
    color: fg,
    borderRadius: 'var(--radius-badge)',
    padding: '4px 8px',
    whiteSpace: 'nowrap'
  };
}
function actionBtn(bg, fg) {
  return {
    flex: 1,
    height: 40,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: bg,
    color: fg,
    border: 'none',
    borderRadius: 'var(--radius-control)',
    font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
    cursor: 'pointer'
  };
}
const ghostBtn = {
  height: 38,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-control)',
  borderRadius: 'var(--radius-control)',
  font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
  cursor: 'pointer'
};
Object.assign(__ds_scope, { EstablishmentCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/EstablishmentCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/RequestCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 RequestCard — an inbound contact request in the établissement /
 * secrétaire inbox. Shows requester, channel, message preview, time, and a
 * status badge: Nouveau (red), En cours (amber), Traité (green).
 */
function RequestCard({
  name,
  channel = 'Formulaire',
  message,
  time,
  status = 'Nouveau',
  onOpen,
  style = {},
  ...rest
}) {
  const tones = {
    'Nouveau': {
      bg: 'var(--e360-red-tint)',
      fg: 'var(--e360-red-700)'
    },
    'En cours': {
      bg: 'var(--e360-amber-tint)',
      fg: 'var(--e360-amber-700)'
    },
    'Traité': {
      bg: 'var(--e360-green-tint)',
      fg: 'var(--e360-green)'
    }
  };
  const t = tones[status] || tones['Nouveau'];
  const initials = (name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const channelIcon = {
    'WhatsApp': 'message-circle',
    'Appel': 'phone',
    'Formulaire': 'mail',
    'Email': 'mail'
  }[channel] || 'mail';
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onOpen,
    style: {
      display: 'flex',
      gap: 13,
      alignItems: 'flex-start',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      padding: 15,
      cursor: onOpen ? 'pointer' : 'default',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      flex: 'none',
      borderRadius: '50%',
      background: 'var(--e360-navy-tint)',
      color: 'var(--e360-navy)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`
    }
  }, initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-semibold) var(--fs-sm)/1.2 var(--font-sans)`,
      color: 'var(--text-primary)'
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--text-muted)',
      flex: 'none'
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--text-muted)',
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: channelIcon,
    size: 13
  }), " ", channel), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: `var(--fw-regular) var(--fs-sm)/1.45 var(--font-sans)`,
      color: 'var(--text-body)',
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical'
    }
  }, message), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`,
      background: t.bg,
      color: t.fg,
      borderRadius: 'var(--radius-badge)',
      padding: '4px 9px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.fg
    }
  }), status))));
}
Object.assign(__ds_scope, { RequestCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/RequestCard.jsx", error: String((e && e.message) || e) }); }

// components/data/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Avatar — monogram in a colored circle, or a photo.
 * Color is derived deterministically from the name so the same person is stable.
 */
const PALETTE = [{
  bg: 'var(--e360-navy-tint)',
  fg: 'var(--e360-navy)'
}, {
  bg: 'var(--e360-red-tint)',
  fg: 'var(--e360-red-700)'
}, {
  bg: 'var(--e360-green-tint)',
  fg: 'var(--e360-green)'
}, {
  bg: 'var(--e360-amber-tint)',
  fg: 'var(--e360-amber-700)'
}];
function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function Avatar({
  name = '',
  src = null,
  size = 40,
  style = {},
  ...rest
}) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  const c = PALETTE[idx];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      width: size,
      height: size,
      borderRadius: 'var(--radius-round)',
      overflow: 'hidden',
      background: src ? 'var(--surface-image)' : c.bg,
      color: c.fg,
      font: `var(--fw-bold) ${Math.round(size * 0.36)}px/1 var(--font-sans)`,
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 status Badge. Soft-tint pill for statuses: Sponsorisé, Vérifié,
 * Nouveau, En cours, Traité, Payée, Solde bas, etc.
 * Tones map to the brand semantic palette.
 */
function Badge({
  children,
  tone = 'navy',
  solid = false,
  dot = false,
  icon = null,
  style = {},
  ...rest
}) {
  const tones = {
    red: {
      tint: 'var(--e360-red-tint)',
      fg: 'var(--e360-red-700)',
      solidBg: 'var(--action)'
    },
    navy: {
      tint: 'var(--e360-navy-tint)',
      fg: 'var(--e360-navy)',
      solidBg: 'var(--action-secondary)'
    },
    green: {
      tint: 'var(--e360-green-tint)',
      fg: 'var(--e360-green)',
      solidBg: 'var(--action-success)'
    },
    amber: {
      tint: 'var(--e360-amber-tint)',
      fg: 'var(--e360-amber-700)',
      solidBg: 'var(--e360-amber)'
    },
    grey: {
      tint: 'var(--surface-sunken)',
      fg: 'var(--text-secondary)',
      solidBg: 'var(--text-secondary)'
    }
  };
  const t = tones[tone] || tones.navy;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 9px',
      font: `var(--fw-semibold) var(--fs-2xs)/1 var(--font-sans)`,
      letterSpacing: '.1px',
      borderRadius: 'var(--radius-badge)',
      background: solid ? t.solidBg : t.tint,
      color: solid ? '#fff' : t.fg,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: solid ? '#fff' : t.fg
    }
  }) : null, icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 DataTable. Uppercase hairline headers, hairline row separators,
 * no shadow. Below `stackAt` (px) it collapses into stacked label/value cards
 * (the wireframe's "tableaux → cartes empilées" rule).
 *
 * columns: [{ key, header, width?, align?, render?(row) }]
 * rows: array of objects
 */
function DataTable({
  columns = [],
  rows = [],
  stackAt = 720,
  rowKey = 'id',
  style = {},
  ...rest
}) {
  const [stacked, setStacked] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width:${stackAt}px)`);
    const apply = () => setStacked(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [stackAt]);
  const cellVal = (col, row) => col.render ? col.render(row) : row[col.key];
  if (stacked) {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...style
      }
    }, rest), rows.map((row, i) => /*#__PURE__*/React.createElement("div", {
      key: row[rowKey] ?? i,
      style: {
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-card)',
        padding: 14,
        background: 'var(--surface-card)'
      }
    }, columns.map(col => /*#__PURE__*/React.createElement("div", {
      key: col.key,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 14,
        padding: '5px 0',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
        letterSpacing: '.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)'
      }
    }, col.header), /*#__PURE__*/React.createElement("span", {
      style: {
        font: 'var(--text-default)',
        color: 'var(--text-body)',
        textAlign: 'right'
      }
    }, cellVal(col, row)))))));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      background: 'var(--surface-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(col => /*#__PURE__*/React.createElement("th", {
    key: col.key,
    style: {
      textAlign: col.align || 'left',
      width: col.width,
      padding: '13px 18px',
      borderBottom: '1px solid var(--border-hairline)',
      font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
      letterSpacing: '.5px',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, col.header)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, i) => /*#__PURE__*/React.createElement("tr", {
    key: row[rowKey] ?? i
  }, columns.map(col => /*#__PURE__*/React.createElement("td", {
    key: col.key,
    style: {
      textAlign: col.align || 'left',
      padding: '13px 18px',
      borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--surface-sunken)',
      font: 'var(--text-default)',
      color: 'var(--text-body)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, cellVal(col, row))))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/Pagination.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Pagination — page numbers with prev/next. Active page in red.
 * Compact, hairline buttons matching the data tables.
 */
function Pagination({
  page = 1,
  pageCount = 1,
  onChange,
  style = {},
  ...rest
}) {
  const go = p => {
    if (p >= 1 && p <= pageCount && p !== page) onChange && onChange(p);
  };
  const pages = [];
  const add = p => pages.push(p);
  add(1);
  const lo = Math.max(2, page - 1);
  const hi = Math.min(pageCount - 1, page + 1);
  if (lo > 2) add('…');
  for (let p = lo; p <= hi; p++) add(p);
  if (hi < pageCount - 1) add('…');
  if (pageCount > 1) add(pageCount);
  const cell = (extra = {}) => ({
    minWidth: 36,
    height: 36,
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
    border: '1px solid var(--border-control)',
    borderRadius: 'var(--radius-control)',
    background: '#fff',
    color: 'var(--text-body)',
    cursor: 'pointer',
    ...extra
  });
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => go(page - 1),
    disabled: page <= 1,
    style: cell({
      opacity: page <= 1 ? 0.4 : 1,
      cursor: page <= 1 ? 'not-allowed' : 'pointer'
    })
  }, "\u2039"), pages.map((p, i) => p === '…' ? /*#__PURE__*/React.createElement("span", {
    key: `e${i}`,
    style: {
      color: 'var(--text-muted)',
      padding: '0 2px'
    }
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
    key: p,
    type: "button",
    onClick: () => go(p),
    style: cell(p === page ? {
      background: 'var(--action)',
      borderColor: 'var(--action)',
      color: '#fff'
    } : {})
  }, p)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => go(page + 1),
    disabled: page >= pageCount,
    style: cell({
      opacity: page >= pageCount ? 0.4 : 1,
      cursor: page >= pageCount ? 'not-allowed' : 'pointer'
    })
  }, "\u203A"));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/data/PermissionToggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 PermissionToggle — labeled switch row used in the secrétaire
 * permissions panel and admin settings. Red when on.
 */
function PermissionToggle({
  label,
  description = '',
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  style = {},
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isCtrl = checked !== undefined;
  const on = isCtrl ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isCtrl) setInternal(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, rest), label || description ? /*#__PURE__*/React.createElement("div", null, label ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-semibold) var(--fs-body)/1.3 var(--font-sans)`,
      color: 'var(--text-primary)'
    }
  }, label) : null, description ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1.4 var(--font-sans)`,
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, description) : null) : null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": on,
    onClick: toggle,
    disabled: disabled,
    style: {
      flex: 'none',
      position: 'relative',
      width: 44,
      height: 26,
      padding: 0,
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      background: on ? 'var(--action)' : 'var(--border-strong)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background .18s ease'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 21 : 3,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 2px rgba(26,26,26,.25)',
      transition: 'left .18s ease'
    }
  })));
}
Object.assign(__ds_scope, { PermissionToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/PermissionToggle.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 ProgressBar — flat track with a colored fill. Used for the credits
 * gauge ("Solde de crédits"), profile completeness, rating distribution rows.
 */
function ProgressBar({
  value = 0,
  max = 100,
  tone = 'red',
  height = 8,
  label = null,
  showValue = false,
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const tones = {
    red: 'var(--action)',
    navy: 'var(--action-secondary)',
    green: 'var(--action-success)',
    amber: 'var(--e360-amber)'
  };
  const fill = tones[tone] || tones.red;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), label || showValue ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 7
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      color: 'var(--text-body)'
    }
  }, label) : /*#__PURE__*/React.createElement("span", null), showValue ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`,
      color: 'var(--text-primary)'
    }
  }, Math.round(pct), "%") : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height,
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-pill)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      background: fill,
      borderRadius: 'var(--radius-pill)',
      transition: 'width .3s ease'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Tag — filière / subject chip. Neutral pill on sunken background.
 * Removable variant shows a ✕. Use for "Bilingue", "Sciences", "Internat", etc.
 */
function Tag({
  children,
  removable = false,
  onRemove,
  active = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 11px',
      font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`,
      borderRadius: 'var(--radius-pill)',
      background: active ? 'var(--e360-navy-tint)' : 'var(--surface-sunken)',
      color: active ? 'var(--e360-navy)' : 'var(--text-secondary)',
      border: active ? '1px solid transparent' : '1px solid transparent',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children, removable ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRemove,
    "aria-label": "Retirer",
    style: {
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      cursor: 'pointer',
      padding: 0,
      fontSize: 12,
      lineHeight: 1,
      opacity: .7
    }
  }, "\u2715") : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 EmptyState — centered placeholder for empty lists, no search
 * results, empty inbox. Icon in a soft circle, title, description, optional CTA.
 */
function EmptyState({
  icon = 'inbox',
  title,
  description = '',
  action = null,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '44px 24px',
      gap: 6,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 60,
      height: 60,
      borderRadius: '50%',
      background: 'var(--surface-sunken)',
      color: 'var(--text-muted)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 28
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-bold) var(--fs-h3)/1.3 var(--font-sans)`,
      color: 'var(--text-primary)'
    }
  }, title), description ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-sm)/1.5 var(--font-sans)`,
      color: 'var(--text-muted)',
      maxWidth: 340
    }
  }, description) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Modal — centered dialog over a navy scrim. Header with title + close,
 * body, and an optional footer actions row. Closes on backdrop click / Esc.
 * Render conditionally or pass `open`.
 */
function Modal({
  open = true,
  title,
  children,
  footer = null,
  onClose,
  width = 480,
  style = {},
  ...rest
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(21,35,58,.55)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      animation: 'e360-fade-in var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: width,
      maxHeight: '90vh',
      overflow: 'auto',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card-lg)',
      boxShadow: 'var(--shadow-pop)',
      animation: 'e360-pop-in var(--dur-slow) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '18px 20px',
      borderBottom: '1px solid var(--border-hairline)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-bold) var(--fs-h2)/1.2 var(--font-sans)`,
      letterSpacing: 'var(--ls-h2)',
      color: 'var(--text-primary)'
    }
  }, title), onClose ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Fermer",
    style: {
      flex: 'none',
      width: 34,
      height: 34,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      background: 'transparent',
      borderRadius: 'var(--radius-control)',
      cursor: 'pointer',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 20
  })) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      font: 'var(--text-default)',
      color: 'var(--text-body)'
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '14px 20px',
      borderTop: '1px solid var(--border-hairline)',
      background: 'var(--surface-sunken)'
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProfileUnavailable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 ProfileUnavailable — shown over an establishment profile when its
 * page is temporarily offline ("en mise à jour"). Centered card with an icon
 * badge, title, message, optional image slot, and two CTAs (search another /
 * contact). Render as a full-screen overlay (`overlay`, default) that blurs the
 * profile behind it, or inline (`overlay={false}`) inside a container.
 */
function ProfileUnavailable({
  title = 'Cet établissement est temporairement en mise à jour',
  message = 'La page de cet établissement est en cours de mise à jour sur notre plateforme.',
  note = "Merci pour votre compréhension. N'hésitez pas à nous contacter pour plus d'informations.",
  image = null,
  searchLabel = 'Rechercher un autre établissement',
  contactLabel = 'Nous contacter',
  onSearch,
  onContact,
  overlay = true,
  style = {},
  ...rest
}) {
  const card = /*#__PURE__*/React.createElement("div", {
    role: "alertdialog",
    "aria-label": title,
    style: {
      width: '100%',
      maxWidth: 520,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-card-lg)',
      boxShadow: overlay ? 'var(--shadow-pop)' : 'none',
      border: overlay ? 'none' : '1px solid var(--border-hairline)',
      padding: '34px 30px',
      textAlign: 'center',
      animation: overlay ? 'e360-pop-in var(--dur-slow) var(--ease-out)' : 'none',
      ...(!overlay ? style : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 64,
      height: 64,
      borderRadius: '50%',
      background: 'var(--e360-navy-tint)',
      color: 'var(--action-secondary)',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "settings",
    size: 30
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 10px',
      font: `var(--fw-extrabold) var(--fs-h1)/1.2 var(--font-sans)`,
      letterSpacing: 'var(--ls-h1)',
      color: 'var(--text-primary)',
      textWrap: 'balance'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 auto',
      maxWidth: 380,
      font: `var(--fw-regular) var(--fs-body-lg)/1.5 var(--font-sans)`,
      color: 'var(--text-secondary)'
    }
  }, message), image !== false ? /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '22px 0',
      height: 150,
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      background: 'var(--surface-image)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-placeholder)'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "building",
    size: 40
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: 22
    }
  }), note ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      justifyContent: 'center',
      textAlign: 'left',
      maxWidth: 420,
      margin: '0 auto 22px',
      font: `var(--fw-regular) var(--fs-sm)/1.5 var(--font-sans)`,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      color: 'var(--action-secondary)',
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "info",
    size: 16
  })), /*#__PURE__*/React.createElement("span", null, note)) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onSearch,
    style: btn('var(--action)', '#fff')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 17
  }), " ", searchLabel), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onContact,
    style: btn('var(--action-success)', '#fff')
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "message-circle",
    size: 17
  }), " ", contactLabel)));
  if (!overlay) return card;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'rgba(21,35,58,.38)',
      backdropFilter: 'blur(6px)',
      animation: 'e360-fade-in var(--dur-base) var(--ease-out)',
      ...style
    }
  }, rest), card);
}
function btn(bg, fg) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    padding: '0 20px',
    border: 'none',
    borderRadius: 'var(--radius-control-lg)',
    background: bg,
    color: fg,
    cursor: 'pointer',
    font: `var(--fw-semibold) var(--fs-body)/1 var(--font-sans)`,
    whiteSpace: 'nowrap'
  };
}
Object.assign(__ds_scope, { ProfileUnavailable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProfileUnavailable.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Skeleton — loading placeholder with a subtle left-to-right shimmer.
 * variant: "text" (rounded line), "rect" (block), "circle" (avatar).
 * Compose several to mirror the real layout while data loads.
 */
function Skeleton({
  variant = 'rect',
  width,
  height,
  radius,
  style = {},
  ...rest
}) {
  const base = {
    text: {
      width: width || '100%',
      height: height || 12,
      radius: 'var(--radius-badge)'
    },
    rect: {
      width: width || '100%',
      height: height || 80,
      radius: 'var(--radius-card)'
    },
    circle: {
      width: width || 40,
      height: height || width || 40,
      radius: '50%'
    }
  }[variant] || {};
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    style: {
      display: 'block',
      width: base.width,
      height: base.height,
      borderRadius: radius || base.radius,
      background: 'linear-gradient(90deg, var(--surface-sunken) 25%, var(--e360-bg-2) 37%, var(--surface-sunken) 63%)',
      backgroundSize: '400% 100%',
      animation: 'e360-shimmer 1.4s ease-in-out infinite',
      ...style
    }
  }, rest));
}

/** Pre-composed skeleton mirroring an EstablishmentCard. */
function SkeletonCard({
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    variant: "rect",
    height: 140,
    radius: 0
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    variant: "text",
    width: "70%",
    height: 14
  }), /*#__PURE__*/React.createElement(Skeleton, {
    variant: "text",
    width: "45%"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    variant: "rect",
    width: "50%",
    height: 38,
    radius: "var(--radius-control)"
  }), /*#__PURE__*/React.createElement(Skeleton, {
    variant: "rect",
    width: "50%",
    height: 38,
    radius: "var(--radius-control)"
  }))));
}
Object.assign(__ds_scope, { Skeleton, SkeletonCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Toast — transient notification. Tones: success / error / info /
 * warning, each with a tinted icon. Optional dismiss. White card, flat shadow,
 * left accent bar in the tone color.
 */
function Toast({
  tone = 'success',
  title,
  message,
  onClose,
  style = {},
  ...rest
}) {
  const tones = {
    success: {
      icon: 'check-circle',
      fg: 'var(--e360-green)',
      bg: 'var(--e360-green-tint)'
    },
    error: {
      icon: 'alert-circle',
      fg: 'var(--e360-red-700)',
      bg: 'var(--e360-red-tint)'
    },
    info: {
      icon: 'info',
      fg: 'var(--e360-navy)',
      bg: 'var(--e360-navy-tint)'
    },
    warning: {
      icon: 'alert-triangle',
      fg: 'var(--e360-amber-700)',
      bg: 'var(--e360-amber-tint)'
    }
  };
  const t = tones[tone] || tones.success;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      minWidth: 300,
      maxWidth: 420,
      padding: '13px 14px',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-control-lg)',
      borderLeft: `3px solid ${t.fg}`,
      boxShadow: 'var(--shadow-card)',
      animation: 'e360-toast-in var(--dur-slow) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: t.bg,
      color: t.fg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      paddingTop: 1
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-semibold) var(--fs-sm)/1.3 var(--font-sans)`,
      color: 'var(--text-primary)'
    }
  }, title) : null, message ? /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1.45 var(--font-sans)`,
      color: 'var(--text-secondary)',
      marginTop: title ? 2 : 0
    }
  }, message) : null), onClose ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    "aria-label": "Fermer",
    style: {
      flex: 'none',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      padding: 2
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Button.
 * Variants: primary (red CTA), navy (secondary), success (WhatsApp/green),
 * outline, ghost. Red is the only accent — use it for the single key action.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  icon = null,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      height: 36,
      padding: '0 14px',
      font: 'var(--fs-sm)',
      radius: 'var(--radius-control)'
    },
    md: {
      height: 42,
      padding: '0 18px',
      font: 'var(--fs-body)',
      radius: 'var(--radius-control)'
    },
    lg: {
      height: 50,
      padding: '0 24px',
      font: 'var(--fs-body-lg)',
      radius: 'var(--radius-control-lg)'
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'var(--action)',
      color: '#fff',
      border: '1px solid transparent'
    },
    navy: {
      background: 'var(--action-secondary)',
      color: '#fff',
      border: '1px solid transparent'
    },
    success: {
      background: 'var(--action-success)',
      color: '#fff',
      border: '1px solid transparent'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent'
    }
  };
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: s.height,
      minHeight: size === 'lg' ? 'var(--touch-min)' : undefined,
      padding: s.padding,
      font: `var(--fw-semibold) ${s.font}/1 var(--font-sans)`,
      letterSpacing: '.1px',
      borderRadius: s.radius,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'filter .15s ease, transform .05s ease',
      whiteSpace: 'nowrap',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'translateY(0)';
    },
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: '1.05em'
    }
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 checkbox. Red when checked, hairline square when not.
 */
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style = {},
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isCtrl = checked !== undefined;
  const on = isCtrl ? checked : internal;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      font: 'var(--text-default)',
      color: 'var(--text-body)',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: e => {
      if (!isCtrl) setInternal(e.target.checked);
      onChange && onChange(e);
    },
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 20,
      height: 20,
      borderRadius: 'var(--radius-badge)',
      border: on ? '1px solid var(--action)' : '1px solid var(--border-control)',
      background: on ? 'var(--action)' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 13,
      transition: 'background .12s ease, border-color .12s ease'
    }
  }, on ? '✓' : ''), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)'
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 text input. Hairline border, 10px radius, optional leading icon,
 * error state in red. Labels sit above; required marker is red.
 */
function Input({
  label,
  required = false,
  placeholder = '',
  value,
  defaultValue,
  type = 'text',
  icon = null,
  error = '',
  disabled = false,
  onChange,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'var(--action)' : focused ? 'var(--action-secondary)' : 'var(--border-control)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      font: 'var(--text-default)',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-body)',
      marginBottom: 7
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--action)',
      marginLeft: 4
    }
  }, "*") : null) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 48,
      padding: '0 14px',
      background: disabled ? 'var(--surface-sunken)' : '#fff',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-control-lg)',
      boxShadow: focused && !error ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease'
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)'
    }
  }, icon) : null, /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--text-default)',
      color: 'var(--text-primary)'
    }
  }, rest))), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-xs)',
      color: 'var(--action)',
      marginTop: 5
    }
  }, error) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 select. Native <select> styled to match Input, with a chevron.
 * Used for City (required), sort order, filière, etc.
 */
function Select({
  label,
  required = false,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = 'Choisir…',
  icon = null,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      font: 'var(--text-default)',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-body)',
      marginBottom: 7
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--action)',
      marginLeft: 4
    }
  }, "*") : null) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 48,
      padding: '0 14px',
      background: disabled ? 'var(--surface-sunken)' : '#fff',
      border: `1px solid ${focused ? 'var(--action-secondary)' : 'var(--border-control)'}`,
      borderRadius: 'var(--radius-control-lg)',
      boxShadow: focused ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease'
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)'
    }
  }, icon) : null, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      appearance: 'none',
      WebkitAppearance: 'none',
      font: 'var(--text-default)',
      color: value || defaultValue ? 'var(--text-primary)' : 'var(--text-muted)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, rest), placeholder ? /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder) : null, opts.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      pointerEvents: 'none',
      color: 'var(--text-muted)',
      fontSize: 12
    }
  }, "\u2304")));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** écoles360 textarea. Matches Input styling; multiline. */
function Textarea({
  label,
  required = false,
  placeholder = '',
  value,
  defaultValue,
  rows = 4,
  disabled = false,
  onChange,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      font: 'var(--text-default)',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-sm)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text-body)',
      marginBottom: 7
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--action)',
      marginLeft: 4
    }
  }, "*") : null) : null, /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      width: '100%',
      resize: 'vertical',
      padding: '12px 14px',
      background: disabled ? 'var(--surface-sunken)' : '#fff',
      border: `1px solid ${focused ? 'var(--action-secondary)' : 'var(--border-control)'}`,
      borderRadius: 'var(--radius-control-lg)',
      boxShadow: focused ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
      font: 'var(--text-default)',
      color: 'var(--text-primary)',
      outline: 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease'
    }
  }, rest)));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomTabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 BottomTabBar — fixed mobile tab bar. Active tab in red.
 * items: [{ key, label, icon, count? }]. ≥44px touch targets.
 */
function BottomTabBar({
  items = [],
  activeKey,
  onSelect,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--surface-card)',
      borderTop: '1px solid var(--border-hairline)',
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
      ...style
    }
  }, rest), items.map(it => {
    const active = it.key === activeKey;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      type: "button",
      onClick: () => onSelect && onSelect(it.key),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        minHeight: 56,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: active ? 'var(--action)' : 'var(--text-muted)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        fontSize: 19,
        lineHeight: 1
      }
    }, it.icon, it.count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -5,
        right: -10,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--action)',
        color: '#fff',
        font: `var(--fw-bold) 10px/16px var(--font-sans)`,
        textAlign: 'center'
      }
    }, it.count) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        font: `${active ? 'var(--fw-semibold)' : 'var(--fw-medium)'} 11px/1 var(--font-sans)`
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { BottomTabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomTabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Breadcrumb — page hierarchy trail. Chevron separators, muted links,
 * bold current page. Used on the public site (Accueil / Casablanca / Lycées).
 * items: [{ label, href? }] — the last item renders as the current page.
 */
function Breadcrumb({
  items = [],
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    "aria-label": "Fil d'Ariane",
    style: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      ...style
    }
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }
    }, last || !it.href ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: `${last ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-sm)/1 var(--font-sans)`,
        color: last ? 'var(--text-primary)' : 'var(--text-muted)'
      }
    }, it.label) : /*#__PURE__*/React.createElement("a", {
      href: it.href,
      style: {
        font: `var(--fw-regular) var(--fs-sm)/1 var(--font-sans)`,
        color: 'var(--text-secondary)',
        textDecoration: 'none'
      }
    }, it.label), !last ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 14,
      color: "var(--text-placeholder)"
    }) : null);
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Header.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Wordmark — "écoles360" with the red "360".
 * Default brand lockup when no image logo is supplied. `onDark` flips text white.
 */
function Wordmark({
  size = 22,
  onDark = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      font: `var(--fw-extrabold) ${size}px/1 var(--font-sans)`,
      letterSpacing: '-0.5px',
      color: onDark ? '#fff' : 'var(--text-primary)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), "\xE9coles", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--action)'
    }
  }, "360"));
}

/**
 * écoles360 public Header — logo + horizontal nav + red CTA.
 * Active link is red with a 2px red underline. Collapses to a logo + CTA row
 * (links hidden) below `collapseAt`.
 */
function Header({
  items = [{
    label: 'Accueil',
    href: '#',
    active: true
  }, {
    label: 'Établissements',
    href: '#'
  }, {
    label: 'Villes',
    href: '#'
  }, {
    label: 'Blog',
    href: '#'
  }, {
    label: 'À propos',
    href: '#'
  }],
  cta = 'Inscrire mon établissement',
  onCta,
  logoSrc = null,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 30,
      height: 66,
      padding: '0 40px',
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-hairline)',
      ...style
    }
  }, rest), logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "\xE9coles360",
    style: {
      height: 28
    }
  }) : /*#__PURE__*/React.createElement(Wordmark, {
    size: 24
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 26,
      alignItems: 'center',
      height: '100%'
    }
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.label,
    href: it.href,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '100%',
      font: `${it.active ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-body)/1 var(--font-sans)`,
      color: it.active ? 'var(--action)' : 'var(--text-secondary)',
      textDecoration: 'none',
      boxShadow: it.active ? 'inset 0 -2px 0 var(--action)' : 'none'
    }
  }, it.label))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCta,
    style: {
      marginLeft: 'auto',
      height: 42,
      padding: '0 18px',
      border: 'none',
      background: 'var(--action)',
      color: '#fff',
      borderRadius: 'var(--radius-control)',
      font: `var(--fw-semibold) var(--fs-body)/1 var(--font-sans)`,
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, cta));
}
Object.assign(__ds_scope, { Wordmark, Header });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Header.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 SidebarNav — dark back-office sidebar (#15233A) for the three
 * spaces: Établissement, Secrétariat, Administration.
 * Active item = solid red fill. Counter badges on the right. Profile in footer.
 *
 * theme only swaps the eyebrow label/accent context; the surface stays navy.
 * items: [{ key, label, icon, count? }]
 */
function SidebarNav({
  theme = 'etablissement',
  items = [],
  activeKey,
  onSelect,
  user = {
    name: 'Sara Bennani',
    role: 'Établissement'
  },
  logoSrc = null,
  width = 248,
  style = {},
  ...rest
}) {
  const themes = {
    etablissement: 'Espace établissement',
    secretariat: 'Espace secrétariat',
    administration: 'Back-office admin',
    commercial: 'Espace commercial'
  };
  const eyebrow = themes[theme] || themes.etablissement;
  const initials = (user.name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("aside", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      width,
      flex: 'none',
      minHeight: '100%',
      background: 'var(--surface-dark)',
      color: '#fff',
      padding: '20px 14px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 10px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "\xE9coles360",
    style: {
      height: 24,
      alignSelf: 'flex-start'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-extrabold) 22px/1 var(--font-sans)`,
      letterSpacing: '-0.5px',
      color: '#fff'
    }
  }, "\xE9coles", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--action)'
    }
  }, "360")), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      color: 'var(--e360-navy-faint)'
    }
  }, eyebrow)), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      flex: 1
    }
  }, items.map(it => {
    const active = it.key === activeKey;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      type: "button",
      onClick: () => onSelect && onSelect(it.key),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        minHeight: 44,
        padding: '0 12px',
        border: 'none',
        textAlign: 'left',
        borderRadius: 'var(--radius-control)',
        cursor: 'pointer',
        background: active ? 'var(--action)' : 'transparent',
        color: active ? '#fff' : 'var(--e360-navy-soft)',
        font: `${active ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-body)/1 var(--font-sans)`,
        transition: 'background .14s ease, color .14s ease'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.06)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }
    }, it.icon ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 18,
        textAlign: 'center',
        fontSize: 15
      }
    }, it.icon) : null, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, it.label), it.count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
        background: active ? 'rgba(255,255,255,.22)' : 'var(--action)',
        color: '#fff'
      }
    }, it.count) : null);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: '1px solid rgba(255,255,255,.10)',
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      flex: 'none',
      borderRadius: '50%',
      background: 'rgba(255,255,255,.12)',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: `var(--fw-bold) var(--fs-sm)/1 var(--font-sans)`
    }
  }, initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-semibold) var(--fs-sm)/1.2 var(--font-sans)`,
      color: '#fff',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, user.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--e360-navy-faint)',
      marginTop: 2
    }
  }, user.role))));
}
Object.assign(__ds_scope, { SidebarNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Stepper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Stepper — multi-step progress for flows like establishment
 * sign-up / onboarding (Compte → Fiche → Filières → Paiement). Completed steps
 * show a red check, current is red-filled, upcoming are muted.
 * steps: [{ label }]. `current` is the 0-based active index.
 * orientation: "horizontal" (default) or "vertical".
 */
function Stepper({
  steps = [],
  current = 0,
  orientation = 'horizontal',
  style = {},
  ...rest
}) {
  const vertical = orientation === 'vertical';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: vertical ? 'column' : 'row',
      alignItems: vertical ? 'stretch' : 'flex-start',
      gap: vertical ? 0 : 4,
      ...style
    }
  }, rest), steps.map((s, i) => {
    const done = i < current;
    const active = i === current;
    const dot = done ? 'var(--action)' : active ? 'var(--action)' : 'var(--surface-sunken)';
    const fg = done || active ? '#fff' : 'var(--text-muted)';
    const line = i < current ? 'var(--action)' : 'var(--border-strong)';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        flexDirection: vertical ? 'row' : 'column',
        alignItems: vertical ? 'flex-start' : 'center',
        gap: vertical ? 12 : 8,
        flex: vertical ? 'none' : 1,
        position: 'relative'
      }
    }, i > 0 && !vertical ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 14,
        left: 'calc(-50% + 16px)',
        right: 'calc(50% + 16px)',
        height: 2,
        background: i <= current ? 'var(--action)' : 'var(--border-strong)'
      }
    }) : null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        zIndex: 1,
        width: 28,
        height: 28,
        flex: 'none',
        borderRadius: '50%',
        background: dot,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `var(--fw-bold) var(--fs-xs)/1 var(--font-sans)`,
        border: active ? '3px solid var(--e360-red-tint)' : 'none'
      }
    }, done ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "check",
      size: 15
    }) : i + 1), vertical && i < steps.length - 1 ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 2,
        height: 26,
        background: line,
        margin: '2px 0'
      }
    }) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        font: `${active ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-xs)/1.3 var(--font-sans)`,
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        textAlign: vertical ? 'left' : 'center',
        paddingTop: vertical ? 4 : 0
      }
    }, s.label));
  }));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Stepper.jsx", error: String((e && e.message) || e) }); }

// components/profile/EquipmentItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 EquipmentItem — a single facility in the "Équipements" grid
 * (Bibliothèque, Cantine, Laboratoire, Terrain de sport…). Icon chip + label.
 * `available={false}` dims the item.
 */
function EquipmentItem({
  icon = '•',
  label,
  available = true,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '11px 13px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-control-lg)',
      opacity: available ? 1 : 0.5,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      flex: 'none',
      borderRadius: 'var(--radius-control)',
      background: 'var(--e360-navy-tint)',
      color: 'var(--e360-navy)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 15
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--fw-medium) var(--fs-sm)/1.3 var(--font-sans)`,
      color: 'var(--text-body)'
    }
  }, label), !available ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--text-muted)'
    }
  }, "Non dispo.") : null);
}
Object.assign(__ds_scope, { EquipmentItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/profile/EquipmentItem.jsx", error: String((e && e.message) || e) }); }

// components/profile/FaqAccordion.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 FaqAccordion — expandable Q/A list for the profile / public FAQ.
 * Hairline rows, red chevron when open. Single-open by default.
 * items: [{ q, a }]
 */
function FaqAccordion({
  items = [],
  defaultOpen = -1,
  allowMultiple = false,
  style = {},
  ...rest
}) {
  const [open, setOpen] = React.useState(allowMultiple ? defaultOpen >= 0 ? [defaultOpen] : [] : defaultOpen);
  const isOpen = i => allowMultiple ? open.includes(i) : open === i;
  const toggle = i => {
    if (allowMultiple) setOpen(o => o.includes(i) ? o.filter(x => x !== i) : [...o, i]);else setOpen(o => o === i ? -1 : i);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      ...style
    }
  }, rest), items.map((it, i) => {
    const on = isOpen(i);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-field)',
        overflow: 'hidden',
        background: 'var(--surface-card)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => toggle(i),
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        width: '100%',
        padding: '15px 17px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        font: `var(--fw-semibold) var(--fs-body)/1.4 var(--font-sans)`,
        color: 'var(--text-primary)'
      }
    }, it.q, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 'none',
        color: on ? 'var(--action)' : 'var(--text-muted)',
        fontSize: 16,
        transform: on ? 'rotate(180deg)' : 'none',
        transition: 'transform .18s ease'
      }
    }, "\u2304")), on ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 17px 16px',
        font: `var(--fw-regular) var(--fs-sm)/1.55 var(--font-sans)`,
        color: 'var(--text-body)'
      }
    }, it.a) : null);
  }));
}
Object.assign(__ds_scope, { FaqAccordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/profile/FaqAccordion.jsx", error: String((e && e.message) || e) }); }

// components/profile/RatingBreakdown.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 RatingBreakdown — the 5★→1★ distribution with amber bars and the
 * average on the left. Used on profile "Avis" and moderation views.
 * distribution: [count5, count4, count3, count2, count1]
 */
function RatingBreakdown({
  average,
  total,
  distribution = [0, 0, 0, 0, 0],
  style = {},
  ...rest
}) {
  const sum = total != null ? total : distribution.reduce((a, b) => a + b, 0);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 26,
      alignItems: 'center',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-extrabold) var(--fs-stat-lg)/1 var(--font-sans)`,
      letterSpacing: 'var(--ls-tight)',
      color: 'var(--text-primary)'
    }
  }, average), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--rating)',
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      letterSpacing: '1px',
      margin: '6px 0 4px'
    }
  }, "\u2605\u2605\u2605\u2605\u2605"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`,
      color: 'var(--text-muted)'
    }
  }, sum, " avis")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, distribution.map((count, i) => {
    const stars = 5 - i;
    const pct = sum ? count / sum * 100 : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: stars,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        flex: 'none',
        font: `var(--fw-medium) var(--fs-xs)/1 var(--font-sans)`,
        color: 'var(--text-secondary)'
      }
    }, stars, " \u2605"), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 8,
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        width: `${pct}%`,
        height: '100%',
        background: 'var(--rating)',
        borderRadius: 'var(--radius-pill)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 32,
        flex: 'none',
        textAlign: 'right',
        font: `var(--fw-regular) var(--fs-xs)/1 var(--font-sans)`,
        color: 'var(--text-muted)'
      }
    }, count));
  })));
}
Object.assign(__ds_scope, { RatingBreakdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/profile/RatingBreakdown.jsx", error: String((e && e.message) || e) }); }

// components/profile/SocialLinks.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DEFAULTS = {
  whatsapp: {
    label: 'WhatsApp',
    icon: 'message-circle',
    bg: 'var(--e360-green-tint)',
    fg: 'var(--e360-green)'
  },
  phone: {
    label: 'Téléphone',
    icon: 'phone',
    bg: 'var(--e360-navy-tint)',
    fg: 'var(--e360-navy)'
  },
  website: {
    label: 'Site web',
    icon: 'globe',
    bg: 'var(--e360-navy-tint)',
    fg: 'var(--e360-navy)'
  },
  facebook: {
    label: 'Facebook',
    icon: 'users',
    bg: 'var(--e360-navy-tint)',
    fg: 'var(--e360-navy)'
  },
  instagram: {
    label: 'Instagram',
    icon: 'heart',
    bg: 'var(--e360-red-tint)',
    fg: 'var(--e360-red-700)'
  },
  email: {
    label: 'Email',
    icon: 'mail',
    bg: 'var(--e360-navy-tint)',
    fg: 'var(--e360-navy)'
  }
};

/**
 * écoles360 SocialLinks — row of contact / social channel chips on a profile.
 * links: [{ type, href }] where type maps to a known channel, or
 *        [{ label, glyph, href }] for a custom node.
 */
function SocialLinks({
  links = [],
  size = 40,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 9,
      ...style
    }
  }, rest), links.map((l, i) => {
    const d = DEFAULTS[l.type] || {};
    const label = l.label || d.label || l.type;
    const content = l.glyph != null ? l.glyph : d.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: d.icon,
      size: Math.round(size * 0.45)
    }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "external-link",
      size: Math.round(size * 0.45)
    });
    return /*#__PURE__*/React.createElement("a", {
      key: i,
      href: l.href || '#',
      title: label,
      "aria-label": label,
      style: {
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-control-lg)',
        textDecoration: 'none',
        fontSize: 16,
        background: d.bg || 'var(--surface-sunken)',
        color: d.fg || 'var(--text-body)',
        border: '1px solid var(--border-hairline)'
      }
    }, content);
  }));
}
Object.assign(__ds_scope, { SocialLinks });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/profile/SocialLinks.jsx", error: String((e && e.message) || e) }); }

// components/profile/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Tabs — profile section tabs (À propos / Filières / Équipements /
 * Tarifs / Équipe / Avis). Active tab is red with a 2px red underline.
 * Controlled (value/onChange) or uncontrolled (defaultValue).
 * tabs: [{ key, label, count? }]
 */
function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  style = {},
  ...rest
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? (tabs[0] && tabs[0].key));
  const active = value !== undefined ? value : internal;
  const select = k => {
    if (value === undefined) setInternal(k);
    onChange && onChange(k);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-hairline)',
      overflowX: 'auto',
      ...style
    }
  }, rest), tabs.map(t => {
    const on = t.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      type: "button",
      onClick: () => select(t.key),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        flex: 'none',
        padding: '13px 16px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-body)/1 var(--font-sans)`,
        color: on ? 'var(--action)' : 'var(--text-secondary)',
        boxShadow: on ? 'inset 0 -2px 0 var(--action)' : 'none',
        whiteSpace: 'nowrap'
      }
    }, t.label, t.count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        font: `var(--fw-bold) var(--fs-2xs)/1 var(--font-sans)`,
        color: on ? 'var(--action)' : 'var(--text-muted)'
      }
    }, t.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/profile/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/profile/TeamMember.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 TeamMember — staff card for the "Équipe" tab. Photo/monogram avatar,
 * name, and role.
 */
function TeamMember({
  name,
  role,
  photo = null,
  style = {},
  ...rest
}) {
  const initials = (name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-hairline)',
      borderRadius: 'var(--radius-card)',
      padding: 14,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      flex: 'none',
      borderRadius: '50%',
      overflow: 'hidden',
      background: photo ? 'var(--surface-image)' : 'var(--e360-navy-tint)',
      color: 'var(--e360-navy)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: `var(--fw-bold) var(--fs-h3)/1 var(--font-sans)`
    }
  }, photo ? /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-semibold) var(--fs-body)/1.2 var(--font-sans)`,
      color: 'var(--text-primary)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: `var(--fw-regular) var(--fs-xs)/1.3 var(--font-sans)`,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, role)));
}
Object.assign(__ds_scope, { TeamMember });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/profile/TeamMember.jsx", error: String((e && e.message) || e) }); }

// components/profile/VideoEmbed.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 VideoEmbed — thumbnail with a red play button overlay for the
 * profile "À propos" presentation video. Clicking swaps in the iframe.
 */
function VideoEmbed({
  src,
  poster = null,
  title = 'Vidéo de présentation',
  ratio = '16 / 9',
  style = {},
  ...rest
}) {
  const [playing, setPlaying] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: ratio,
      background: 'var(--surface-image)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      ...style
    }
  }, rest), playing && src ? /*#__PURE__*/React.createElement("iframe", {
    src: src,
    title: title,
    allow: "autoplay; encrypted-media; fullscreen",
    allowFullScreen: true,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      border: 'none'
    }
  }) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setPlaying(true),
    "aria-label": title,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      padding: 0,
      border: 'none',
      cursor: 'pointer',
      background: 'transparent'
    }
  }, poster ? /*#__PURE__*/React.createElement("img", {
    src: poster,
    alt: title,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim-card)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 60,
      height: 60,
      borderRadius: '50%',
      background: 'var(--action)',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22,
      paddingLeft: 4,
      boxShadow: '0 6px 20px rgba(230,57,70,.45)'
    }
  }, "\u25B6"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 16,
      bottom: 14,
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      color: '#fff'
    }
  }, title)));
}
Object.assign(__ds_scope, { VideoEmbed });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/profile/VideoEmbed.jsx", error: String((e && e.message) || e) }); }

// components/search/CitySelect.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Mohammedia', 'El Jadida'];

/**
 * écoles360 CitySelect — the required city picker that gates every search.
 * Pin icon, red required marker, styled native select with a Morocco city list.
 */
function CitySelect({
  label = 'Ville',
  value,
  defaultValue,
  onChange,
  cities = CITIES,
  placeholder = 'Choisir une ville',
  required = true,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const chosen = value || defaultValue;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      color: 'var(--text-body)',
      marginBottom: 7
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--action)',
      marginLeft: 4
    }
  }, "*") : null) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      height: 48,
      padding: '0 14px',
      background: '#fff',
      border: `1px solid ${focused ? 'var(--action-secondary)' : 'var(--border-control)'}`,
      borderRadius: 'var(--radius-control-lg)',
      boxShadow: focused ? '0 0 0 3px var(--e360-navy-tint)' : 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 16,
    color: "var(--action)"
  }), /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      appearance: 'none',
      WebkitAppearance: 'none',
      cursor: 'pointer',
      font: 'var(--text-default)',
      color: chosen ? 'var(--text-primary)' : 'var(--text-muted)'
    }
  }, rest), /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), cities.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    color: "var(--text-muted)",
    style: {
      pointerEvents: 'none'
    }
  })));
}
Object.assign(__ds_scope, { CitySelect });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/search/CitySelect.jsx", error: String((e && e.message) || e) }); }

// components/search/FilterBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 FilterBar — horizontal scrollable chip row for refining results
 * (type, filière, budget, note) plus Appliquer / Réinitialiser actions.
 * Active chips invert to a navy fill. Removable active filters show a ✕.
 *
 * filters: [{ key, label, active? }]
 */
function FilterBar({
  filters = [],
  onToggle,
  onApply,
  onReset,
  applyLabel = 'Appliquer',
  resetLabel = 'Réinitialiser',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      overflowX: 'auto',
      flex: 1,
      paddingBottom: 2
    }
  }, filters.map(f => {
    const on = f.active;
    return /*#__PURE__*/React.createElement("button", {
      key: f.key,
      type: "button",
      onClick: () => onToggle && onToggle(f.key),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        flex: 'none',
        height: 36,
        padding: '0 14px',
        cursor: 'pointer',
        background: on ? 'var(--action-secondary)' : 'var(--surface-card)',
        color: on ? '#fff' : 'var(--text-secondary)',
        border: on ? '1px solid var(--action-secondary)' : '1px solid var(--border-control)',
        borderRadius: 'var(--radius-pill)',
        font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-sm)/1 var(--font-sans)`,
        whiteSpace: 'nowrap'
      }
    }, f.label, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        opacity: on ? 1 : 0.6
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: on ? 'x' : 'chevron-down',
      size: 13
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flex: 'none'
    }
  }, onReset ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onReset,
    style: {
      height: 36,
      padding: '0 14px',
      cursor: 'pointer',
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-control)',
      borderRadius: 'var(--radius-control)',
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      whiteSpace: 'nowrap'
    }
  }, resetLabel) : null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onApply,
    style: {
      height: 36,
      padding: '0 16px',
      cursor: 'pointer',
      border: 'none',
      background: 'var(--action)',
      color: '#fff',
      borderRadius: 'var(--radius-control)',
      font: `var(--fw-semibold) var(--fs-sm)/1 var(--font-sans)`,
      whiteSpace: 'nowrap'
    }
  }, applyLabel)));
}
Object.assign(__ds_scope, { FilterBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/search/FilterBar.jsx", error: String((e && e.message) || e) }); }

// components/search/TypePicker.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DEFAULT_TYPES = [{
  key: 'creche',
  label: 'Crèche',
  icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "baby",
    size: 26
  })
}, {
  key: 'primaire',
  label: 'Primaire',
  icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "pencil",
    size: 26
  })
}, {
  key: 'college',
  label: 'Collège',
  icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "book-open",
    size: 26
  })
}, {
  key: 'lycee',
  label: 'Lycée',
  icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "graduation-cap",
    size: 26
  })
}, {
  key: 'universite',
  label: 'Université',
  icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "building",
    size: 26
  })
}, {
  key: 'formation',
  label: 'Formation',
  icon: /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "briefcase",
    size: 26
  })
}];

/**
 * écoles360 TypePicker — 6 establishment-type cards (Crèche → Formation).
 * Selected card gets a 1.5px navy border + navy tint. Single or multi select.
 * Icons default to emoji; pass `types` with your own icon nodes to swap to Lucide.
 */
function TypePicker({
  types = DEFAULT_TYPES,
  value = [],
  multi = false,
  onChange,
  columns = 6,
  style = {},
  ...rest
}) {
  const sel = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = key => {
    if (!onChange) return;
    if (multi) onChange(sel.includes(key) ? sel.filter(k => k !== key) : [...sel, key]);else onChange(sel.includes(key) ? [] : [key]);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 12,
      ...style
    }
  }, rest), types.map(t => {
    const on = sel.includes(t.key);
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      type: "button",
      onClick: () => toggle(t.key),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        padding: '18px 10px',
        minHeight: 92,
        cursor: 'pointer',
        background: on ? 'var(--e360-navy-tint)' : 'var(--surface-card)',
        border: on ? '1.5px solid var(--action-secondary)' : '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-field)',
        transition: 'border-color .14s ease, background .14s ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        color: on ? 'var(--action-secondary)' : 'var(--text-secondary)',
        lineHeight: 1
      }
    }, t.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        font: `${on ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--fs-sm)/1 var(--font-sans)`,
        color: on ? 'var(--action-secondary)' : 'var(--text-body)'
      }
    }, t.label));
  }));
}
Object.assign(__ds_scope, { TypePicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/search/TypePicker.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CityCard = __ds_scope.CityCard;

__ds_ns.EstablishmentCard = __ds_scope.EstablishmentCard;

__ds_ns.PricingCard = __ds_scope.PricingCard;

__ds_ns.RequestCard = __ds_scope.RequestCard;

__ds_ns.ReviewCard = __ds_scope.ReviewCard;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.SourceBars = __ds_scope.SourceBars;

__ds_ns.ICONS = __ds_scope.ICONS;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.PermissionToggle = __ds_scope.PermissionToggle;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.ProfileUnavailable = __ds_scope.ProfileUnavailable;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.SkeletonCard = __ds_scope.SkeletonCard;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.BottomTabBar = __ds_scope.BottomTabBar;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Header = __ds_scope.Header;

__ds_ns.SidebarNav = __ds_scope.SidebarNav;

__ds_ns.Stepper = __ds_scope.Stepper;

__ds_ns.EquipmentItem = __ds_scope.EquipmentItem;

__ds_ns.FaqAccordion = __ds_scope.FaqAccordion;

__ds_ns.RatingBreakdown = __ds_scope.RatingBreakdown;

__ds_ns.SocialLinks = __ds_scope.SocialLinks;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TeamMember = __ds_scope.TeamMember;

__ds_ns.VideoEmbed = __ds_scope.VideoEmbed;

__ds_ns.CitySelect = __ds_scope.CitySelect;

__ds_ns.FilterBar = __ds_scope.FilterBar;

__ds_ns.TypePicker = __ds_scope.TypePicker;

})();
