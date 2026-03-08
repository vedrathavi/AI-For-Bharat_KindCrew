/\*\*

- State Management Architecture
-
- This document describes the standardized state management structure using Zustand slices.
-
- ## Structure
-
- ```

  ```
- src/store/
- ├── useAppStore.ts (Main store combining all slices)
- └── slice/
-     ├── authSlice.ts (Authentication state)
-     ├── creatorProfileSlice.ts (User profile state)
-     ├── ideationSlice.ts (Ideas management)
-     └── contentSlice.ts (Content generation)
-
- src/hooks/
- ├── useAuth.ts (Auth hook)
- ├── useIdeation.ts (Ideation hook)
- ├── useContent.ts (Content hook)
- └── index.ts (Central exports)
- ```

  ```
-
- ## Key Principles
-
- 1.  **Single Source of Truth**: All state lives in Zustand store
- 2.  **Action-Based**: State updates only through explicit actions
- 3.  **Async Handling**: All async operations wrapped with loading/error states
- 4.  **Persistence**: Selected state persisted to localStorage via middleware
- 5.  **Type-Safe**: Full TypeScript interfaces for state and actions
-
- ## Usage Pattern
-
- ```typescript

  ```
- // Components use custom hooks, not store directly
- const { ideas, loading, error, generateIdeas, fetchUserIdeas } = useIdeation();
-
- // All state changes go through actions
- const result = await generateIdeas(userId, profile);
- ```

  ```
-
- ## Persisted State
-
- The following state is persisted to localStorage:
- - Authentication: token, userInfo, authReady
- - Profile: creatorProfile, hasProfile, profileChecked
- - Ideas: ideas, profile (user preferences)
- - Content: contentList
-
- ## Error Handling
-
- Each slice handles its own errors:
- - Actions set error state on failure
- - Components use clearError() to dismiss errors
- - Errors are user-friendly messages from API or generic fallbacks
-
- ## Loading States
-
- All async operations use shared loading state:
- - Set to true before operation
- - Set to false after success or error
- - Components disable buttons/show spinners during loading
-
- ## Best Practices
-
- 1.  **Always clear form errors** after successful submission
- 2.  **Check loading state** before allowing new operations
- 3.  **Use provided hooks** instead of accessing store directly
- 4.  **Handle both success and error** cases in components
- 5.  **Leverage persistence** for offline-first features
      \*/

// Example: Ideation Slice Structure
/\*
export type IdeationSlice = {
// State
ideas: Idea[];
selectedIdea: Idea | null;
loading: boolean;
error: string | null;
profile: IdeationProfile;

// Actions
generateIdeas: (userId: string, profile: IdeationProfile) => Promise<Idea[] | null>;
fetchUserIdeas: (userId: string) => Promise<Idea[]>;
selectIdea: (idea: Idea) => void;
clearIdeas: () => void;
clearError: () => void;
};
\*/

// Example: Using Ideation Hook
/\*
function MyComponent() {
const { ideas, loading, error, generateIdeas, clearError } = useIdeation();\n
const handleGenerate = async () => {
const result = await generateIdeas(userId, profile);
if (result) {
// Success
} else {
// Error is already set in state
}
};

return (
<>
{error && <ErrorDisplay error={error} onDismiss={clearError} />}
<button disabled={loading} onClick={handleGenerate}>
{loading ? 'Generating...' : 'Generate Ideas'}
</button>
</>
);
}
\*/
