# UVA Turkish Network — Frontend Redesign Implementation Plan

Use `design/app.html` as the visual reference throughout. **Do not touch any Supabase logic, API routes, auth, or database queries.** Only update JSX markup and Tailwind/CSS classes.

---

## Step 0 — Git Branching (do this before anything else)

Before touching a single file, run these commands in the project root to preserve the current state:

```bash
# Make sure you're on main and everything is committed
git checkout main
git status   # should show nothing uncommitted — if there are changes, commit or stash them first

# Create and push a backup branch that freezes the original design
git checkout -b design/original-backup
git push origin design/original-backup

# Now create the working branch where all redesign changes will live
git checkout -b design/frontend-redesign
git push origin design/frontend-redesign
```

All redesign work in this plan happens on `design/frontend-redesign`. The branch `design/original-backup` is never touched again — it is a clean snapshot you can always return to.

**To revert everything and go back to the original at any point:**
```bash
git checkout main
git reset --hard origin/design/original-backup
# or simply switch to the backup branch to preview it:
git checkout design/original-backup
```

**When the redesign is done and you're happy with it:**
```bash
# Merge the redesign into main
git checkout main
git merge design/frontend-redesign
git push origin main
```

---

## Design System Reference

| Token | Old value | New value |
|---|---|---|
| Page background | `bg-gray-50` | `bg-[#F4EFE6]` |
| Card border | `border-gray-100` | `border-[#E2D8CC]` |
| Brand red | `#E30A17` | `#C4001A` |
| Near-black text | `#1a1a2e` | `#1C1714` |
| Card shadow | always on | hover only |

---

## Step 1 — `app/globals.css`

Update the `:root` block. Everything else in the file stays exactly as-is.

```css
:root {
  --primary:     #C4001A;   /* richer Turkish red */
  --primary-dark:#A3001A;
  --navy:        #1E2D5A;
  --orange:      #E57200;
  --cream:       #F4EFE6;   /* warm parchment — new page bg */
  --sand:        #E2D8CC;   /* warm sand — new border color */
  --ink:         #1C1714;   /* warmer near-black */
  --font-playfair: 'Playfair Display', Georgia, serif;
  --font-dm-sans:  'DM Sans', system-ui, sans-serif;
}
```

Also update `body` color:
```css
body {
  font-family: var(--font-dm-sans);
  background-color: #ffffff;
  color: #1C1714;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Update `.card-hover:hover` box-shadow to use the new red:
```css
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(196, 0, 26, 0.08);
}
```

---

## Step 2 — `tailwind.config.ts`

Update `primary.DEFAULT` and `primary.600`/`primary.700` to match the new red. Also add `cream`, `sand`, and `ink` as named colors so they are usable as Tailwind classes.

```ts
colors: {
  primary: {
    50:      '#fff1f1',
    100:     '#ffe0e0',
    200:     '#ffc6c6',
    300:     '#ff9e9e',
    400:     '#ff6565',
    500:     '#e8273a',
    600:     '#C4001A',   // updated
    700:     '#a3001a',   // updated
    800:     '#84001a',
    900:     '#6b001a',
    DEFAULT: '#C4001A',  // updated
  },
  // keep navy and uva unchanged
  cream: '#F4EFE6',
  sand:  '#E2D8CC',
  ink:   '#1C1714',
  // ... rest unchanged
}
```

---

## Step 3 — `components/layout/Navbar.tsx`

**One change only:** for non-landing pages, the navbar is always white with a warm border. Remove the transparent behavior on authenticated pages.

Find the navBg/textColor/logoColor block:

```tsx
// BEFORE
const navBg = isLanding && !scrolled
  ? 'bg-transparent'
  : 'bg-white shadow-sm border-b border-gray-100';

const textColor = isLanding && !scrolled ? 'text-white' : 'text-gray-700';
const logoColor = isLanding && !scrolled ? 'text-white' : 'text-gray-900';
```

Replace with:

```tsx
// AFTER
const navBg = isLanding && !scrolled
  ? 'bg-transparent'
  : 'bg-white border-b border-[#E2D8CC]';           // warm border, no shadow

const textColor = isLanding && !scrolled ? 'text-white' : 'text-gray-700';
const logoColor = isLanding && !scrolled ? 'text-white' : 'text-gray-900';
```

On the active nav link, update the active bg to use the new cream:
```tsx
// BEFORE
pathname === link.href
  ? 'bg-primary-50 text-primary-600'
  : `${textColor} hover:bg-gray-100 hover:text-gray-900`

// AFTER
pathname === link.href
  ? 'bg-[#F4EFE6] text-[#C4001A]'
  : `${textColor} hover:bg-[#F4EFE6] hover:text-gray-900`
```

---

## Step 4 — `app/page.tsx` (Landing Page)

The landing page needs only two targeted changes. **Do not touch the Hero section** — it already looks correct.

### 4a. "How It Works" section cards

Replace the card `border-2 ${card.accent}` classes. The new cards use a single warm sand border, with a color-coded top strip instead:

```tsx
// BEFORE
<div key={i} className={`bg-white rounded-2xl p-8 border-2 ${card.accent} card-hover shadow-sm`}>

// AFTER
<div key={i} className="bg-white rounded-lg p-8 border border-[#E2D8CC] card-hover">
```

Remove the `shadow-sm` from the icon container. Keep all text content exactly the same.

### 4b. Public Job Board section background

```tsx
// BEFORE
<section className="py-24 bg-gray-50">

// AFTER
<section className="py-24 bg-[#F4EFE6]">
```

Job cards: update border and remove default shadow.
```tsx
// BEFORE
<div key={job.id} className="bg-white rounded-2xl p-6 border border-gray-100 card-hover shadow-sm">

// AFTER
<div key={job.id} className="bg-white rounded-lg p-6 border border-[#E2D8CC] card-hover">
```

---

## Step 5 — `app/dashboard/page.tsx`

### 5a. Page background (2 places — loading state and main return)

```tsx
// BEFORE (both instances)
<div className="min-h-screen bg-gray-50">

// AFTER
<div className="min-h-screen bg-[#F4EFE6]">
```

### 5b. Quick actions — replace 2×4 grid with horizontal pills

Find the "Quick actions" grid block and replace entirely:

```tsx
{/* Quick actions */}
<div className="flex flex-wrap gap-2 mb-10">
  {[
    { icon: <Users size={16} />,        label: t.dashboard.alumniDir,    href: '/directory', show: true },
    { icon: <Briefcase size={16} />,    label: t.dashboard.opportunities, href: '/jobs',      show: true },
    { icon: <Coffee size={16} />,       label: t.dashboard.requests,     href: '/requests',  show: true },
    { icon: <MessageCircle size={16} />,label: t.dashboard.messages,     href: '/messages',  show: isAlumni },
    { icon: <Plus size={16} />,         label: t.dashboard.postOpp,      href: '/jobs/new',  show: isAlumni },
  ].filter(a => a.show).map(action => (
    <Link key={action.href} href={action.href}
      className="inline-flex items-center gap-2 bg-white border border-[#E2D8CC] rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#C4001A] hover:text-[#C4001A] transition-colors">
      {action.icon}
      {action.label}
    </Link>
  ))}
</div>
```

### 5c. Cards — update all card borders

Do a find-and-replace across this file only:
- `border-gray-100` → `border-[#E2D8CC]`
- `shadow-sm` → remove (or keep only on the profile card sidebar, your call)
- `rounded-2xl` → `rounded-lg`
- `bg-gray-50` (inside cards, e.g. icon containers) → `bg-[#F4EFE6]`

### 5d. Header greeting — remove the wave emoji

```tsx
// BEFORE
{t.dashboard.hello}, {profile?.full_name?.split(' ')[0] || ''} 👋

// AFTER
{t.dashboard.hello}, {profile?.full_name?.split(' ')[0] || ''}
```

---

## Step 6 — `app/directory/page.tsx`

### 6a. Page background

```tsx
// BEFORE (loading state + main div — both)
<div className="min-h-screen bg-gray-50">

// AFTER
<div className="min-h-screen bg-[#F4EFE6]">
```

### 6b. Alumni cards — add colored top-band

Find the alumni card rendering block and update. The goal is a colored band across the top of each card containing the avatar, with the details below. Replace the existing card JSX with:

```tsx
<div key={alum.id} className="bg-white rounded-lg border border-[#E2D8CC] card-hover overflow-hidden">
  {/* Colored top band with avatar */}
  <div className="h-16 bg-[#C4001A] relative">
    <div className="absolute -bottom-5 left-5">
      <div className="w-12 h-12 rounded-lg bg-white border-2 border-white flex items-center justify-center text-[#C4001A] font-bold text-sm shadow-sm">
        {alum.avatar_url
          ? <img src={alum.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
          : getInitials(alum.full_name || alum.email)
        }
      </div>
    </div>
  </div>

  {/* Card body */}
  <div className="px-5 pt-8 pb-5">
    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{alum.full_name}</h3>
    {alum.current_title && alum.current_company && (
      <p className="text-xs text-gray-500 mt-0.5">{alum.current_title} · {alum.current_company}</p>
    )}

    {/* Graduation year */}
    {alum.graduation_year && (
      <p className="text-xs text-[#C4001A] font-medium mt-1">Class of {alum.graduation_year}</p>
    )}

    {/* Location */}
    {alum.city && (
      <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
        <MapPin size={10} /><span>{alum.city}</span>
      </div>
    )}

    {/* Industry tag */}
    {alum.industry && (
      <span className="inline-block mt-3 text-xs bg-[#F4EFE6] border border-[#E2D8CC] text-gray-600 rounded-full px-2.5 py-0.5">
        {alum.industry}
      </span>
    )}

    {/* Coffee / Mentor badges */}
    <div className="flex gap-1.5 mt-3">
      {alum.open_to_coffee && (
        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5">
          <Coffee size={9} /> Coffee
        </span>
      )}
      {alum.open_to_mentorship && (
        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2 py-0.5">
          <BookOpen size={9} /> Mentor
        </span>
      )}
    </div>

    {/* View profile link */}
    <Link href={`/profile/${alum.id}`}
      className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#C4001A] hover:gap-2 transition-all">
      View profile <ArrowRight size={11} />
    </Link>
  </div>
</div>
```

### 6c. Filter panel background

```tsx
// BEFORE
{showFilters && (
  <div className="bg-white border border-gray-100 ...">

// AFTER
{showFilters && (
  <div className="bg-white border border-[#E2D8CC] ...">
```

---

## Step 7 — `app/jobs/page.tsx` (Opportunities)

### 7a. Page background

```tsx
// BEFORE
<div className="min-h-screen bg-gray-50">

// AFTER
<div className="min-h-screen bg-[#F4EFE6]">
```

### 7b. Job cards — update borders and remove default shadow

```tsx
// Do a find-and-replace in this file:
border-gray-100  →  border-[#E2D8CC]
rounded-2xl      →  rounded-lg
shadow-sm        →  (remove)
bg-gray-50       →  bg-[#F4EFE6]   (only inside cards, e.g. expanded section)
```

The expanded job detail section (the inline expand) should use `bg-[#F4EFE6]` as its background instead of any gray.

---

## Step 8 — `app/requests/page.tsx`

### 8a. Page and loading background

```tsx
// BEFORE (both instances)
<div className="min-h-screen bg-gray-50">

// AFTER
<div className="min-h-screen bg-[#F4EFE6]">
```

### 8b. Tab switcher

Replace the tab buttons with a pill-style switcher that sits on a cream base:

```tsx
<div className="inline-flex bg-white border border-[#E2D8CC] rounded-full p-1 mb-8">
  {(['incoming', 'outgoing'] as const).map(tabKey => (
    <button key={tabKey} onClick={() => setTab(tabKey)}
      className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
        tab === tabKey
          ? 'bg-[#C4001A] text-white'
          : 'text-gray-500 hover:text-gray-800'
      }`}>
      {tabKey === 'incoming' ? t.requests.incoming : t.requests.outgoing}
      {tabKey === 'incoming' && incoming.length > 0 && (
        <span className="ml-2 bg-white/20 rounded-full px-1.5 py-0.5 text-xs">{incoming.length}</span>
      )}
    </button>
  ))}
</div>
```

### 8c. Request cards

```tsx
// Update all request cards:
border-gray-100     →  border-[#E2D8CC]
bg-white rounded-2xl  →  bg-white rounded-lg
shadow-sm           →  (remove)
bg-gray-50          →  bg-[#F4EFE6]   (avatar backgrounds)
```

Accept/Decline buttons: update the accept button to use the new red:
```tsx
// Accept button
className="... bg-[#C4001A] hover:bg-[#a3001a] text-white ..."
```

---

## Step 9 — `app/messages/page.tsx`

This is the most visual update. The logic stays **100% identical** — only the wrapper layout and card styles change.

### 9a. Outer container background

```tsx
// BEFORE
<div className="min-h-screen bg-gray-50">

// AFTER
<div className="min-h-screen bg-[#F4EFE6]">
```

### 9b. Two-panel layout — sidebar and chat pane

The messages page has a thread list sidebar and a chat area. Update both panels:

**Thread list panel (left):**
```tsx
// Sidebar container
<div className="w-80 border-r border-[#E2D8CC] bg-white flex flex-col">
  {/* Header */}
  <div className="px-5 py-4 border-b border-[#E2D8CC]">
    <h2 className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-playfair)' }}>
      {t.messages.title}
    </h2>
  </div>
  ...
```

**Thread list items:** update hover and active states:
```tsx
// Thread item
<button onClick={() => setActiveThread(thread)}
  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#E2D8CC] last:border-0 ${
    activeThread?.partner.id === thread.partner.id
      ? 'bg-[#F4EFE6]'
      : 'hover:bg-[#F4EFE6]'
  }`}>
  {/* Avatar */}
  <div className="w-10 h-10 rounded-lg bg-[#C4001A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
    {thread.partner.avatar_url
      ? <img src={thread.partner.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
      : getInitials(thread.partner.full_name || thread.partner.email)
    }
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-gray-900 truncate">{thread.partner.full_name}</p>
    <p className="text-xs text-gray-400 truncate">
      {thread.messages[thread.messages.length - 1]?.content}
    </p>
  </div>
  {thread.unreadCount > 0 && (
    <span className="w-5 h-5 bg-[#C4001A] text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
      {thread.unreadCount}
    </span>
  )}
</button>
```

**Chat panel (right):**
```tsx
// Chat area background
<div className="flex-1 flex flex-col bg-white">
  {/* Chat header */}
  <div className="px-5 py-4 border-b border-[#E2D8CC] bg-white flex items-center gap-3">
    ...
  </div>

  {/* Messages area */}
  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F4EFE6]">
    ...
  </div>

  {/* Input area */}
  <div className="px-4 py-3 border-t border-[#E2D8CC] bg-white">
    ...
  </div>
</div>
```

**Message bubbles:**
```tsx
// Own messages (right)
<div className={`max-w-xs rounded-lg px-4 py-2.5 text-sm ${
  msg.from_user === profile?.id
    ? 'bg-[#C4001A] text-white ml-auto'
    : 'bg-white border border-[#E2D8CC] text-gray-800'
}`}>
  {msg.content}
</div>
```

**Send button:**
```tsx
<button disabled={sending || !newMessage.trim()} onClick={handleSend}
  className="bg-[#C4001A] hover:bg-[#a3001a] text-white rounded-lg px-4 py-2 transition-colors disabled:opacity-50">
  <Send size={16} />
</button>
```

**Empty state (no thread selected):**
```tsx
<div className="flex-1 flex flex-col items-center justify-center bg-[#F4EFE6] text-gray-400">
  <MessageCircle size={40} className="mb-3 opacity-30" />
  <p className="text-sm">{t.messages.selectThread}</p>
</div>
```

---

## Pages to Skip

- `app/profile/edit/page.tsx` — leave as-is for now
- `app/auth/**` — leave as-is
- `app/admin/page.tsx` — leave as-is

---

## Verification Checklist

After implementing, do a quick visual pass:

- [ ] `bg-gray-50` no longer appears on any authenticated page outer wrapper
- [ ] `border-gray-100` on cards is replaced with `border-[#E2D8CC]`
- [ ] Navbar on `/dashboard`, `/directory`, `/jobs`, `/requests`, `/messages` is white with warm border (not transparent)
- [ ] Dashboard quick actions are horizontal pills, not a 2×4 tile grid
- [ ] Directory alumni cards have the colored top-band + avatar style
- [ ] Messages chat bubbles are red (own) / white-bordered (partner)
- [ ] Requests tab switcher is pill style
- [ ] No emojis in page UI (check the dashboard greeting)
- [ ] All Supabase data still loads correctly on each page (do a logged-in walkthrough)
