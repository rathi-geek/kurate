---
sidebar_position: 2
---

# 🌐 Add Frontend Apps

You can add different frontend frameworks such as **Next.js**, **Vue.js**, **React** or any other frontend frameworks.

## 📝 Guidelines

- Rename this folder with your frontend application name.
- Example: `nextjs-app` for Next.js, `vuejs-app` for Vue.js, `react-app` for a pure React app, etc.
- For multiple frontend apps, create separate folders inside the `apps/` directory with relevant names like `next-dashboard-app`, `vue-dashboard-app`, `react-chat-app`, etc.

**📖 Quick Start:**

You can follow the detailed documentation provided in this workspace to integrate your preferred frontend framework seamlessly.

### 🔄 **Adding Frontend Applications to Your Workspace**

We provide boilerplates for various frontend frameworks to make your integration process smoother. You can download and add these frameworks to your workspace `apps/` folder.

#### 🔗 **Available Frontend Boilerplates**

- **Next.js**: [Download Next.js Boilerplate](https://git.geekyants.com/geekyants/coe-grp/boilerplates/frontend/nextjs)
- **React**: [To be added](https://git.geekyants.com/geekyants/coe-grp/boilerplates/frontend)
- **Vue.js**: [To be added](https://git.geekyants.com/geekyants/coe-grp/boilerplates/frontend)

> **Note**: Download the repositories as a **ZIP file** to avoid git reference issues.

### 🚀 Integrating into the Workspace

1. **Download the required boilerplate**: Download the boilerplate(s) as a **zip file**.

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
     "frontend:dev": "npm run dev --workspace=frontend-app", // Replace frontend-app with your actual app name
     "dashboard:dev": "npm run dev --workspace=dashboard-app"  // Replace dashboard-app with your actual app name
   }
   ```

   > **Note**: Application name is present in `package.json` of your Frontend application (It's not the folder-name)

4. **Modify `project.json`**: Ensure your `project.json` file within each frontend application contains the necessary configurations to utilize Nx effectively.

### 🚀 **Running Your Frontend Applications**

Once you've added your frontend applications to the workspace, follow these steps to run them:

1. **Install Dependencies**:
   Make sure you are in the workspace (root) level and run:

   ```bash
   $ yarn install
   // or
   $ npm install
   ```

2. **Start the Frontend Application**:
   Once dependencies are installed, start your frontend application by running:

   ```bash
   npm run frontend:dev
   ```

3. **Access the Frontend Application**:
   Your frontend application will be running at its respective URL, typically something like `http://localhost:3002` unless otherwise configured.

Your frontend application should now be up and running! 🚀
