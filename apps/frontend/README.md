# 🌐 Frontend App

This folder contains frontend application code. You can add different frontend frameworks such as **Next.js**, **Vue.js**, **React** or any other frontend frameworks.

## 📝 Guidelines

- Rename this folder with your frontend application name.
- Example: `nextjs-app` for Next.js, `vuejs-app` for Vue.js, `react-app` for a pure React app, etc.
- For multiple frontend apps, create separate folders inside the `apps/` directory with relevant names like `next-dashboard-app`, `vue-dashboard-app`, `react-chat-app`, etc.

**📖 Quick Start:**

Refer to the documentation provided in this workspace for integrating frontend frameworks.

---

**🔗 Adding Frontend Applications:**

You can find detailed boilerplates for different frontend frameworks here:

- 🌐 [Next.js Boilerplate](https://git.geekyants.com/geekyants/coe-grp/boilerplates/frontend/nextjs)
- 🌐 [React Boilerplate](https://git.geekyants.com/geekyants/coe-grp/boilerplates/frontend) - (Link to be added)
- 🌐 [Vue.js Boilerplate](https://git.geekyants.com/geekyants/coe-grp/boilerplates/frontend) - (Link to be added)

### 🚀 Integrating into the Workspace

1. **Download the required boilerplate**: Download the boilerplate(s) as a **zip file** to avoid git refeerence issues.

2. **Update `tsconfig.json`**: Make sure to extend the workspace-level `tsconfig.base.json` in your frontend apps.

   ```json
   {
     "extends": "../../tsconfig.base.json", // Ensure the correct path is used
     "compilerOptions": {
       // Existing Options
     }
   }
   ```

3. **Modify `package.json` scripts**: Update your workspace-level `package.json` scripts with your actual application names.

   ```json
   {
     "frontend:start": "npm run start --workspace=frontend-app", // Replace frontend-app with your actual app name
     "dashboard:start": "npm run start --workspace=dashboard-app"  // Replace dashboard-app with your actual app name
   }
   ```

4. **Modify `project.json`**: Ensure your `project.json` file within each frontend application contains the necessary configurations to utilize Nx effectively.
