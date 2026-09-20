/* @ds-bundle: {"format":3,"namespace":"Coles360DesignSystem_f0cdf0","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"DataTable","sourcePath":"components/navigation/DataTable.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"ProgressBar","sourcePath":"components/surfaces/ProgressBar.jsx"},{"name":"StatCard","sourcePath":"components/surfaces/StatCard.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"9e209700b183","components/core/Badge.jsx":"edd7ae23e71b","components/core/Button.jsx":"dc9ede26f34f","components/core/Tag.jsx":"05cef7f8c067","components/forms/Checkbox.jsx":"e7b0db028941","components/forms/Input.jsx":"6ec59c257e3e","components/forms/Select.jsx":"b12542f645e1","components/navigation/DataTable.jsx":"839504bba0f4","components/navigation/Pagination.jsx":"38bea24c0b5b","components/navigation/Tabs.jsx":"bde98722cf93","components/surfaces/Card.jsx":"0c475bcfc79d","components/surfaces/ProgressBar.jsx":"80add6e3c355","components/surfaces/StatCard.jsx":"26c2e6659ed5","ui_kits/admin/AdminDashboard.jsx":"ee1032abc85a","ui_kits/pro-space/Login.jsx":"a57233bb9029","ui_kits/pro-space/ProDashboard.jsx":"69cf07b79b83","ui_kits/public-site/Detail.jsx":"04289dc8dea7","ui_kits/public-site/Home.jsx":"41f512469f48","ui_kits/public-site/Results.jsx":"0993fb596c9f","ui_kits/public-site/SchoolCard.jsx":"24fc8a5b428d","ui_kits/public-site/SiteChrome.jsx":"bd18b4072ab7"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.Coles360DesignSystem_f0cdf0 = window.Coles360DesignSystem_f0cdf0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Avatar — circular monogram or image. Used for school initials,
 * reviewers and the pro/admin account chip. Falls back to initials on
 * a neutral surface; `square` gives the rounded image tile used for "Ma fiche".
 */
function Avatar({
  initials = '',
  src = null,
  size = 40,
  square = false,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      flex: 'none',
      borderRadius: square ? 'var(--radius-lg)' : 'var(--radius-full)',
      background: 'var(--c-placeholder-bg)',
      color: 'var(--c-gray-600)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: Math.round(size * 0.36),
      overflow: 'hidden',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: initials,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Badge — small status / label pill on a soft tint background.
 * tones: red (Sponsorisé), green (Vérifié/success), amber (alerte/solde bas),
 *        navy (info), neutral (type d'établissement).
 * Use `solid` for the filled red "Sponsorisé" badge.
 */
function Badge({
  children,
  tone = 'neutral',
  solid = false,
  icon = null,
  style = {},
  ...rest
}) {
  const tints = {
    red: {
      background: 'var(--c-red-tint)',
      color: 'var(--c-red)'
    },
    green: {
      background: 'var(--c-green-tint)',
      color: 'var(--c-green)'
    },
    amber: {
      background: 'var(--c-amber-tint)',
      color: 'var(--c-amber-text)'
    },
    navy: {
      background: 'var(--c-navy-tint)',
      color: 'var(--c-navy)'
    },
    neutral: {
      background: 'var(--c-surface-mute)',
      color: 'var(--c-gray-600)'
    }
  };
  const base = solid ? {
    background: 'var(--c-red)',
    color: '#fff'
  } : tints[tone] || tints.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-eyebrow)',
      fontWeight: 'var(--fw-bold)',
      lineHeight: 1,
      padding: '4px 9px',
      borderRadius: 'var(--radius-xs)',
      whiteSpace: 'nowrap',
      ...base,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", null, icon) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Button — flat, rounded action button.
 * Variants map to the brand's action language:
 *  primary  → red (#E63946)   main CTA / active
 *  navy     → navy (#1D3557)  secondary action / "Appeler"
 *  success  → green (#2E9E5B) WhatsApp / validate
 *  outline  → white + border  tertiary / "Site web"
 *  ghost    → transparent     low-emphasis
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  icon = null,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: '13px',
      radius: 'var(--radius-sm)'
    },
    md: {
      padding: '12px 22px',
      fontSize: '15px',
      radius: 'var(--radius-md)'
    },
    lg: {
      padding: '14px 24px',
      fontSize: '16px',
      radius: 'var(--radius-md)'
    }
  };
  const variants = {
    primary: {
      background: 'var(--c-red)',
      color: '#fff',
      border: '1px solid transparent'
    },
    navy: {
      background: 'var(--c-navy)',
      color: '#fff',
      border: '1px solid transparent'
    },
    success: {
      background: 'var(--c-green)',
      color: '#fff',
      border: '1px solid transparent'
    },
    outline: {
      background: '#fff',
      color: 'var(--c-navy)',
      border: '1px solid var(--c-border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--c-gray-600)',
      border: '1px solid transparent'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: s.fontSize,
      lineHeight: 1,
      padding: s.padding,
      borderRadius: s.radius,
      width: full ? '100%' : 'auto',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'var(--transition)',
      ...v,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      fontSize: '1.05em'
    }
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Tag — neutral chip for filières / spécialités (Sciences, Bilingue…).
 * Quieter than Badge: gray fill, medium weight, slightly larger padding.
 */
function Tag({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-2xs)',
      fontWeight: 'var(--fw-medium)',
      lineHeight: 1,
      padding: '4px 10px',
      borderRadius: 'var(--radius-xs)',
      background: 'var(--c-surface-mute)',
      color: 'var(--c-gray-600)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Checkbox — label + native checkbox with red accent.
 * Used in the results filter list (type d'établissement).
 */
function Checkbox({
  label,
  checked,
  onChange,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
      padding: '5px 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-sm)',
      color: 'var(--c-ink)',
      cursor: 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    style: {
      width: '16px',
      height: '16px',
      accentColor: 'var(--c-red)',
      cursor: 'pointer'
    }
  }, rest)), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Input — labelled text field. Flat, rounded, 1px border that
 * turns red on focus. Pass `label` for the standard field-with-label block.
 */
function Input({
  label,
  hint,
  type = 'text',
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const field = /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    style: {
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body)',
      color: 'var(--c-ink)',
      background: '#fff',
      border: '1px solid var(--c-border-input)',
      borderRadius: 'var(--radius-md)',
      padding: '13px 14px',
      outline: 'none',
      transition: 'var(--transition)',
      ...style
    },
    onFocus: e => {
      e.target.style.borderColor = 'var(--c-red)';
    },
    onBlur: e => {
      e.target.style.borderColor = 'var(--c-border-input)';
    }
  }, rest));
  if (!label && !hint) return field;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...wrapStyle
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      marginBottom: '7px',
      color: 'var(--c-ink)'
    }
  }, label) : null, field, hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-2xs)',
      color: 'var(--c-gray-400)',
      marginTop: '6px'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Select — labelled dropdown matching Input styling.
 * Pass options as [{value,label}] or string[]; or supply <option> children.
 */
function Select({
  label,
  options = null,
  children,
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const opts = options ? options.map((o, i) => {
    const value = typeof o === 'string' ? o : o.value;
    const text = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: i,
      value: value
    }, text);
  }) : children;
  const field = /*#__PURE__*/React.createElement("select", _extends({
    style: {
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-sm)',
      color: 'var(--c-ink)',
      background: '#fff',
      border: '1px solid var(--c-border-input)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 12px',
      cursor: 'pointer',
      outline: 'none',
      ...style
    }
  }, rest), opts);
  if (!label) return field;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...wrapStyle
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--c-gray-600)',
      marginBottom: '7px'
    }
  }, label), field);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 DataTable — back-office table. Uppercase muted header row,
 * hairline row dividers. `columns` = [{key,label,align}], `rows` = array of
 * objects; a column may supply `render(row)` for custom cells (badges, buttons).
 */
function DataTable({
  columns = [],
  rows = [],
  responsive = false,
  style = {},
  ...rest
}) {
  const cls = (responsive ? 'e360-responsive-table ' : '') + (rest.className || '');
  return /*#__PURE__*/React.createElement("table", _extends({}, rest, {
    className: cls.trim(),
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-sm)',
      ...style
    }
  }), /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      textAlign: 'left',
      color: 'var(--c-gray-400)',
      fontSize: 'var(--fs-2xs)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-eyebrow)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      padding: '0 0 12px',
      fontWeight: 'var(--fw-semibold)',
      textAlign: c.align || 'left'
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri,
    style: {
      borderTop: '1px solid var(--c-border-soft)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    "data-label": c.label,
    style: {
      padding: '14px 0',
      textAlign: c.align || 'left',
      color: 'var(--c-ink-700)'
    }
  }, c.render ? c.render(row) : row[c.key]))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Pagination — square page buttons; active page is red-filled,
 * others are white with a border. Includes ‹ › arrows.
 */
function Pagination({
  page = 1,
  count = 1,
  onChange,
  style = {},
  ...rest
}) {
  const go = p => {
    if (p >= 1 && p <= count && onChange) onChange(p);
  };
  const cell = (content, opts = {}) => {
    const {
      active,
      disabled,
      key
    } = opts;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      onClick: () => !disabled && go(opts.target),
      disabled: disabled,
      style: {
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-semibold)',
        fontSize: 'var(--fs-sm)',
        cursor: disabled ? 'default' : 'pointer',
        border: active ? 'none' : '1px solid var(--c-border-input)',
        background: active ? 'var(--c-red)' : '#fff',
        color: active ? '#fff' : disabled ? 'var(--c-gray-400)' : 'var(--c-ink)',
        transition: 'var(--transition)'
      }
    }, content);
  };
  const pages = Array.from({
    length: count
  }, (_, i) => i + 1);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      ...style
    }
  }, rest), cell('‹', {
    key: 'prev',
    target: page - 1,
    disabled: page <= 1
  }), pages.map(p => cell(p, {
    key: p,
    target: p,
    active: p === page
  })), cell('›', {
    key: 'next',
    target: page + 1,
    disabled: page >= count
  }));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Tabs — underline tab bar. `items` = [{key,label}]. Active tab
 * gets ink text + red underline; others are muted. Controlled via `active`
 * + `onChange`.
 */
function Tabs({
  items = [],
  active,
  onChange,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: '28px',
      borderBottom: '1px solid var(--c-border)',
      ...style
    }
  }, rest), items.map(t => {
    const on = t.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      onClick: () => onChange && onChange(t.key),
      style: {
        appearance: 'none',
        background: 'none',
        border: 'none',
        borderBottom: on ? '2px solid var(--c-red)' : '2px solid transparent',
        padding: '0 0 14px',
        marginBottom: '-1px',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-sm)',
        fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-medium)',
        color: on ? 'var(--c-ink)' : 'var(--c-gray-600)',
        cursor: 'pointer',
        transition: 'var(--transition)'
      }
    }, t.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 Card — the base surface: white, 1px hairline border, rounded,
 * no shadow at rest. Set `hover` for the lift-on-hover behavior used by
 * clickable cards; `sponsored` adds the 4px red left rail; `pad` controls
 * inner padding (set 0 for media-edge cards).
 */
function Card({
  children,
  hover = false,
  sponsored = false,
  pad = 22,
  onClick,
  style = {},
  ...rest
}) {
  const [lift, setLift] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: hover ? () => setLift(true) : undefined,
    onMouseLeave: hover ? () => setLift(false) : undefined,
    style: {
      display: sponsored ? 'flex' : 'block',
      background: 'var(--surface-card)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'var(--transition)',
      boxShadow: lift ? 'var(--shadow-md)' : 'none',
      transform: lift ? 'translateY(-2px)' : 'none',
      ...style
    }
  }, rest), sponsored ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: '4px',
      background: 'var(--c-red)',
      flex: 'none'
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: pad
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 ProgressBar — flat track + filled bar. Used for credit balance
 * and quota meters. `tone`: red (default brand), green, amber. Value 0–100.
 */
function ProgressBar({
  value = 0,
  tone = 'red',
  height = 8,
  style = {},
  ...rest
}) {
  const tones = {
    red: 'var(--c-red)',
    green: 'var(--c-green)',
    amber: 'var(--c-amber)'
  };
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: '100%',
      height,
      background: 'var(--c-surface-mute)',
      borderRadius: 'var(--radius-xs)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      background: tones[tone] || tones.red,
      transition: 'var(--transition)'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * écoles360 StatCard — KPI tile for dashboards. Muted label, large heavy
 * number, optional delta. `deltaTone`: green (up/good), amber (attention),
 * muted (neutral). `unit` renders small after the value (e.g. MAD).
 */
function StatCard({
  label,
  value,
  unit,
  delta,
  deltaTone = 'green',
  valueColor,
  style = {},
  ...rest
}) {
  const tones = {
    green: 'var(--c-green)',
    amber: 'var(--c-amber)',
    muted: 'var(--c-gray-400)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--radius-xl)',
      padding: '20px',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--c-gray-400)',
      marginBottom: '8px'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: 'var(--fw-heavy)',
      lineHeight: 1,
      color: valueColor || 'var(--c-ink)'
    }
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '15px',
      color: 'var(--c-gray-400)',
      fontWeight: 'var(--fw-heavy)'
    }
  }, " ", unit) : null), delta ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-2xs)',
      color: tones[deltaTone] || tones.green,
      fontWeight: 'var(--fw-semibold)',
      marginTop: '4px'
    }
  }, delta) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/StatCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/AdminDashboard.jsx
try { (() => {
/* écoles360 — Admin dashboard (back-office). window.AdminDashboard */
(function () {
  const {
    Button,
    Badge,
    StatCard,
    DataTable
  } = window.Coles360DesignSystem_f0cdf0;
  function AdminDashboard({
    go
  }) {
    const nav = [['▦', 'Tableau de bord', true], ['🏫', 'Établissements'], ['📝', 'Inscriptions'], ['🔔', 'Rappels'], ['👥', 'Utilisateurs'], ['📊', 'Statistiques'], ['⚙️', 'Paramètres']];
    const chart = [['Jan', 76], ['Fév', 94], ['Mar', 118], ['Avr', 106], ['Mai', 144], ['Juin', 176]];
    const reminders = [{
      name: 'Groupe Scolaire Avenir',
      motif: /*#__PURE__*/React.createElement(Badge, {
        tone: "red"
      }, "Solde \xE9puis\xE9"),
      statut: /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--c-red)',
          fontWeight: 600
        }
      }, "Urgent"),
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm"
      }, "Recharger")
    }, {
      name: 'Lycée Al Massira',
      motif: /*#__PURE__*/React.createElement(Badge, {
        tone: "amber"
      }, "Solde bas"),
      statut: /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--c-amber)',
          fontWeight: 600
        }
      }, "\xC0 contacter"),
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "navy"
      }, "Appeler")
    }, {
      name: 'Institut Lumière',
      motif: /*#__PURE__*/React.createElement(Badge, {
        tone: "navy"
      }, "Abonnement expirant"),
      statut: /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--c-gray-600)',
          fontWeight: 600
        }
      }, "En cours"),
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "navy"
      }, "Relancer")
    }, {
      name: 'École Les Oliviers',
      motif: /*#__PURE__*/React.createElement(Badge, {
        tone: "green"
      }, "Inscription en attente"),
      statut: /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--c-green)',
          fontWeight: 600
        }
      }, "Nouveau"),
      action: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "success"
      }, "Valider")
    }];
    const cols = [{
      key: 'name',
      label: 'Établissement',
      render: r => /*#__PURE__*/React.createElement("strong", {
        style: {
          fontWeight: 600
        }
      }, r.name)
    }, {
      key: 'motif',
      label: 'Motif'
    }, {
      key: 'statut',
      label: 'Statut'
    }, {
      key: 'action',
      label: 'Action',
      align: 'right'
    }];
    const quick = [['➕', 'Ajouter un établissement'], ['✅', 'Valider inscriptions'], ['🔔', 'Gérer les rappels'], ['📊', 'Statistiques']];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--c-surface-soft)'
      }
    }, /*#__PURE__*/React.createElement("aside", {
      className: "e-adm-sidebar",
      style: {
        background: 'var(--c-ink)',
        color: '#fff',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => go('home'),
      style: {
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 21,
        padding: '0 24px 8px'
      }
    }, "\xE9coles", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-red)'
      }
    }, "360")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 24px 18px',
        fontSize: 11,
        letterSpacing: '1px',
        color: '#6B6B6B',
        fontWeight: 700
      }
    }, "ADMINISTRATION"), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '0 12px',
        fontSize: 14
      }
    }, nav.map(([ic, label, active]) => /*#__PURE__*/React.createElement("div", {
      key: label,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 14px',
        borderRadius: 9,
        background: active ? 'var(--c-red)' : 'transparent',
        fontWeight: active ? 600 : 400,
        color: active ? '#fff' : '#A5A5A5',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", null, ic), label))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => go('login'),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 14px',
        borderRadius: 9,
        color: '#A5A5A5',
        cursor: 'pointer',
        fontSize: 14
      }
    }, "\u21A9 Se d\xE9connecter"))), /*#__PURE__*/React.createElement("main", {
      className: "e-adm-main"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 24,
        fontWeight: 800,
        margin: '0 0 4px'
      }
    }, "Tableau de bord"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-gray-600)',
        margin: 0,
        fontSize: 14
      }
    }, "Vue d'ensemble de la plateforme \u2014 Juin 2026")), /*#__PURE__*/React.createElement("div", {
      className: "e-adm-kpis",
      style: {
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "\xC9tablissements",
      value: "184",
      delta: "\u2191 6 ce mois"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Revenus du mois",
      value: "86 400",
      unit: "MAD",
      delta: "\u2191 14% vs mai"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Vues totales",
      value: "42 300",
      delta: "\u2191 24% ce mois"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Inscriptions en attente",
      value: "12",
      valueColor: "var(--c-amber)",
      delta: "\xC0 valider",
      deltaTone: "amber"
    })), /*#__PURE__*/React.createElement("div", {
      className: "e-adm-cols",
      style: {
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        padding: 22
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        margin: '0 0 4px'
      }
    }, "Vues sur 6 mois"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-gray-400)',
        fontSize: 13,
        margin: '0 0 24px'
      }
    }, "Total des vues mensuelles sur la plateforme"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 18,
        height: 180
      }
    }, chart.map(([m, h], i) => /*#__PURE__*/React.createElement("div", {
      key: m,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-end',
        height: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: h,
        background: i === chart.length - 1 ? 'var(--c-red)' : 'var(--c-chart-bar)',
        borderRadius: '7px 7px 0 0'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: i === chart.length - 1 ? 'var(--c-ink)' : 'var(--c-gray-400)',
        fontWeight: i === chart.length - 1 ? 600 : 400
      }
    }, m))))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        padding: 22
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        margin: '0 0 16px'
      }
    }, "Acc\xE8s rapides"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }
    }, quick.map(([ic, label]) => /*#__PURE__*/React.createElement("div", {
      key: label,
      className: "qa",
      style: {
        border: '1px solid var(--c-border)',
        borderRadius: 11,
        padding: 16,
        cursor: 'pointer',
        transition: 'var(--transition)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        marginBottom: 8
      }
    }, ic), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, label)))))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        padding: 22
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        margin: '0 0 18px'
      }
    }, "Rappels \u2014 \xE9tablissements \xE0 contacter"), /*#__PURE__*/React.createElement(DataTable, {
      responsive: true,
      columns: cols,
      rows: reminders
    }))), /*#__PURE__*/React.createElement("nav", {
      className: "e-adm-bottombar",
      style: {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'var(--bottombar-h)',
        background: 'var(--c-ink)',
        zIndex: 40
      }
    }, [['▦', 'Bord', true], ['🏫', 'Établ.'], ['📝', 'Inscr.'], ['🔔', 'Rappels'], ['↩', 'Sortir']].map(([ic, label, active]) => /*#__PURE__*/React.createElement("div", {
      key: label,
      onClick: () => {
        if (label === 'Sortir') go('login');
      },
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        minHeight: 'var(--touch-min)',
        fontSize: 10,
        fontWeight: 600,
        color: active ? '#fff' : '#888',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        lineHeight: 1
      }
    }, ic), label))));
  }
  window.AdminDashboard = AdminDashboard;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/AdminDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pro-space/Login.jsx
try { (() => {
/* écoles360 — Pro login screen (split panel). window.LoginScreen */
(function () {
  const {
    Button,
    Input
  } = window.Coles360DesignSystem_f0cdf0;
  function LoginScreen({
    go
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "e-login"
    }, /*#__PURE__*/React.createElement("div", {
      className: "e-login-brand",
      style: {
        background: 'var(--c-navy)',
        color: '#fff',
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => go('home'),
      style: {
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 24
      }
    }, "\xE9coles", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-red)'
      }
    }, "360")), /*#__PURE__*/React.createElement("div", {
      className: "e-login-tagline"
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: '-0.5px',
        lineHeight: 1.2,
        margin: '0 0 16px'
      }
    }, "Espace de connexion"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-navy-soft)',
        fontSize: 16,
        lineHeight: 1.7,
        maxWidth: 380,
        margin: 0
      }
    }, "Acc\xE9dez \xE0 votre espace pour g\xE9rer votre \xE9tablissement, suivre vos statistiques et g\xE9rer vos cr\xE9dits de visibilit\xE9.")), /*#__PURE__*/React.createElement("div", {
      className: "e-login-tagline",
      style: {
        color: 'var(--c-navy-soft)',
        fontSize: 13
      }
    }, "\xA9 2026 \xE9coles360 \u2014 Tous droits r\xE9serv\xE9s")), /*#__PURE__*/React.createElement("div", {
      className: "e-login-form",
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: '#fff'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        maxWidth: 380
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 26,
        fontWeight: 800,
        margin: '0 0 8px'
      }
    }, "Se connecter"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-gray-600)',
        fontSize: 14,
        margin: '0 0 28px'
      }
    }, "Espace r\xE9serv\xE9 aux \xE9tablissements et \xE0 l'\xE9quipe."), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Adresse e-mail",
      type: "email",
      placeholder: "vous@etablissement.ma"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Mot de passe",
      type: "password",
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right',
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("a", {
      style: {
        color: 'var(--c-navy)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer'
      }
    }, "Mot de passe oubli\xE9 ?")), /*#__PURE__*/React.createElement(Button, {
      full: true,
      size: "lg",
      onClick: () => go('pro')
    }, "Se connecter"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        fontSize: 14,
        color: 'var(--c-gray-600)',
        margin: '22px 0 24px'
      }
    }, "Pas encore r\xE9f\xE9renc\xE9 ? ", /*#__PURE__*/React.createElement("a", {
      style: {
        color: 'var(--c-red)',
        fontWeight: 600,
        cursor: 'pointer'
      }
    }, "Inscrire mon \xE9tablissement")), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid var(--c-border)',
        paddingTop: 18,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--c-gray-400)',
        marginBottom: 10
      }
    }, "Aper\xE7u d\xE9mo \u2014 acc\xE8s direct :"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "sm",
      full: true,
      onClick: () => go('pro')
    }, "Espace \xE9tablissement"), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "sm",
      full: true,
      onClick: () => go('admin')
    }, "Dashboard admin"))))));
  }
  window.LoginScreen = LoginScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pro-space/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pro-space/ProDashboard.jsx
try { (() => {
/* écoles360 — Pro dashboard (établissement). window.ProDashboard */
(function () {
  const {
    Button,
    Badge,
    Avatar,
    StatCard,
    ProgressBar
  } = window.Coles360DesignSystem_f0cdf0;
  function ProDashboard({
    go
  }) {
    const nav = [['▦', 'Tableau de bord', true], ['🏫', 'Ma fiche'], ['📊', 'Statistiques'], ['💳', 'Crédits & facturation'], ['⭐', 'Avis'], ['⚙️', 'Paramètres']];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--c-surface-soft)'
      }
    }, /*#__PURE__*/React.createElement("aside", {
      className: "e-pro-sidebar",
      style: {
        background: '#fff',
        borderRight: '1px solid var(--c-border)',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => go('home'),
      style: {
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 21,
        padding: '0 24px 20px'
      }
    }, "\xE9coles", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-red)'
      }
    }, "360")), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '0 12px',
        fontSize: 14
      }
    }, nav.map(([ic, label, active]) => /*#__PURE__*/React.createElement("div", {
      key: label,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 14px',
        borderRadius: 9,
        fontWeight: active ? 600 : 500,
        background: active ? 'var(--c-red-tint)' : 'transparent',
        color: active ? 'var(--c-red)' : 'var(--c-gray-600)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", null, ic), label))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => go('login'),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 14px',
        borderRadius: 9,
        color: 'var(--c-gray-600)',
        cursor: 'pointer',
        fontSize: 14
      }
    }, "\u21A9 Se d\xE9connecter"))), /*#__PURE__*/React.createElement("main", {
      className: "e-pro-main"
    }, /*#__PURE__*/React.createElement("div", {
      className: "e-pro-header",
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 24,
        fontWeight: 800,
        margin: '0 0 4px'
      }
    }, "Bonjour, Lyc\xE9e Al Massira \uD83D\uDC4B"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-gray-600)',
        margin: 0,
        fontSize: 14
      }
    }, "Voici l'activit\xE9 de votre fiche ce mois-ci.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      initials: "AM",
      size: 36
    }))), /*#__PURE__*/React.createElement("div", {
      className: "e-pro-credit",
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        padding: '16px 22px',
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "amber"
    }, "Solde bas"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--c-gray-600)'
      }
    }, "Solde : ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--c-ink)'
      }
    }, "320 cr\xE9dits"))), /*#__PURE__*/React.createElement(Button, null, "Recharger")), /*#__PURE__*/React.createElement("div", {
      className: "e-pro-kpis",
      style: {
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement(StatCard, {
      label: "Vues ce mois",
      value: "3 240",
      delta: "\u2191 18%"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Appels re\xE7us",
      value: "86",
      delta: "\u2191 12%"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Clics WhatsApp",
      value: "124",
      delta: "\u2191 9%"
    }), /*#__PURE__*/React.createElement(StatCard, {
      label: "Position moyenne",
      value: "3e",
      delta: "cat\xE9gorie Lyc\xE9e",
      deltaTone: "muted"
    })), /*#__PURE__*/React.createElement("div", {
      className: "e-pro-cols"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        padding: 22
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        margin: 0
      }
    }, "Ma fiche"), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "sm"
    }, "Modifier")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      square: true,
      initials: "",
      size: 78,
      src: "../../assets/icons/school-building.svg"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 16,
        marginBottom: 4
      }
    }, "Lyc\xE9e Al Massira"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "green",
      icon: "\u2713"
    }, "V\xE9rifi\xE9"), /*#__PURE__*/React.createElement(Badge, {
      solid: true
    }, "Sponsoris\xE9")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-gray-600)'
      }
    }, "Formule : ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--c-ink)'
      }
    }, "Pack Visibilit\xE9")), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-gray-600)'
      }
    }, "64%")), /*#__PURE__*/React.createElement(ProgressBar, {
      value: 64,
      style: {
        marginBottom: 18
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      full: true
    }, "Acheter des cr\xE9dits"), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      full: true
    }, "Voir ma fiche"))), /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        padding: 22
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        margin: '0 0 16px'
      }
    }, "Derniers avis"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, [['Karima B.', '★★★★★', 'Excellent encadrement et suivi.'], ['Youssef T.', '★★★★☆', 'Très bon niveau, tarifs un peu élevés.']].map(([n, st, txt]) => /*#__PURE__*/React.createElement("div", {
      key: n,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid var(--c-border-soft)',
        borderRadius: 11,
        padding: '14px 16px'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        fontSize: 14,
        marginBottom: 3
      }
    }, n, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-amber)',
        fontWeight: 400
      }
    }, st)), /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--c-gray-600)',
        fontSize: 13
      }
    }, txt)), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "sm"
    }, "R\xE9pondre"))))))), /*#__PURE__*/React.createElement("nav", {
      className: "e-pro-bottombar",
      style: {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'var(--bottombar-h)',
        background: '#fff',
        borderTop: '1px solid var(--c-border)',
        zIndex: 40
      }
    }, [['▦', 'Tableau', true], ['🏫', 'Fiche'], ['📊', 'Stats'], ['⭐', 'Avis'], ['↩', 'Sortir']].map(([ic, label, active]) => /*#__PURE__*/React.createElement("div", {
      key: label,
      onClick: () => {
        if (label === 'Sortir') go('login');
      },
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        minHeight: 'var(--touch-min)',
        fontSize: 10,
        fontWeight: 600,
        color: active ? 'var(--c-red)' : 'var(--c-gray-400)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        lineHeight: 1
      }
    }, ic), label))));
  }
  window.ProDashboard = ProDashboard;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pro-space/ProDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/Detail.jsx
try { (() => {
/* écoles360 — School detail / profile. window.DetailScreen */
(function () {
  const {
    Button,
    Badge,
    Tag,
    Tabs
  } = window.Coles360DesignSystem_f0cdf0;
  function DetailScreen({
    go,
    school
  }) {
    const s = school || {};
    const [tab, setTab] = React.useState('about');
    const tabs = [{
      key: 'about',
      label: 'À propos'
    }, {
      key: 'fil',
      label: 'Filières'
    }, {
      key: 'fees',
      label: 'Tarifs'
    }, {
      key: 'avis',
      label: 'Avis'
    }];
    const panel = {
      about: /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 15,
          lineHeight: 1.7,
          color: 'var(--c-ink-700)',
          margin: 0
        }
      }, s.name, " est un \xE9tablissement priv\xE9 reconnu \xE0 ", s.city, ", alliant excellence acad\xE9mique et encadrement de proximit\xE9. Locaux modernes, \xE9quipe p\xE9dagogique exp\xE9riment\xE9e et suivi individualis\xE9 des \xE9l\xE8ves."),
      fil: /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8
        }
      }, (s.filieres || []).map(f => /*#__PURE__*/React.createElement(Tag, {
        key: f
      }, f))),
      fees: /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15
        }
      }, "Frais de scolarit\xE9 : ", /*#__PURE__*/React.createElement("strong", null, s.fees), ". Frais d'inscription annuels et assurance non inclus. Facilit\xE9s de paiement disponibles."),
      avis: /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }
      }, [['Karima B.', '★★★★★', 'Très bon encadrement, équipe à l\'écoute.'], ['Youssef T.', '★★★★☆', 'Très bon niveau, tarifs un peu élevés.']].map(([n, st, txt]) => /*#__PURE__*/React.createElement("div", {
        key: n,
        style: {
          border: '1px solid var(--c-border-soft)',
          borderRadius: 11,
          padding: '14px 16px'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 3
        }
      }, n, " ", /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--c-amber)',
          fontWeight: 400
        }
      }, st)), /*#__PURE__*/React.createElement("div", {
        style: {
          color: 'var(--c-gray-600)',
          fontSize: 13
        }
      }, txt))))
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--c-surface-soft)',
        minHeight: '80vh',
        paddingBottom: 56
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: '24px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--c-gray-400)',
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("a", {
      onClick: () => go('home'),
      style: {
        cursor: 'pointer'
      }
    }, "Accueil"), " \u203A ", /*#__PURE__*/React.createElement("a", {
      onClick: () => go('results'),
      style: {
        cursor: 'pointer'
      }
    }, "\xC9tablissements"), " \u203A ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-ink)'
      }
    }, s.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 180,
        background: 'var(--c-placeholder-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/icons/school-building.svg",
      width: "54",
      height: "54",
      alt: "",
      style: {
        opacity: 0.8
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "e-detail-head",
      style: {
        padding: '24px 28px'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 7,
        marginBottom: 10
      }
    }, s.sponsored ? /*#__PURE__*/React.createElement(Badge, {
      solid: true
    }, "Sponsoris\xE9") : null, s.verified ? /*#__PURE__*/React.createElement(Badge, {
      tone: "green",
      icon: "\u2713"
    }, "V\xE9rifi\xE9") : null, /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, s.type)), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: '-0.5px',
        margin: '0 0 8px'
      }
    }, s.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontSize: 14,
        color: 'var(--c-gray-600)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-amber)',
        fontWeight: 700,
        fontSize: 15
      }
    }, "\u2605 ", s.rating), /*#__PURE__*/React.createElement("span", null, "(", s.reviews, " avis)"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCD ", s.city, " \xB7 ", s.area))), /*#__PURE__*/React.createElement("div", {
      className: "e-detail-actions"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "navy",
      icon: "\uD83D\uDCDE"
    }, "Appeler"), /*#__PURE__*/React.createElement(Button, {
      variant: "success"
    }, "WhatsApp"), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      icon: "\uD83C\uDF10"
    }, "Site web")))), /*#__PURE__*/React.createElement("div", {
      className: "e-detail-grid"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
        padding: 24
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      items: tabs,
      active: tab,
      onChange: setTab,
      style: {
        marginBottom: 22
      }
    }), panel[tab]), /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
        padding: 24
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        margin: '0 0 16px'
      }
    }, "Coordonn\xE9es"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--c-ink-700)',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--c-gray-400)',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 2
      }
    }, "ADRESSE"), "12 rue des \xC9coles, ", s.city), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--c-ink-700)',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--c-gray-400)',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 2
      }
    }, "T\xC9L\xC9PHONE"), "+212 5 22 25 36 47"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: 'var(--c-ink-700)',
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--c-gray-400)',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 2
      }
    }, "HORAIRES"), "Lun \u2013 Ven : 8h00 \u2013 18h00", /*#__PURE__*/React.createElement("br", null), "Sam : 9h00 \u2013 13h00"), /*#__PURE__*/React.createElement(Button, {
      variant: "success",
      full: true
    }, "Contacter sur WhatsApp")))));
  }
  window.DetailScreen = DetailScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/Detail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/Home.jsx
try { (() => {
/* écoles360 — Home screen. window.HomeScreen */
(function () {
  const {
    Button,
    Select
  } = window.Coles360DesignSystem_f0cdf0;
  function HomeScreen({
    go,
    schools
  }) {
    const featured = schools.filter(s => s.sponsored).concat(schools.filter(s => !s.sponsored)).slice(0, 4);
    const cats = [{
      emoji: '🍼',
      label: 'Crèche'
    }, {
      emoji: '✏️',
      label: 'Primaire'
    }, {
      emoji: '📚',
      label: 'Collège'
    }, {
      emoji: '🎓',
      label: 'Lycée'
    }, {
      emoji: '🏛️',
      label: 'Université'
    }, {
      emoji: '💼',
      label: 'Formation'
    }];
    const steps = [['1', 'Recherchez', "Filtrez par ville, type d'établissement et filière pour trouver les écoles qui vous correspondent."], ['2', 'Comparez', 'Consultez les fiches détaillées : tarifs, filières, avis de parents et photos.'], ['3', 'Contactez', "Appelez ou écrivez directement à l'établissement par téléphone ou WhatsApp, gratuitement."]];
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
      style: {
        background: 'var(--c-surface-soft)',
        padding: 'clamp(40px, 8vw, 80px) 24px clamp(48px, 9vw, 88px)',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-block',
        background: 'var(--c-red-tint)',
        color: 'var(--c-red)',
        fontSize: 13,
        fontWeight: 600,
        padding: '6px 14px',
        borderRadius: 20,
        marginBottom: 20
      }
    }, "+ 1 200 \xE9tablissements r\xE9f\xE9renc\xE9s au Maroc"), /*#__PURE__*/React.createElement("h1", {
      className: "e-hero-title",
      style: {
        lineHeight: 1.1,
        fontWeight: 800,
        maxWidth: 760,
        margin: '0 auto 16px'
      }
    }, "Trouvez la bonne \xE9cole pour votre enfant"), /*#__PURE__*/React.createElement("p", {
      className: "e-hero-sub",
      style: {
        color: 'var(--c-gray-600)',
        maxWidth: 560,
        margin: '0 auto'
      }
    }, "Comparez cr\xE8ches, \xE9coles, lyc\xE9es et universit\xE9s priv\xE9s pr\xE8s de chez vous. En toute confiance."), /*#__PURE__*/React.createElement("div", {
      className: "e-hero-search",
      style: {
        display: 'flex',
        gap: 8,
        background: '#fff',
        padding: 10,
        borderRadius: 16,
        boxShadow: 'var(--shadow-float)',
        maxWidth: 880,
        margin: '34px auto 0',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("input", {
      placeholder: "Nom d'\xE9tablissement ou mot-cl\xE9",
      style: {
        flex: 2,
        border: 'none',
        outline: 'none',
        fontSize: 15,
        padding: '14px 12px',
        fontFamily: 'var(--font-sans)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "e-hero-div",
      style: {
        width: 1,
        height: 28,
        background: 'var(--c-border)'
      }
    }), /*#__PURE__*/React.createElement("select", {
      style: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: 15,
        padding: '14px 8px',
        background: '#fff',
        cursor: 'pointer',
        color: 'var(--c-gray-600)',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("option", null, "Ville"), /*#__PURE__*/React.createElement("option", null, "Casablanca"), /*#__PURE__*/React.createElement("option", null, "Rabat"), /*#__PURE__*/React.createElement("option", null, "F\xE8s")), /*#__PURE__*/React.createElement("select", {
      style: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: 15,
        padding: '14px 8px',
        background: '#fff',
        cursor: 'pointer',
        color: 'var(--c-gray-600)',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("option", null, "Type"), /*#__PURE__*/React.createElement("option", null, "Cr\xE8che"), /*#__PURE__*/React.createElement("option", null, "Primaire"), /*#__PURE__*/React.createElement("option", null, "Lyc\xE9e"), /*#__PURE__*/React.createElement("option", null, "Universit\xE9")), /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      onClick: () => go('results')
    }, "Rechercher"))), /*#__PURE__*/React.createElement("section", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: '56px 24px 8px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "e-catgrid"
    }, cats.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.label,
      onClick: () => go('results'),
      className: "cat",
      style: {
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        padding: '22px 12px',
        textAlign: 'center',
        cursor: 'pointer',
        background: '#fff',
        transition: 'var(--transition)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 26,
        marginBottom: 8
      }
    }, c.emoji), /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        fontSize: 14
      }
    }, c.label))))), /*#__PURE__*/React.createElement("section", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: '48px 24px 24px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 24
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.5px',
        margin: '0 0 6px'
      }
    }, "\xC9tablissements \xE0 la une"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-gray-600)',
        margin: 0,
        fontSize: 15
      }
    }, "Une s\xE9lection d'\xE9tablissements v\xE9rifi\xE9s et recommand\xE9s")), /*#__PURE__*/React.createElement("a", {
      onClick: () => go('results'),
      style: {
        color: 'var(--c-navy)',
        fontWeight: 600,
        fontSize: 15,
        cursor: 'pointer'
      }
    }, "Tout voir \u2192")), /*#__PURE__*/React.createElement("div", {
      className: "e-cardgrid"
    }, featured.map(s => /*#__PURE__*/React.createElement(window.SchoolCard, {
      key: s.id,
      item: s,
      onOpen: () => go('detail', s)
    })))), /*#__PURE__*/React.createElement("section", {
      style: {
        background: 'var(--c-surface-soft)',
        marginTop: 48,
        padding: '64px 24px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1000,
        margin: '0 auto',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.5px',
        margin: '0 0 48px'
      }
    }, "Comment \xE7a marche"), /*#__PURE__*/React.createElement("div", {
      className: "e-steps"
    }, steps.map(([n, t, d]) => /*#__PURE__*/React.createElement("div", {
      key: n
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: '#fff',
        border: '2px solid var(--c-red)',
        color: 'var(--c-red)',
        fontWeight: 800,
        fontSize: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 18px'
      }
    }, n), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 17,
        fontWeight: 700,
        margin: '0 0 8px'
      }
    }, t), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-gray-600)',
        fontSize: 14,
        lineHeight: 1.6,
        margin: 0
      }
    }, d)))))));
  }
  window.HomeScreen = HomeScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/Results.jsx
try { (() => {
/* écoles360 — Results screen (filters + list). window.ResultsScreen */
(function () {
  const {
    Button,
    Select,
    Checkbox,
    Pagination
  } = window.Coles360DesignSystem_f0cdf0;
  function ResultsScreen({
    go,
    schools
  }) {
    const [types, setTypes] = React.useState([]);
    const [city, setCity] = React.useState('');
    const [minRating, setMinRating] = React.useState(0);
    const [page, setPage] = React.useState(1);
    const [showFilters, setShowFilters] = React.useState(false);
    const toggle = t => setTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
    let list = schools.filter(s => (types.length === 0 || types.includes(s.type)) && (!city || s.city === city) && s.ratingN >= minRating);
    list = list.slice().sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0));
    const allTypes = ['Crèche', 'Primaire', 'Collège', 'Lycée', 'Université', 'Formation'];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--c-surface-soft)',
        minHeight: '80vh'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        padding: '28px 24px 64px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--c-gray-400)',
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("a", {
      onClick: () => go('home'),
      style: {
        cursor: 'pointer'
      }
    }, "Accueil"), " \u203A ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-ink)'
      }
    }, "\xC9tablissements")), /*#__PURE__*/React.createElement("button", {
      className: "e-filter-toggle e360-touch",
      onClick: () => setShowFilters(v => !v),
      style: {
        width: '100%',
        justifyContent: 'space-between',
        padding: '0 16px',
        marginBottom: 16,
        border: '1px solid var(--c-border-strong)',
        borderRadius: 10,
        background: '#fff',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--c-ink)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", null, "\u2699 Filtres"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-gray-400)'
      }
    }, showFilters ? '✕' : '›')), /*#__PURE__*/React.createElement("div", {
      className: "e-results"
    }, /*#__PURE__*/React.createElement("aside", {
      className: 'e-aside' + (showFilters ? '' : ' is-collapsed'),
      style: {
        background: '#fff',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
        padding: 22,
        position: 'sticky',
        top: 88
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        margin: '0 0 18px'
      }
    }, "Filtres"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Ville",
      value: city,
      onChange: e => setCity(e.target.value),
      options: [{
        value: '',
        label: 'Toutes les villes'
      }, 'Casablanca', 'Rabat', 'Fès']
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--c-gray-600)',
        marginBottom: 9
      }
    }, "Type d'\xE9tablissement"), allTypes.map(t => /*#__PURE__*/React.createElement(Checkbox, {
      key: t,
      label: t,
      checked: types.includes(t),
      onChange: () => toggle(t)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--c-gray-600)',
        marginBottom: 7
      }
    }, "Budget mensuel (MAD)"), /*#__PURE__*/React.createElement("input", {
      type: "range",
      min: "0",
      max: "5000",
      style: {
        width: '100%',
        accentColor: 'var(--c-red)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--c-gray-400)'
      }
    }, /*#__PURE__*/React.createElement("span", null, "0"), /*#__PURE__*/React.createElement("span", null, "5 000+"))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 22
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Note minimale",
      value: String(minRating),
      onChange: e => setMinRating(parseFloat(e.target.value)),
      options: [{
        value: '0',
        label: 'Toutes les notes'
      }, {
        value: '4',
        label: '★ 4 et plus'
      }, {
        value: '4.5',
        label: '★ 4,5 et plus'
      }]
    })), /*#__PURE__*/React.createElement(Button, {
      full: true
    }, "Appliquer les filtres")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "e-results-head",
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        color: 'var(--c-gray-600)'
      }
    }, /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--c-ink)'
      }
    }, list.length, " \xE9tablissements"), " trouv\xE9s"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-gray-400)'
      }
    }, "Trier par"), /*#__PURE__*/React.createElement(Select, {
      options: ['Pertinence', 'Note la plus élevée', 'Prix croissant']
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, list.map(s => /*#__PURE__*/React.createElement(window.SchoolRow, {
      key: s.id,
      item: s,
      onOpen: () => go('detail', s)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 32
      }
    }, /*#__PURE__*/React.createElement(Pagination, {
      page: page,
      count: 3,
      onChange: setPage
    }))))));
  }
  window.ResultsScreen = ResultsScreen;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/Results.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/SchoolCard.jsx
try { (() => {
/* écoles360 — school result card (vertical & horizontal). window.SchoolCard */
(function () {
  const {
    Card,
    Badge,
    Tag
  } = window.Coles360DesignSystem_f0cdf0;
  function SchoolThumb({
    height = 140,
    width
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        height,
        width,
        flex: width ? 'none' : undefined,
        background: 'var(--c-placeholder-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/icons/school-building.svg",
      width: "40",
      height: "40",
      alt: "",
      style: {
        opacity: 0.85
      }
    }));
  }
  function Stars({
    rating,
    reviews
  }) {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-amber)'
      }
    }, "\u2605"), /*#__PURE__*/React.createElement("strong", {
      style: {
        fontWeight: 700
      }
    }, rating), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-gray-400)',
        fontSize: 13
      }
    }, "(", reviews, " avis)"));
  }

  /* Vertical featured card */
  function SchoolCard({
    item,
    onOpen
  }) {
    return /*#__PURE__*/React.createElement(Card, {
      hover: true,
      pad: 0,
      onClick: onOpen
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(SchoolThumb, null), item.sponsored ? /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 10,
        left: 10
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      solid: true
    }, "Sponsoris\xE9")) : null), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement(Stars, {
      rating: item.rating,
      reviews: item.reviews
    }), item.verified ? /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        color: 'var(--c-green)',
        fontSize: 12,
        fontWeight: 600
      }
    }, "\u2713 V\xE9rifi\xE9") : null), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 16,
        fontWeight: 700,
        margin: '0 0 4px'
      }
    }, item.name), /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--c-gray-600)',
        fontSize: 13,
        marginBottom: 12
      }
    }, "\uD83D\uDCCD ", item.city, " \xB7 ", item.area), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
      }
    }, item.filieres.map(f => /*#__PURE__*/React.createElement(Tag, {
      key: f
    }, f)))));
  }

  /* Horizontal list row */
  function SchoolRow({
    item,
    onOpen
  }) {
    const {
      Button
    } = window.Coles360DesignSystem_f0cdf0;
    return /*#__PURE__*/React.createElement(Card, {
      hover: true,
      pad: 0,
      sponsored: item.sponsored,
      onClick: onOpen
    }, /*#__PURE__*/React.createElement("div", {
      className: "e-row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "e-row-thumb"
    }, /*#__PURE__*/React.createElement(SchoolThumb, {
      width: "100%",
      height: 140
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        padding: '18px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 7,
        marginBottom: 9
      }
    }, item.sponsored ? /*#__PURE__*/React.createElement(Badge, {
      solid: true
    }, "Sponsoris\xE9") : null, item.verified ? /*#__PURE__*/React.createElement(Badge, {
      tone: "green",
      icon: "\u2713"
    }, "V\xE9rifi\xE9") : null, /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, item.type)), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 18,
        fontWeight: 700,
        margin: '0 0 5px'
      }
    }, item.name), /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--c-gray-600)',
        fontSize: 14,
        marginBottom: 10
      }
    }, "\uD83D\uDCCD ", item.city, " \xB7 ", item.area), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Stars, {
      rating: item.rating,
      reviews: item.reviews
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        color: 'var(--c-gray-600)'
      }
    }, "\xB7"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14
      }
    }, "\xE0 partir de ", /*#__PURE__*/React.createElement("strong", null, item.fees)))), /*#__PURE__*/React.createElement("div", {
      className: "e-row-actions",
      style: {
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "navy",
      size: "sm",
      icon: "\uD83D\uDCDE",
      full: true
    }, "Appeler"), /*#__PURE__*/React.createElement(Button, {
      variant: "success",
      size: "sm",
      full: true
    }, "WhatsApp"))));
  }
  Object.assign(window, {
    SchoolCard,
    SchoolRow,
    SchoolThumb,
    Stars
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/SchoolCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/public-site/SiteChrome.jsx
try { (() => {
/* écoles360 public site — header + footer chrome.
   Exposes window.SiteHeader / window.SiteFooter. */
(function () {
  const {
    Button
  } = window.Coles360DesignSystem_f0cdf0;
  function SiteHeader({
    go
  }) {
    const [open, setOpen] = React.useState(false);
    const link = {
      cursor: 'pointer',
      fontSize: 15,
      fontWeight: 500
    };
    const close = s => {
      setOpen(false);
      go(s);
    };
    return /*#__PURE__*/React.createElement("header", {
      className: "e-header",
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px clamp(16px, 4vw, 40px)',
        background: '#fff',
        borderBottom: '1px solid var(--c-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => go('home'),
      style: {
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 23,
        letterSpacing: '-0.6px'
      }
    }, "\xE9coles", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-red)'
      }
    }, "360")), /*#__PURE__*/React.createElement("nav", {
      className: "e-nav-desktop",
      style: {
        display: 'flex',
        gap: 34
      }
    }, /*#__PURE__*/React.createElement("a", {
      onClick: () => go('home'),
      style: link
    }, "Accueil"), /*#__PURE__*/React.createElement("a", {
      onClick: () => go('results'),
      style: link
    }, "\xC9tablissements"), /*#__PURE__*/React.createElement("a", {
      style: {
        ...link,
        color: 'var(--c-gray-600)'
      }
    }, "Blog"), /*#__PURE__*/React.createElement("a", {
      style: {
        ...link,
        color: 'var(--c-gray-600)'
      }
    }, "\xC0 propos")), /*#__PURE__*/React.createElement("div", {
      className: "e-header-cta"
    }, /*#__PURE__*/React.createElement(Button, {
      onClick: () => go('login')
    }, "Inscrire mon \xE9tablissement")), /*#__PURE__*/React.createElement("button", {
      className: "e-burger e360-touch",
      onClick: () => setOpen(true),
      "aria-label": "Menu",
      style: {
        border: '1px solid var(--c-border)',
        background: '#fff',
        borderRadius: 10,
        cursor: 'pointer',
        color: 'var(--c-ink)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 6h18M3 12h18M3 18h18"
    }))), /*#__PURE__*/React.createElement("div", {
      onClick: () => setOpen(false),
      style: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,26,.4)',
        zIndex: 60,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .2s ease'
      }
    }), /*#__PURE__*/React.createElement("nav", {
      style: {
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(86vw, 300px)',
        background: '#fff',
        zIndex: 61,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .24s cubic-bezier(.4,0,.2,1)',
        boxShadow: '-8px 0 30px rgba(26,26,26,.12)',
        display: 'flex',
        flexDirection: 'column',
        padding: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 800,
        fontSize: 21,
        letterSpacing: '-0.6px'
      }
    }, "\xE9coles", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-red)'
      }
    }, "360")), /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(false),
      "aria-label": "Fermer",
      className: "e360-touch",
      style: {
        border: 'none',
        background: 'none',
        fontSize: 26,
        lineHeight: 1,
        color: 'var(--c-gray-600)',
        cursor: 'pointer'
      }
    }, "\xD7")), [['Accueil', 'home'], ['Établissements', 'results'], ['Blog', null], ['À propos', null]].map(([label, dest]) => /*#__PURE__*/React.createElement("a", {
      key: label,
      onClick: () => dest && close(dest),
      className: "e360-touch",
      style: {
        justifyContent: 'flex-start',
        padding: '0 10px',
        borderRadius: 10,
        fontSize: 16,
        fontWeight: dest ? 600 : 500,
        color: dest ? 'var(--c-ink)' : 'var(--c-gray-600)',
        cursor: 'pointer'
      }
    }, label)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      full: true,
      onClick: () => close('login')
    }, "Inscrire mon \xE9tablissement"))));
  }
  function SiteFooter({
    go
  }) {
    return /*#__PURE__*/React.createElement("footer", {
      style: {
        background: 'var(--c-ink)',
        color: '#fff',
        padding: '48px 40px',
        marginTop: 56
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "e-footer-cols",
      style: {
        maxWidth: 1180,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 32
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 280
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 800,
        fontSize: 22,
        marginBottom: 12
      }
    }, "\xE9coles", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--c-red)'
      }
    }, "360")), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--c-gray-400)',
        fontSize: 14,
        lineHeight: 1.7,
        margin: 0
      }
    }, "L'annuaire de r\xE9f\xE9rence des \xE9tablissements scolaires priv\xE9s au Maroc.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 56,
        fontSize: 14
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        marginBottom: 12
      }
    }, "Parents"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        color: 'var(--c-gray-400)'
      }
    }, /*#__PURE__*/React.createElement("a", {
      onClick: () => go('results'),
      style: {
        cursor: 'pointer'
      }
    }, "Rechercher"), /*#__PURE__*/React.createElement("a", {
      style: {
        cursor: 'pointer'
      }
    }, "Comparer"), /*#__PURE__*/React.createElement("a", {
      style: {
        cursor: 'pointer'
      }
    }, "Blog"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        marginBottom: 12
      }
    }, "\xC9tablissements"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        color: 'var(--c-gray-400)'
      }
    }, /*#__PURE__*/React.createElement("a", {
      onClick: () => go('login'),
      style: {
        cursor: 'pointer'
      }
    }, "S'inscrire"), /*#__PURE__*/React.createElement("a", {
      onClick: () => go('login'),
      style: {
        cursor: 'pointer'
      }
    }, "Espace pro"), /*#__PURE__*/React.createElement("a", {
      style: {
        cursor: 'pointer'
      }
    }, "Tarifs"))))));
  }
  Object.assign(window, {
    SiteHeader,
    SiteFooter
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/public-site/SiteChrome.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatCard = __ds_scope.StatCard;

})();
