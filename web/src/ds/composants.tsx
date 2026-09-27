import { createElement, type ReactNode } from 'react';
import { composant } from './index';

/**
 * Composants du design system écoles360 — livrable 12 §1.
 *
 * LES PROPS SONT CELLES DU BUNDLE, PAS LES MIENNES. Chaque signature ci-dessous
 * est recopiée de `docs/design-system/_ds_bundle.js` : renommer `name` en `nom`
 * ferait diverger le code des maquettes et casserait silencieusement le rendu,
 * puisque le bundle lit ses props par leur nom d'origine.
 *
 * LE COMPOSANT EST RÉSOLU AU RENDU, PAS À L'IMPORT. `main.tsx` attend
 * `chargerDesignSystem()` avant de monter React, mais l'évaluation des modules
 * a lieu AVANT cet await : résoudre ici, au niveau module, lèverait « composant
 * absent » au chargement de la page.
 */

function duDs<P extends object>(nom: string) {
  return function Enveloppe(props: P) {
    return createElement(composant<P>(nom), props);
  };
}

export interface ProprietesEstablishmentCard {
  name: string;
  city: string;
  type: string;
  /** Chaîne déjà formatée à la française — « 4,8 ». */
  rating: string;
  reviews?: number;
  image?: string | null;
  sponsored?: boolean;
  verified?: boolean;
  price?: string | null;
  tags?: string[];
  layout?: 'grid' | 'row';
  onCall?: () => void;
  onWhatsApp?: () => void;
  onView?: () => void;
  style?: React.CSSProperties;
}

export const EstablishmentCard = duDs<ProprietesEstablishmentCard>('EstablishmentCard');

export interface ProprietesCityCard {
  city: string;
  count?: number | string;
  /**
   * Libellé accolé au compteur — « quartiers », « filières »…
   *
   * Ajouté au design system par `docs/design-system/appliquer-correctifs.mjs` :
   * le composant écrivait « établissements » en dur, ce qui le réservait aux
   * villes. Sans cette propriété, le libellé se met au pluriel dès deux.
   */
  label?: string;
  image?: string | null;
  height?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const CityCard = duDs<ProprietesCityCard>('CityCard');

export interface ProprietesReviewCard {
  author: string;
  date: string;
  rating?: number;
  body: string;
  reply?: string | null;
  status?: string | null;
  flagged?: boolean;
  style?: React.CSSProperties;
}

export const ReviewCard = duDs<ProprietesReviewCard>('ReviewCard');

export interface ProprietesButton {
  children: ReactNode;
  variant?: 'primary' | 'navy' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Button = duDs<ProprietesButton>('Button');

export interface ProprietesBadge {
  children: ReactNode;
  tone?: 'navy' | 'red' | 'green' | 'amber' | 'grey';
  solid?: boolean;
  dot?: boolean;
  icon?: ReactNode;
  style?: React.CSSProperties;
}

export const Badge = duDs<ProprietesBadge>('Badge');

export interface ProprietesTag {
  children: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  active?: boolean;
  style?: React.CSSProperties;
}

export const Tag = duDs<ProprietesTag>('Tag');

export interface ProprietesIcon {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: React.CSSProperties;
}

export const Icon = duDs<ProprietesIcon>('Icon');

export interface ProprietesInput {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  type?: string;
  icon?: ReactNode;
  error?: string;
  disabled?: boolean;
  onChange?: (evenement: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
}

export const Input = duDs<ProprietesInput>('Input');

export interface ProprietesTextarea {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  rows?: number;
  disabled?: boolean;
  onChange?: (evenement: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
}

export const Textarea = duDs<ProprietesTextarea>('Textarea');

export interface ProprietesSelect {
  label?: string;
  required?: boolean;
  value?: string;
  onChange?: (evenement: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  icon?: ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Select = duDs<ProprietesSelect>('Select');

export interface ProprietesCheckbox {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (evenement: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Checkbox = duDs<ProprietesCheckbox>('Checkbox');

export interface ProprietesPagination {
  page?: number;
  pageCount?: number;
  onChange?: (page: number) => void;
  style?: React.CSSProperties;
}

export const Pagination = duDs<ProprietesPagination>('Pagination');

export interface ProprietesEmptyState {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  style?: React.CSSProperties;
}

export const EmptyState = duDs<ProprietesEmptyState>('EmptyState');

export interface ProprietesSkeletonCard {
  style?: React.CSSProperties;
}

export const SkeletonCard = duDs<ProprietesSkeletonCard>('SkeletonCard');

export interface ProprietesRatingBreakdown {
  average: number | string;
  total: number;
  /** Cinq entiers, de 1 à 5 étoiles. */
  distribution?: number[];
  style?: React.CSSProperties;
}

export const RatingBreakdown = duDs<ProprietesRatingBreakdown>('RatingBreakdown');

export interface ProprietesFaqAccordion {
  items?: { q: string; a: string }[];
  defaultOpen?: number;
  allowMultiple?: boolean;
  style?: React.CSSProperties;
}

export const FaqAccordion = duDs<ProprietesFaqAccordion>('FaqAccordion');

export interface ProprietesEquipmentItem {
  icon?: ReactNode;
  label: string;
  available?: boolean;
  style?: React.CSSProperties;
}

export const EquipmentItem = duDs<ProprietesEquipmentItem>('EquipmentItem');

export interface ProprietesStatCard {
  label: string;
  value: string | number;
  delta?: string | null;
  deltaDir?: 'up' | 'down';
  icon?: ReactNode;
  tone?: 'navy' | 'red' | 'green' | 'amber';
  style?: React.CSSProperties;
}

export const StatCard = duDs<ProprietesStatCard>('StatCard');

export interface ProprietesTabs {
  tabs?: { key: string; label: string; count?: number }[];
  value?: string;
  onChange?: (cle: string) => void;
  style?: React.CSSProperties;
}

export const Tabs = duDs<ProprietesTabs>('Tabs');

export interface ProprietesWordmark {
  size?: number;
  onDark?: boolean;
  style?: React.CSSProperties;
}

export const Wordmark = duDs<ProprietesWordmark>('Wordmark');

export interface ProprietesVideoEmbed {
  src: string;
  poster?: string | null;
  title?: string;
  ratio?: string;
  style?: React.CSSProperties;
}

export const VideoEmbed = duDs<ProprietesVideoEmbed>('VideoEmbed');

// ---------------------------------------------------------------------------
//  Espace connecté — livrable 12 §3
// ---------------------------------------------------------------------------

export interface ProprietesSidebarNav {
  theme?: 'etablissement' | 'secretariat' | 'administration' | 'commercial';
  items?: { key: string; label: string; icon?: ReactNode; count?: number }[];
  activeKey?: string;
  onSelect?: (cle: string) => void;
  user?: { name: string; role: string };
  logoSrc?: string | null;
  width?: number;
  style?: React.CSSProperties;
}

export const SidebarNav = duDs<ProprietesSidebarNav>('SidebarNav');

export interface ProprietesBarChart {
  data?: { label: string; value: number }[];
  currentIndex?: number;
  height?: number;
  valueFormat?: (valeur: number) => string | number;
  style?: React.CSSProperties;
}

export const BarChart = duDs<ProprietesBarChart>('BarChart');

export interface ProprietesModal {
  open?: boolean;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  width?: number;
  style?: React.CSSProperties;
}

export const Modal = duDs<ProprietesModal>('Modal');

export interface ProprietesRequestCard {
  name: string;
  /** Le composant indexe ses icônes sur ces libellés exacts. */
  channel?: 'Formulaire' | 'Appel' | 'WhatsApp' | 'Email';
  message?: string;
  time?: string;
  /** Idem pour la teinte du badge de statut. */
  status?: 'Nouveau' | 'En cours' | 'Traité';
  onOpen?: () => void;
  style?: React.CSSProperties;
}

export const RequestCard = duDs<ProprietesRequestCard>('RequestCard');

export interface ProprietesToast {
  tone?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export const Toast = duDs<ProprietesToast>('Toast');

export interface ProprietesDataTable<L = Record<string, unknown>> {
  /**
   * `header` et non `label` : c'est la clé que lit le bundle (`col.header`).
   * Typée `label`, elle laissait passer des colonnes sans en-tête affiché.
   */
  columns?: {
    key: string;
    header?: ReactNode;
    align?: 'left' | 'right' | 'center';
    render?: (ligne: L) => ReactNode;
  }[];
  rows?: L[];
  /** Largeur en deçà de laquelle le tableau s'empile en cartes. */
  stackAt?: number;
  rowKey?: string;
  style?: React.CSSProperties;
}

export const DataTable = duDs<ProprietesDataTable>('DataTable');

export interface ProprietesSourceBars {
  /** Les parts sont calculées sur le total des `value`. */
  data?: { label: string; value: number; tone?: 'green' | 'navy' | 'red' | 'amber' }[];
  showShare?: boolean;
  style?: React.CSSProperties;
}

export const SourceBars = duDs<ProprietesSourceBars>('SourceBars');

export interface ProprietesProgressBar {
  value?: number;
  max?: number;
  tone?: 'red' | 'navy' | 'green' | 'amber';
  height?: number;
  label?: ReactNode;
  showValue?: boolean;
  style?: React.CSSProperties;
}

export const ProgressBar = duDs<ProprietesProgressBar>('ProgressBar');

export interface ProprietesAvatar {
  name?: string;
  src?: string | null;
  size?: number;
  style?: React.CSSProperties;
}

export const Avatar = duDs<ProprietesAvatar>('Avatar');

// ---------------------------------------------------------------------------
//  Présents dans le bundle, typés sans être encore employés.
//
//  Signatures relevées dans `web/public/ds/bundle.js`, pas dans les `.d.ts`
//  du skill : quand les deux divergent, c'est le bundle que le navigateur
//  exécute. Les écarts relevés sont consignés dans CORRECTIFS.md.
// ---------------------------------------------------------------------------

// ---- Recherche --------------------------------------------------------------

export interface ProprietesFilterBar {
  filters?: { key: string; label: string; active?: boolean }[];
  onToggle?: (cle: string) => void;
  onApply?: () => void;
  /** Sans lui, le bouton « Réinitialiser » n'est pas rendu. */
  onReset?: () => void;
  applyLabel?: string;
  resetLabel?: string;
  style?: React.CSSProperties;
}

export const FilterBar = duDs<ProprietesFilterBar>('FilterBar');

export interface ProprietesTypePicker {
  /**
   * À FOURNIR TOUJOURS. La liste par défaut du bundle n'a que six types :
   * `superieur` y manque, alors que la RG02 en pose sept. La dériver de
   * `LIBELLE_TYPE`.
   */
  types?: { key: string; label: string; icon?: ReactNode }[];
  /** Le bundle accepte aussi une clé seule, qu'il met en tableau. */
  value?: string | string[];
  multi?: boolean;
  /** Toujours un tableau, même hors `multi` : vide quand on désélectionne. */
  onChange?: (cles: string[]) => void;
  columns?: number;
  style?: React.CSSProperties;
}

export const TypePicker = duDs<ProprietesTypePicker>('TypePicker');

export interface ProprietesCitySelect {
  label?: string;
  /**
   * Le NOM de la ville, pas son slug : les options portent le libellé comme
   * valeur. Convertir avant d'appeler l'API, qui filtre par slug.
   */
  value?: string;
  defaultValue?: string;
  onChange?: (evenement: React.ChangeEvent<HTMLSelectElement>) => void;
  /**
   * À FOURNIR TOUJOURS. Par défaut, douze villes figées dans le bundle :
   * une ville ajoutée en base n'y apparaîtrait jamais.
   */
  cities?: string[];
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

export const CitySelect = duDs<ProprietesCitySelect>('CitySelect');

// ---- Navigation -------------------------------------------------------------

export interface ProprietesHeader {
  /**
   * Des `<a href>` natifs, pas des `Link` du routeur : un clic recharge
   * toute l'application. À réserver aux pages hors du routeur.
   */
  items?: { label: string; href?: string; active?: boolean }[];
  cta?: ReactNode;
  onCta?: () => void;
  logoSrc?: string | null;
  style?: React.CSSProperties;
}

export const Header = duDs<ProprietesHeader>('Header');

export interface ProprietesBreadcrumb {
  /** Le dernier élément, et tout élément sans `href`, s'affiche en texte. */
  items?: { label: string; href?: string }[];
  style?: React.CSSProperties;
}

export const Breadcrumb = duDs<ProprietesBreadcrumb>('Breadcrumb');

export interface ProprietesBottomTabBar {
  items?: { key: string; label: string; icon?: ReactNode; count?: number }[];
  activeKey?: string;
  onSelect?: (cle: string) => void;
  style?: React.CSSProperties;
}

export const BottomTabBar = duDs<ProprietesBottomTabBar>('BottomTabBar');

export interface ProprietesStepper {
  steps?: { label: string }[];
  /** Rang de l'étape en cours, à partir de 0 ; celles d'avant sont cochées. */
  current?: number;
  orientation?: 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

export const Stepper = duDs<ProprietesStepper>('Stepper');

// ---- Fiche et vitrine -------------------------------------------------------

export interface ProprietesPricingCard {
  name: string;
  /** Rendu tel quel : le formater avant (`formaterMad`). */
  price: ReactNode;
  unit?: string;
  /** Nul : la ligne « crédits » est remplacée par un espace de même hauteur. */
  credits?: number | null;
  /** Chaque intitulé sert aussi de clé React : deux identiques se confondraient. */
  features?: string[];
  popular?: boolean;
  cta?: ReactNode;
  onSelect?: () => void;
  style?: React.CSSProperties;
}

export const PricingCard = duDs<ProprietesPricingCard>('PricingCard');

export interface ProprietesTeamMember {
  name: string;
  role: string;
  /** Sans photo, les initiales du nom. */
  photo?: string | null;
  style?: React.CSSProperties;
}

export const TeamMember = duDs<ProprietesTeamMember>('TeamMember');

export interface ProprietesSocialLinks {
  /**
   * Un `type` connu donne libellé, icône et teinte ; sinon `label` et `glyph`.
   * `facebook` et `instagram` s'affichent avec les icônes génériques
   * « users » et « heart » : le jeu d'icônes n'a pas leurs logos.
   */
  links?: {
    type?: 'whatsapp' | 'phone' | 'website' | 'facebook' | 'instagram' | 'email';
    href?: string;
    label?: string;
    glyph?: ReactNode;
  }[];
  size?: number;
  style?: React.CSSProperties;
}

export const SocialLinks = duDs<ProprietesSocialLinks>('SocialLinks');

// ---- Retour d'état ----------------------------------------------------------

export interface ProprietesSkeleton {
  variant?: 'text' | 'rect' | 'circle';
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}

export const Skeleton = duDs<ProprietesSkeleton>('Skeleton');

export interface ProprietesProfileUnavailable {
  title?: string;
  message?: string;
  note?: string;
  /** `false` retire le bloc image ; `null` y dessine une icône de bâtiment. */
  image?: string | null | false;
  searchLabel?: string;
  contactLabel?: string;
  onSearch?: () => void;
  onContact?: () => void;
  /**
   * Par défaut, une MODALE plein écran (`position: fixed`, voile flouté) :
   * rendue dans une page, elle en masquerait tout le contenu. `false`
   * l'intègre au flux.
   */
  overlay?: boolean;
  /** Posé sur le voile en surimpression, sur la carte sinon. */
  style?: React.CSSProperties;
}

export const ProfileUnavailable = duDs<ProprietesProfileUnavailable>('ProfileUnavailable');

// ---- Administration ---------------------------------------------------------

export interface ProprietesPermissionToggle {
  label?: ReactNode;
  description?: string;
  /** Fourni, le composant est contrôlé ; sinon il garde son propre état. */
  checked?: boolean;
  defaultChecked?: boolean;
  /** Reçoit le nouvel état, pas l'événement. */
  onChange?: (active: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const PermissionToggle = duDs<ProprietesPermissionToggle>('PermissionToggle');
