# KindCrew Onboarding & Dashboard System

Complete implementation of progressive onboarding, dashboard with sidebar, and profile management.

## 📁 File Structure

```
frontend/src/
├── app/
│   ├── onboarding/page.tsx         # Progressive onboarding form
│   ├── dashboard/page.tsx          # Main dashboard with sidebar
│   ├── profile/page.tsx            # User & creator profile page
│   ├── content/page.tsx            # Content creation (placeholder)
│   ├── analytics/page.tsx          # Analytics dashboard (placeholder)
│   └── settings/page.tsx           # Settings page (placeholder)
│
├── components/
│   ├── Sidebar.tsx                 # Desktop sidebar navigation
│   ├── SetupBanner.tsx             # Setup completion banner
│   └── AuthenticatedLayout.tsx     # Shared layout for auth pages
│
├── lib/api/
│   └── creatorProfile.ts           # API functions for creator profiles
│
├── store/slice/
│   ├── authSlice.ts                # Authentication state
│   └── creatorProfileSlice.ts      # Creator profile state (NEW)
│
├── hooks/
│   ├── useAuth.ts                  # Authentication hook
│   └── useCreatorProfile.ts        # Creator profile hook (NEW)
│
└── store/
    └── useAppStore.ts              # Combined Zustand store (UPDATED)
```

## 🎯 Features Implemented

### 1. **Progressive Onboarding Form** (`/onboarding`)

- **Form Sections:**
  - Niche (Primary\* & Secondary)
  - Social Media Platforms
  - Goals (Primary Goal* & Creator Level*)
  - Content Strategy (Type*, Frequency*, Content Pillars\*)
  - Preferences (Tones, Formats, CTA, Formality, Time Commitment)
- **UX Features:**
  - Required fields marked with \*
  - Optional fields labeled "(optional)"
  - Sticky bottom buttons: "Skip for now" & "Save and continue"
  - Dynamic array management (add/remove tags)
  - Form validation before submission
  - Toast notifications for success/error
- **Responsive:**
  - Mobile: Single column, stacked buttons
  - Tablet: Responsive grid where appropriate
  - Desktop: Multi-column forms, wider layout

### 2. **Dashboard with Sidebar** (`/dashboard`)

- **Desktop (lg+):**
  - Fixed left sidebar with navigation
  - User info display with avatar
  - Quick action cards
  - Profile summary (if profile exists)
- **Mobile (<lg):**
  - Top header with hamburger menu
  - Slide-out navigation menu
  - Touch-friendly buttons
- **Setup Banner:**
  - Shows when creator profile is incomplete
  - Dismissible with "Later" button
  - "Complete Setup" CTA redirects to onboarding
  - Hidden automatically when profile exists

### 3. **Profile Page** (`/profile`)

- **User Information Section:**
  - Profile picture/avatar
  - Name, email, user ID, role
- **Creator Profile Section:**
  - Niche (primary & secondary)
  - Connected platforms with status
  - Goals (primary goal & creator level)
  - Content strategy details
  - Content pillars display
  - Preferences (tones, formats, constraints)
  - Account status & onboarding completion
- **Actions:**
  - "Edit Profile" button to return to onboarding
  - "Create Profile" CTA if no profile exists

### 4. **Sidebar Navigation**

- **Links:**
  - Dashboard (📊)
  - Profile (👤)
  - Content (📝)
  - Analytics (📈)
  - Settings (⚙️)
  - Logout (🚪)
- **Features:**
  - Active state highlighting
  - User info at top
  - Responsive (hidden on mobile, drawer on tablet/desktop)

## 🔗 Backend Integration

### API Service (`lib/api/creatorProfile.ts`)

```typescript
// Create new creator profile
createCreatorProfile(token, profileData);

// Get authenticated user's profile
getMyProfile(token);

// Update existing profile
updateCreatorProfile(token, creatorId, updates);

// Mark onboarding as complete
completeOnboarding(token, creatorId);
```

### State Management (`store/slice/creatorProfileSlice.ts`)

```typescript
// State
creatorProfile: CreatorProfile | null;
profileLoading: boolean;
profileError: string | null;
hasProfile: boolean;
profileChecked: boolean;

// Actions
fetchProfile(token);
createProfile(token, data);
updateProfile(token, creatorId, data);
completeOnboarding(token, creatorId);
clearProfile();
```

### API Endpoints Used

- `POST /api/creator-profiles` - Create profile
- `GET /api/creator-profiles/me/profile` - Get user's profile
- `PUT /api/creator-profiles/:creatorId` - Update profile
- `PATCH /api/creator-profiles/:creatorId/complete-onboarding` - Complete onboarding

## 🎨 Design System

### Color Theme

Matches existing landing page theme:

- Background: `var(--color-background)` - #000000
- Surface: `var(--color-surface)` - #1a1a1a
- Surface Hover: `var(--color-surface-hover)` - #2d2d2d
- Text: `var(--color-text)` - #ffffff
- Text Secondary: `var(--color-text-secondary)` - #b3b3b3
- Border: `var(--color-border)` - #333333
- Gradient: `linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)`

### Typography

- Font: DM Sans (from globals.css)
- Headings: Bold, large (text-3xl to text-4xl)
- Body: Regular, readable (text-base to text-lg)
- Labels: Medium weight, secondary color

### Spacing

- Consistent padding: 4-6 (mobile), 6-8 (desktop)
- Gaps: 3-6 between elements
- Margins: Consistent vertical rhythm (mb-4, mb-6, mb-8)

### Components

- Cards: Rounded-xl, surface background, border
- Buttons: Rounded-lg, hover effects, disabled states
- Inputs: Rounded-lg, border, focus states
- Tags: Rounded-lg, removable (× button)

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
Default: < 640px (sm)     - Stack everything vertically
sm: 640px                 - Slightly wider, 2 columns where appropriate
md: 768px                 - Tablet portrait
lg: 1024px                - Sidebar appears, layout shifts
xl: 1280px                - Desktop full width
2xl: 1536px               - Large desktop
```

### Desktop (lg+)

- Sidebar: Fixed 256px width (w-64)
- Content: Margin-left 256px (lg:ml-64)
- Grid: Multi-column layouts
- Form inputs: Side-by-side where appropriate

### Mobile (<lg)

- Sidebar: Hidden
- Top header: Fixed with hamburger menu
- Content: Full width, padding-top for header
- Form inputs: Full width stacked
- Buttons: Full width stacked

## 🚀 User Flow

### After Login

```
Login Success
    ↓
Dashboard redirect (?token=jwt)
    ↓
Check: Does user have creator profile?
    ├─ NO  → Show setup banner on dashboard
    │         User can:
    │         • Click "Complete Setup" → Onboarding
    │         • Click "Later" → Dismiss banner (stays on dashboard)
    │         • Navigate freely to other pages
    │
    └─ YES → Show profile summary on dashboard
              • Display niche, level, goals, frequency
              • No setup banner
              • Full access to all features
```

### Onboarding Flow

```
/onboarding
    ↓
User fills form (required fields *)
    ├─ Skip → Navigate to dashboard (profile not created)
    │         Setup banner will show on next visit
    │
    └─ Save and Continue
           ↓
       Validate form
           ├─ Invalid → Show error toast
           │            User stays on form
           │
           └─ Valid
                  ↓
              Create profile in backend
                  ↓
              Store in Zustand state
                  ↓
              Navigate to dashboard
                  ↓
              Setup banner NOT shown
              Profile summary displayed
```

### Profile Check Logic

```typescript
// In dashboard/profile pages
useEffect(() => {
  if (token && isAuthenticated() && !profileChecked) {
    fetchProfile(token); // Calls GET /api/creator-profiles/me/profile
  }
}, [token, isAuthenticated, profileChecked]);

// Result stored in state:
// - hasProfile: true/false
// - creatorProfile: {...} or null
// - profileChecked: true (prevents re-fetching)
```

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend Requirements

DynamoDB table must exist with GSIs:

- Table: `KindCrew-CreatorProfiles`
- GSI 1: `UserIdIndex` (partition: userId)
- GSI 2: `StatusIndex` (partition: status)
- GSI 3: `NicheIndex` (partition: niche.primary)

See `backend/CREATOR_PROFILE_SETUP.md` for setup instructions.

## 🧪 Testing Flow

### 1. Test Authentication

```bash
# Start servers
cd backend && npm run dev
cd frontend && npm run dev

# Login at http://localhost:3000
# Should redirect to /dashboard?token=...
```

### 2. Test Onboarding (New User)

```
1. Login (no profile exists)
2. Dashboard shows setup banner
3. Click "Complete Setup"
4. Fill onboarding form (required fields)
5. Click "Save and Continue"
6. Redirected to dashboard
7. Setup banner hidden
8. Profile summary shows
```

### 3. Test Skip Flow

```
1. Login (no profile exists)
2. Dashboard shows setup banner
3. Click "Later" or navigate away
4. Setup banner dismissed for session
5. Can navigate to other pages
6. Banner reappears on refresh if profile still doesn't exist
```

### 4. Test Profile Page

```
1. Navigate to /profile
2. See user information section
3. If profile exists: See full creator profile
4. If no profile: See "Create Profile" button
5. Click "Edit Profile" (if exists)
6. Redirected to /onboarding with current data
```

### 5. Test Responsive

```
1. Open DevTools (F12)
2. Toggle device toolbar
3. Test at: 375px, 768px, 1024px, 1440px
4. Verify:
   - Mobile: Hamburger menu works
   - Tablet: Sidebar appears
   - Desktop: Full layout
   - All forms are usable
```

## 📊 State Persistence

### Zustand Persist

Storage key: `kindcrew-app-storage`

Persisted data:

```typescript
{
  token: string,
  userInfo: UserInfo,
  creatorProfile: CreatorProfile | null,
  hasProfile: boolean,
  profileChecked: boolean
}
```

Cleared on logout:

```typescript
logout() {
  clearAuth();
  clearProfile();
  localStorage.clear();
  window.location.href = "/api/auth/logout";
}
```

## 🐛 Common Issues & Solutions

### Issue: Setup banner always shows

**Solution:** Check that profile fetch is working

```typescript
// In DevTools Console:
const store = JSON.parse(localStorage.getItem("kindcrew-app-storage"));
console.log(store.state.hasProfile); // Should be true if profile exists
console.log(store.state.profileChecked); // Should be true after fetch
```

### Issue: Sidebar not showing on desktop

**Solution:** Check Tailwind breakpoint

```css
/* Sidebar should have: */
className="hidden lg:flex"

/* Content should have: */
className="lg:ml-64"
```

### Issue: Mobile menu not closing

**Solution:** Ensure onClick on overlay div:

```typescript
<div onClick={() => setMobileMenuOpen(false)}>
  {/* Menu content */}
</div>
```

### Issue: API calls failing

**Solution:** Check:

1. Backend running on port 5000
2. CORS enabled for localhost:3000
3. JWT token in localStorage
4. DynamoDB table exists with correct name

## 🎓 Code Examples

### Using Creator Profile Hook

```typescript
import { useCreatorProfile } from "@/hooks/useCreatorProfile";

function MyComponent() {
  const {
    creatorProfile,
    hasProfile,
    profileLoading,
    fetchProfile
  } = useCreatorProfile();

  // Fetch profile on mount
  useEffect(() => {
    if (token) fetchProfile(token);
  }, [token]);

  // Check if profile exists
  if (!hasProfile) {
    return <div>Please complete your profile</div>;
  }

  // Use profile data
  return <div>Niche: {creatorProfile.niche.primary}</div>;
}
```

### Creating a Profile

```typescript
import { useAppStore } from "@/store/useAppStore";

function OnboardingForm() {
  const { createProfile, profileLoading } = useAppStore();

  const handleSubmit = async () => {
    try {
      await createProfile(token, {
        niche: { primary: "tech" },
        goals: {
          primaryGoal: "growth",
          creatorLevel: "beginner",
        },
        strategy: {
          contentStrategy: "educational",
          postingFrequency: "3-5 times/week",
          contentPillars: ["Tips", "Tutorials"],
        },
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create profile");
    }
  };
}
```

## 📚 Related Documentation

- [Backend: CREATOR_PROFILE_SETUP.md](../backend/CREATOR_PROFILE_SETUP.md) - DynamoDB table setup
- [Backend: CreatorProfile Model](../backend/models/CreatorProfile.js) - Schema definition
- [Backend: Creator Profile Routes](../backend/routes/creatorProfileRoutes.js) - API endpoints

## ✅ Feature Checklist

- [x] Progressive onboarding form
- [x] Dashboard with sidebar
- [x] Setup completion banner
- [x] Profile page with full details
- [x] Mobile responsive with hamburger menu
- [x] Backend API integration
- [x] Zustand state management
- [x] Form validation
- [x] Error handling with toasts
- [x] Placeholder pages (content, analytics, settings)
- [x] Consistent color theme
- [x] Responsive across all screen sizes
- [x] User can skip onboarding
- [x] Profile fetch on dashboard load
- [x] Edit profile functionality

## 🚀 Next Features to Build

- [ ] Content creation with AI
- [ ] Analytics dashboard with charts
- [ ] Settings page (account, notifications, preferences)
- [ ] Competitor tracking UI
- [ ] Content calendar
- [ ] Post scheduling
- [ ] Templates library
