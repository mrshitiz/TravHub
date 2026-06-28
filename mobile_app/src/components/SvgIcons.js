import React from 'react';
import { Platform, Text } from 'react-native';

/**
 * Pure SVG icon system — no font files needed.
 * Works instantly on web/PWA without any font loading.
 * Each icon is an inline SVG rendered via dangerouslySetInnerHTML on web.
 */

const SvgIcon = ({ svgContent, size = 24, color = '#9ca3af', style = {} }) => {
  if (Platform.OS === 'web') {
    return (
      <div
        style={{ 
          width: size, 
          height: size, 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          ...style 
        }}
        dangerouslySetInnerHTML={{
          __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>`
        }}
      />
    );
  }
  return <Text style={{ fontSize: size, color, ...style }}>•</Text>;
};

// Filled SVG helper (no stroke, uses fill)
const SvgIconFilled = ({ svgContent, size = 24, color = '#9ca3af', style = {} }) => {
  if (Platform.OS === 'web') {
    return (
      <div
        style={{ 
          width: size, 
          height: size, 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          ...style 
        }}
        dangerouslySetInnerHTML={{
          __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${svgContent}</svg>`
        }}
      />
    );
  }
  return <Text style={{ fontSize: size, color, ...style }}>•</Text>;
};

// ─── Navigation Icons ─────────────────────────────────────────

export const HomeIcon = ({ size = 24, color = '#4b5563', active }) => {
  const c = active ? '#0ea5e9' : color;
  return active
    ? <SvgIconFilled size={size} color={c} svgContent={`<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" fill="${c}" stroke="${c}" stroke-width="2"/>`} />
    : <SvgIcon size={size} color={c} svgContent={`<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>`} />;
};

export const BriefcaseIcon = ({ size = 24, color = '#4b5563', active }) => {
  const c = active ? '#0ea5e9' : color;
  return active
    ? <SvgIconFilled size={size} color={c} svgContent={`<rect x="2" y="7" width="20" height="14" rx="2" fill="${c}" stroke="${c}" stroke-width="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#0a1628" stroke-width="1.5" fill="none"/>`} />
    : <SvgIcon size={size} color={c} svgContent={`<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>`} />;
};

export const ChatBubbleIcon = ({ size = 24, color = '#4b5563', active }) => {
  const c = active ? '#0ea5e9' : color;
  return active
    ? <SvgIconFilled size={size} color={c} svgContent={`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="${c}" stroke="${c}" stroke-width="2"/>`} />
    : <SvgIcon size={size} color={c} svgContent={`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`} />;
};

export const PersonIcon = ({ size = 24, color = '#4b5563', active }) => {
  const c = active ? '#0ea5e9' : color;
  return active
    ? <SvgIconFilled size={size} color={c} svgContent={`<circle cx="12" cy="8" r="4" fill="${c}" stroke="${c}" stroke-width="2"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="${c}" stroke="${c}" stroke-width="2"/>`} />
    : <SvgIcon size={size} color={c} svgContent={`<circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>`} />;
};

// ─── Post Action Icons ────────────────────────────────────────

// Comment bubble (outline)
export const CommentOutlineIcon = ({ size = 20, color = '#9ca3af' }) => (
  <SvgIcon size={size} color={color} svgContent={`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`} />
);

// Forum / DM icon (two overlapping chat bubbles)
export const ForumIcon = ({ size = 20, color = '#9ca3af' }) => (
  <SvgIcon size={size} color={color} svgContent={`<path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a2 2 0 0 1-2-2v-1"/><path d="M15 2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l4-4h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>`} />
);

// Bookmark (outline and filled)
export const BookmarkIcon = ({ size = 20, color = '#9ca3af', filled = false }) => (
  filled
    ? <SvgIconFilled size={size} color={color} svgContent={`<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`} />
    : <SvgIcon size={size} color={color} svgContent={`<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`} />
);

// WhatsApp icon
export const WhatsAppIcon = ({ size = 14, color = '#9ca3af', style = {} }) => (
  <SvgIconFilled size={size} color={color} style={style} svgContent={`<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="${color}"/>`} />
);

// ─── UI Icons ─────────────────────────────────────────────────

// Close (X)
export const CloseIcon = ({ size = 24, color = '#9ca3af' }) => (
  <SvgIcon size={size} color={color} svgContent={`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`} />
);

// Check circle (filled)
export const CheckCircleIcon = ({ size = 12, color = '#0ea5e9', style = {} }) => (
  <SvgIconFilled size={size} color={color} style={style} svgContent={`<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><polyline points="22 4 12 14.01 9 11.01" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`} />
);

// Send arrow
export const SendIcon = ({ size = 20, color = '#0ea5e9' }) => (
  <SvgIcon size={size} color={color} svgContent={`<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="none"/>`} />
);

// Add circle (outline)
export const AddCircleIcon = ({ size = 26, color = '#ffffff' }) => (
  <SvgIcon size={size} color={color} svgContent={`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`} />
);

// Notifications bell (outline)
export const NotificationsIcon = ({ size = 26, color = '#ffffff' }) => (
  <SvgIcon size={size} color={color} svgContent={`<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`} />
);

// Edit / Pencil
export const EditIcon = ({ size = 24, color = '#ffffff' }) => (
  <SvgIcon size={size} color={color} svgContent={`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`} />
);

// Delete / Trash
export const DeleteIcon = ({ size = 24, color = '#ffffff' }) => (
  <SvgIcon size={size} color={color} svgContent={`<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`} />
);
