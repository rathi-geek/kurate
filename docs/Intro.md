# 🚀 App Boilerplate

![Nx Logo](https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png)

This boilerplate serves as a powerful, foundational template for building applications using a **monorepo** structure managed by Nx. It seamlessly integrates with **NestJS** (Backend) and **Next.js** (Frontend) applications while providing a shared workspace for common packages, documentation using **Docusaurus**, and pre-configured **ESLint**, **Prettier**, and **Jest** setups.

## 🎯 **Overview**

The structure is designed to:

- ✅ Support multiple **Backend** (NestJS) and **Frontend** (Next.js) applications in the same workspace.
- ✅ Provide a shared **lib** & **utils** folder for reusable code between different apps.
- ✅ Integrate **Docusaurus** for centralized documentation.
- ✅ Offer pre-configured **Jest**, **ESLint**, and **Prettier** setups for consistent code quality.
- ✅ Set up base TypeScript configurations for all projects.
- ✅ `src` folder is purely for documentation purpose, Avoid using the same for actual project.

## 🛠️ **Getting Started**

### Step 1: 🔧 Clone the Boilerplate

Start by forking this repository to your project’s repository:

```bash
git clone <your-forked-repo-url>
cd app
```

### Step 2: 🔄 Adding Backend and Frontend Applications

- Download either or both the backend (NestJS) and frontend (Next.js) boilerplates as per your requirement (download as a zip to avoid git sub-modules):

  - 🌐 [Backend (NestJS)](https://git.geekyants.com/geekyants/coe-grp/boilerplates/nestjs.git)
  - 🌐 [Frontend (Next.js)](https://git.geekyants.com/geekyants/coe-grp/boilerplates/nextjs.git)

- You can replace the existing `backend-boilerplate` under the `apps/` directory with the downloaded application.
- Update your `tsconfig.json` file to extend the base configuration (refer to how it’s used in the existing `backend-boilerplate` repository).

### Step 3: ⚙️ Configuring Nx Workspace

- Make sure the backend and frontend apps are correctly placed inside the `apps` folder.
- Any shared or common code should be added to the `libs` folder, and you can configure it in the `tsconfig.base.json` file for easy imports.

Example `tsconfig.base.json` configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["libs/shared/src/*"]
    }
  }
}
```

### Step 4: 🚀 Run the Applications

You can use the Nx CLI to run the applications:

```bash
# For Backend
nx serve backend

# For Frontend
nx serve frontend
```

## 📚 **Documentation with Docusaurus**

This boilerplate integrates **Docusaurus** for maintaining project documentation.

### Starting Docusaurus

Start the documentation server using:

```bash
yarn
yarn start
```

### Creating New Documentation Pages

Add your markdown files inside the `docs` folder, and they will automatically appear on the documentation site.

## 🛠️ **Common Setup**

### 🎨 Prettier Setup

- Prettier is configured in the root of the workspace with a `.prettierrc` file.
- Adjust any Prettier settings globally, and they will apply to all apps/libraries in the workspace.

### 🧹 ESLint Setup

- The boilerplate includes a centralized ESLint configuration found in `.eslintrc`.
- Each app and library will inherit these ESLint rules. Modify the configurations as needed.

### 🧪 Jest Setup

- Jest is pre-configured for both unit and integration tests.
- Each application/library can have its specific `jest.config.js` file.
- Run all tests using:

```bash
nx test
```

### 🐶 Pre-commit Hooks with Husky

The boilerplate uses **Husky** for pre-commit hooks to ensure consistent code formatting and linting before commits.

Install Husky by running:

```bash
npx husky install
```

Husky will automatically check for ESLint and Prettier errors before committing.

## 🗂️ **Folder Structure**

Here's a quick overview of the folder structure:

```bash
/apps
  /backend    # Contains the NestJS application
  /frontend   # Contains the Next.js application
/libs
  /shared     # Shared code between apps (utils, models, services, etc.)
/docs         # Documentation files for Docusaurus
/nx.json      # Nx workspace configuration
/package.json # Root package.json for managing dependencies
/tsconfig.base.json # Shared TypeScript configuration
/.prettierrc  # Prettier configuration
/.eslintrc    # ESLint configuration
/jest.config.js # Jest configuration
```

## 🧩 **Adding Shared Code**

You can create reusable modules, utilities, and services inside the `libs` folder. Import them into your apps using path aliases defined in `tsconfig.base.json`.

### Example

If you add a utility function in `libs/shared/src/utils/helper.ts`, you can import it in your backend or frontend as:

```typescript
import { myHelperFunction } from '@shared/utils/helper';
```

---

## 📊 **Nx Workspace Essentials**

✨ Your Nx workspace is almost ready! Here are some quick tips to get started:

### 🎯 Running Tasks

To run the dev server for your app, use (Assuming app name as backend-boilerplate):

```sh
npx nx serve backend-boilerplate
```

To create a production bundle:

```sh
npx nx build backend-boilerplate
```

To see all available targets to run for a project, use:

```sh
npx nx show project backend-boilerplate
```

### 🔍 Explore Your Workspace

You can run `npx nx graph` to visualize your Nx workspace's project and dependencies graph. It's a great way to understand how different parts of your workspace connect.

## 🚀 **Nx Console**

Enhance your Nx experience with the **Nx Console**, an editor extension that enriches your development workflow. It allows you to run tasks, generate code, and improve code autocompletion in your IDE. It is available for **VSCode** and **IntelliJ**.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

---

## 🤝 **Contribution Guidelines**

1. **Branch Naming**: Use meaningful branch names like `feature/add-auth`, `fix/bug-fix-description`.
2. **Commit Messages**: Follow conventional commit messages like `feat: add user authentication`, `fix: resolve login issue`.
3. **Code Reviews**: All code changes should go through pull requests for proper code review.

---

Enjoy building your project with this Nx-powered app boilerplate! 🎉
