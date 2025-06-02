# 🚀 App Boilerplate

Welcome to the **App Boilerplate**! This template serves as a robust foundation for building applications using a **monorepo** structure. It integrates seamlessly with **Backend** and **Frontend** applications while offering a shared workspace for common packages, documentation using **Docusaurus**, and pre-configured setups for **ESLint**, **Prettier**, and **PlayWright**.

## 🎯 **Overview**

This boilerplate is designed to:

- ✅ Support multiple **Backend** and **Frontend** applications within the same workspace (Next.js, NestJS etc.).
- ✅ Provide a shared **libs** & **utils** folder for reusable code across different apps.
- ✅ Integrate **Docusaurus** for centralized documentation.
- ✅ Offer pre-configured **PlayWright**, **ESLint**, and **Prettier** setups for consistent code quality.
- ✅ Set up base TypeScript configurations for all projects.

## 🛠️ **Getting Started**

### Step 1: 🔧 Fork and Clone the Boilerplate

- Start by forking [this repository](https://git.geekyants.com/geekyants/coe-grp/boilerplates/base-template/app) to your git & give a name to your project.
- Clone the repo that's created by forking the base-template.

```bash
git clone {your-git-repo-link-which-is-forked-from-base-template}
cd {project-name}
```

### Step 2: 🚀 Running the Applications

```bash
# Install the dependencies
yarn install
# or
npm install

# For docs
yarn docs:dev
# or
npm run docs:dev
```

Refer to the documentation in each folder to understand what need to be added in `apps/`, `libs/` and `tests/`

## 📚 **Documentation with Docusaurus**

This boilerplate includes **Docusaurus** for maintaining project documentation under `apps/documentation`.

### 📝 Starting Docusaurus

Start the documentation server using:

```bash
yarn
yarn docs:dev
```

### 📄 Creating New Documentation Pages

Add your markdown files inside the `docs` folder, and they will automatically appear on the documentation site.

## 🛠️ **Common Setup**

### 🎨 Prettier Setup

- Prettier is configured at the root of the workspace using a `.prettierrc` file.
- Modify Prettier settings globally, and they will apply to all apps/libraries within the workspace.

### 🧹 ESLint Setup

- The boilerplate includes a centralized ESLint configuration located in `.eslintrc`.
- All apps and libraries inherit these ESLint rules. Feel free to adjust configurations as needed.

### 🧪 PlayWright Setup

- PlayWright is pre-configured for functional tests.
- Each application/library can maintain its own testing framework like `jest` for both unit and integration tests.
- Run all tests using:

```bash
nx test
```

## 🗂️ **Folder Structure**

Here’s a brief overview of the folder structure:

```bash
/apps
  /documentation  # Documentation files for Docusaurus
  /backend        # Contains the NestJS application (APP1)
  /frontend       # Contains the Next.js application (APP2)
  /...            # Other apps...
/libs
  /shared             # Shared code between apps (utils, models, services, etc.)
/package.json         # Root package.json for managing dependencies
/tsconfig.base.json   # Shared TypeScript configuration
/.prettierrc          # Prettier configuration
/.eslintrc            # ESLint configuration
/playwright.config.js # Jest configuration
```

---

✨ We hope this app boilerplate serves as an effective foundation for your project. Enjoy building! 🎉

Also, Refer to the [PipeLineChanges](./apps/documentation/docs/PipeLineChanges.md) document for making sure the CI/CD pipeline works from the very beginning of the project.
