import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifestVersion: 3,
  vite: () => ({
    // Allow reuse of monorepo env names (NEXT_PUBLIC_*)
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  }),
  manifest: {
    name: 'Kurate',
    description: 'Save the current page to your Kurate vault.',
    action: {
      default_title: 'Kurate',
      default_popup: 'popup.html',
    },
    permissions: ['storage', 'tabs', 'alarms'],
    host_permissions: [
      'https://*.supabase.co/*',
      'https://kurate.co.in/*',
      'https://www.kurate.co.in/*',
    ],
    externally_connectable: {
      matches: [
        'https://kurate.co.in/*',
        'https://www.kurate.co.in/*',
      ],
    },
  },
});
