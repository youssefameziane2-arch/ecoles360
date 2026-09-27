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
  columns?: { key: string; label?: string; render?: (ligne: L) => ReactNode }[];
  rows?: L[];
  /** Largeur en deçà de laquelle le tableau s'empile en cartes. */
  stackAt?: number;
  rowKey?: string;
  style?: React.CSSProperties;
}

export const DataTable = duDs<ProprietesDataTable>('DataTable');

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
