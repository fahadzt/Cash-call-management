# 🎨 UI Theme Guide - Cash Call Management App

## 📋 **Files to Copy for Theme Replication**

When you want to apply this same theme to your other webapp, tell Cursor to copy these files:

### **🎯 Core Theme Files (Essential)**

1. **`app/globals.css`** - Main CSS with Aramco theme colors and custom styles
2. **`components.json`** - shadcn/ui configuration with "new-york" style
3. **`components/theme-provider.tsx`** - Theme provider for dark/light mode
4. **`package.json`** - Dependencies list (copy the entire dependencies section)

### **🎨 UI Component Library (shadcn/ui)**

Copy the entire `components/ui/` directory with all these components:
- `accordion.tsx`
- `alert-dialog.tsx`
- `alert.tsx`
- `aspect-ratio.tsx`
- `avatar.tsx`
- `badge.tsx`
- `breadcrumb.tsx`
- `button.tsx`
- `calendar.tsx`
- `card.tsx`
- `carousel.tsx`
- `chart.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `context-menu.tsx`
- `dialog.tsx`
- `drawer.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `hover-card.tsx`
- `input-otp.tsx`
- `input.tsx`
- `label.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`
- `popover.tsx`
- `progress.tsx`
- `radio-group.tsx`
- `resizable.tsx`
- `scroll-area.tsx`
- `select.tsx`
- `separator.tsx`
- `sheet.tsx`
- `sidebar.tsx`
- `skeleton.tsx`
- `slider.tsx`
- `sonner.tsx`
- `switch.tsx`
- `table.tsx`
- `tabs.tsx`
- `textarea.tsx`
- `toast.tsx`
- `toaster.tsx`
- `toggle-group.tsx`
- `toggle.tsx`
- `tooltip.tsx`

### **🔧 Configuration Files**

5. **`postcss.config.mjs`** - PostCSS configuration for Tailwind
6. **`lib/utils.ts`** - Utility functions for class merging
7. **`hooks/use-toast.ts`** - Toast hook for notifications

## 🎨 **Theme Characteristics**

### **Color Palette (Aramco Brand)**
- **Primary Blue**: `#0033a0` (Aramco Blue)
- **Secondary Blue**: `#00a3e0` (Aramco Light Blue)
- **Green**: `#00843d` (Aramco Green)
- **Light Green**: `#84bd00` (Aramco Light Green)

### **Design System**
- **Style**: `new-york` (shadcn/ui)
- **Base Color**: `neutral`
- **CSS Variables**: Enabled
- **Icon Library**: `lucide-react`
- **Font**: `Inter` (Google Fonts)

### **Custom CSS Classes**
- `.aramco-gradient-bg` - Animated gradient background
- `.aramco-card-bg` - Glass morphism card background
- `.aramco-input-bg` - Enhanced input styling
- `.aramco-button-primary` - Primary button with gradient
- `.aramco-button-secondary` - Secondary button with gradient
- `.enhanced-input` - Advanced input styling
- `.enhanced-button` - Advanced button with hover effects
- `.enhanced-card` - Glass morphism cards
- `.enhanced-select` - Styled select dropdowns
- `.enhanced-badge` - Enhanced badge styling

## 📦 **Required Dependencies**

### **Core Dependencies**
```json
{
  "@hookform/resolvers": "^3.10.0",
  "@radix-ui/react-accordion": "1.2.2",
  "@radix-ui/react-alert-dialog": "1.1.4",
  "@radix-ui/react-aspect-ratio": "1.1.1",
  "@radix-ui/react-avatar": "1.1.2",
  "@radix-ui/react-checkbox": "1.1.3",
  "@radix-ui/react-collapsible": "1.1.2",
  "@radix-ui/react-context-menu": "2.2.4",
  "@radix-ui/react-dialog": "1.1.4",
  "@radix-ui/react-dropdown-menu": "2.1.4",
  "@radix-ui/react-hover-card": "1.1.4",
  "@radix-ui/react-label": "2.1.1",
  "@radix-ui/react-menubar": "1.1.4",
  "@radix-ui/react-navigation-menu": "1.2.3",
  "@radix-ui/react-popover": "1.1.4",
  "@radix-ui/react-progress": "1.1.1",
  "@radix-ui/react-radio-group": "1.2.2",
  "@radix-ui/react-scroll-area": "1.2.2",
  "@radix-ui/react-select": "2.1.4",
  "@radix-ui/react-separator": "1.1.1",
  "@radix-ui/react-slider": "1.2.2",
  "@radix-ui/react-slot": "1.1.1",
  "@radix-ui/react-switch": "1.1.2",
  "@radix-ui/react-tabs": "1.1.2",
  "@radix-ui/react-toast": "1.2.4",
  "@radix-ui/react-toggle": "1.1.1",
  "@radix-ui/react-toggle-group": "1.1.1",
  "@radix-ui/react-tooltip": "1.1.6",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "cmdk": "1.0.4",
  "date-fns": "4.1.0",
  "embla-carousel-react": "8.5.1",
  "geist": "^1.3.1",
  "input-otp": "1.4.1",
  "lucide-react": "^0.454.0",
  "next-themes": "^0.4.6",
  "react-day-picker": "9.8.0",
  "react-hook-form": "^7.60.0",
  "react-resizable-panels": "^2.1.7",
  "recharts": "latest",
  "sonner": "^1.7.4",
  "tailwind-merge": "^2.5.5",
  "tailwindcss-animate": "^1.0.7",
  "vaul": "^0.9.9",
  "zod": "3.25.67"
}
```

### **Dev Dependencies**
```json
{
  "@tailwindcss/postcss": "^4.1.9",
  "postcss": "^8.5",
  "tailwindcss": "^4.1.9",
  "tw-animate-css": "1.3.3"
}
```

## 🚀 **Setup Instructions for Cursor**

### **Step 1: Copy Core Files**
```
Copy these files to your new project:
- app/globals.css
- components.json
- components/theme-provider.tsx
- postcss.config.mjs
- lib/utils.ts
- hooks/use-toast.ts
```

### **Step 2: Copy UI Components**
```
Copy the entire components/ui/ directory with all shadcn/ui components
```

### **Step 3: Update Dependencies**
```
Add all the dependencies listed above to your package.json
```

### **Step 4: Configure Layout**
```
Update your app/layout.tsx to include:
- ThemeProvider wrapper
- Inter font import
- globals.css import
```

### **Step 5: Install Dependencies**
```
Run: pnpm install (or npm install / yarn install)
```

## 🎯 **Key Features of This Theme**

### **✨ Modern Design Elements**
- **Glass Morphism**: Translucent cards with backdrop blur
- **Gradient Animations**: Smooth color transitions
- **Hover Effects**: Interactive button and card animations
- **Rounded Corners**: Consistent border radius (0.625rem)
- **Shadow System**: Layered shadows for depth

### **🎨 Color System**
- **Light Mode**: Clean whites with blue accents
- **Dark Mode**: Deep grays with light accents
- **Status Colors**: Semantic colors for different states
- **Chart Colors**: 5-color palette for data visualization

### **📱 Responsive Design**
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Large touch targets
- **Accessible**: High contrast ratios and focus states

## 💡 **Usage Examples**

### **Basic Card**
```tsx
<div className="enhanced-card p-6">
  <h3 className="text-xl font-semibold mb-4">Card Title</h3>
  <p className="text-muted-foreground">Card content</p>
</div>
```

### **Primary Button**
```tsx
<button className="enhanced-button aramco-button-primary text-white">
  Click Me
</button>
```

### **Enhanced Input**
```tsx
<input 
  className="enhanced-input w-full" 
  placeholder="Enter text..."
/>
```

## 🔧 **Customization Tips**

### **Change Brand Colors**
Update the CSS variables in `app/globals.css`:
```css
:root {
  --primary: oklch(0.205 0 0); /* Your brand color */
  --accent: oklch(0.97 0 0);
  /* ... other variables */
}
```

### **Add Custom Components**
Create new components in `components/ui/` following the existing patterns.

### **Modify Animations**
Update the keyframes in `app/globals.css` for custom animations.

## 📝 **Note for Cursor**

When implementing this theme in a new project:

1. **Start with the core files** (globals.css, components.json, theme-provider.tsx)
2. **Add UI components gradually** as needed
3. **Test the theme** in both light and dark modes
4. **Customize colors** to match your brand
5. **Ensure all dependencies** are properly installed

This theme provides a modern, professional look with excellent user experience and accessibility features! 🎨✨ 