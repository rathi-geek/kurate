# 🚀 App Boilerplate

![Nx Logo](https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png)

Welcome to the **App Boilerplate**! This template serves as a robust foundation for building applications using a **monorepo** structure managed by Nx. It integrates seamlessly with **NestJS** (Backend) and **Next.js** (Frontend) applications while offering a shared workspace for common packages, documentation using **Docusaurus**, and pre-configured setups for **ESLint**, **Prettier**, and **Jest**.

## 🎯 **Overview**

This boilerplate is designed to:

- ✅ Support multiple **Backend** (NestJS) and **Frontend** (Next.js) applications within the same workspace.
- ✅ Provide a shared **lib** & **utils** folder for reusable code across different apps.
- ✅ Integrate **Docusaurus** for centralized documentation.
- ✅ Offer pre-configured **Jest**, **ESLint**, and **Prettier** setups for consistent code quality.
- ✅ Set up base TypeScript configurations for all projects.
- ✅ Ensure that the `src` folder is used only for documentation purposes, avoiding usage for actual projects.

## 🛠️ **Getting Started**

### Step 1: 🔧 Fork and Clone the Boilerplate

Start by forking this repository to your project's repository and cloning it:

```bash
git clone git@git.geekyants.com:geekyants/coe-grp/boilerplates/app.git
cd app
```

### Step 2: 🔄 Adding Backend and Frontend Applications

- Download either or both the backend (NestJS) and frontend (Next.js) boilerplates as needed (**Download as a zip** to avoid git submodules):

  - 🌐 [Backend (NestJS)](https://git.geekyants.com/geekyants/coe-grp/boilerplates/nestjs.git)
  - 🌐 [Frontend (Next.js)](https://git.geekyants.com/geekyants/coe-grp/boilerplates/nextjs.git)

- Remove the existing apps under the `apps/` directory at the workspace level and replace them with the downloaded applications.
- Update your `tsconfig.json` file in the respective apps by extending the base `tsconfig` at the workspace level.

```json
{
  "extends": "../../tsconfig.base.json", // Use the correct path
  "compilerOptions": {
    // Existing Options
  }
}
```

- Update the workspace-level `package.json` scripts with your actual application names:

```json
{
  "app1:start": "npm run start --workspace=APP1", // Replace APP1 with your actual app name
  "app2:start": "npm run start --workspace=APP2"  // Replace APP2 with your actual app name
}
```

- Perform a global search at the workspace level for `backend-boilerplate` and replace it with your actual app name (added inside the `apps/` directory).
- Update the `project.json` file in each application to include any scripts you require, allowing you to leverage Nx for running them from the workspace level.

### Step 3: ⚙️ Configuring the Nx Workspace

- Ensure that both the {backend} and {frontend} apps are correctly placed inside the `apps/` folder.
- For shared or common code, add it to the `libs/` folder, and configure the `tsconfig.base.json` file at the workspace level for easy imports.

Example `tsconfig.base.json` configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["libs/shared/*"]
    }
  }
}
```

### Step 4: 🚀 Running the Applications

Install Nx globally if you haven't already:

```bash
npm install -g nx
```

Run and manage your applications from the workspace level. Use `npm` scripts if you haven't configured the `project.json` in each application. If you have configured `project.json`, use Nx commands directly.

```bash
# Install the dependencies
yarn install
# or
npm install

# For app1
npm run app1:start
# or
nx serve app1

# For app2
npm run app2:start
# or
nx serve app2

# Continue for all the apps...
```

### Step 5: 🧩 Adding New Modules to NestJS Application

You can take a look at the 📦 **[CoE's Project Sample](https://git.geekyants.com/geekyants/coe-grp/project-sample/-/tree/main/Monolith/apps/backend?ref_type=heads)** repository and pick any module that you need. These modules can be manually added to your backend **NestJS** applications.

#### 🌟 **Step-by-Step Process**

1. **Identifying Your Required Module** 🔍:
   - Suppose there's a new requirement to add an **SMS** Module. First, navigate to the `src/` folder in the COE's project sample repository linked above.

2. **Copy the Module Folder** 📂:
   - Copy the entire `Sms/` folder and place it in your NestJS application under the appropriate directory.

3. **Handling Environment Variables** 🌐:
   - The module may require specific environment variables. Refer to the `.env.example` file in the COE's project sample repository.
   - For instance, if you’re adding the **SMS** module, you might need the following environment variables:

   ```bash
   # Sending SMS
   TWILIO_ACCOUNT_SID=ACXXXXXXXXX
   TWILIO_AUTH_TOKEN=XXXXXXXXX
   TWILIO_SOURCE_NUMBER="+16518675309"
   ```

   - Add these variables to your `.env` file with the actual values.

4. **Integrating with Your Configuration Module** ⚙️:
   - Navigate to the `config/` module in your NestJS application.
   - Add the new environment variables to the `env.config.ts` file.
   - In `envConfig.module.ts`, register the new variables in the `envConfig` method and add validation using Joi for these variables within the `validationSchema` object.

5. **Managing Dependencies** 🧱:
   - If the module depends on other modules, such as the **DB** module, copy the `Db/` module from the COE's project sample repository as well.
   - Remove any unnecessary folders to keep only the relevant data. For example, if you're using an **Auth** module, keep only the migrations and DB modules required for authentication.

6. **Database Configuration** 🛠️:
   - Ensure that the database is correctly set up by adding the necessary DB image to your `docker-compose.yml` file, especially if you don't have an existing connection URL.

---

This process ensures that your new module is fully integrated and functional within your backend project. Feel free to adjust any configurations according to your specific requirements! 🚀

## 📚 **Documentation with Docusaurus**

This boilerplate includes **Docusaurus** for maintaining project documentation.

### 📝 Starting Docusaurus

Start the documentation server using:

```bash
yarn
yarn start
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

### 🧪 Jest Setup

- Jest is pre-configured for both unit and integration tests.
- Each application/library can maintain its own `jest.config.js` file.
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

Husky will automatically validate your code with ESLint and Prettier before allowing you to commit.

## 🗂️ **Folder Structure**

Here’s a brief overview of the folder structure:

```bash
/apps
  /backend    # Contains the NestJS application (APP1)
  /frontend   # Contains the Next.js application (APP2)
  /...        # Other apps...
/libs
  /shared     # Shared code between apps (utils, models, services, etc.)
/docs         # Documentation files for Docusaurus
/src          # Reserved for Docusaurus only (avoid using it for projects)
/nx.json      # Nx workspace configuration
/package.json # Root package.json for managing dependencies
/tsconfig.base.json # Shared TypeScript configuration
/.prettierrc  # Prettier configuration
/.eslintrc    # ESLint configuration
/jest.config.js # Jest configuration
```

## 🧩 **Adding Shared Code**

You can create reusable modules, utilities, and services inside the `libs/` folder. Import them into your apps using path aliases defined in `tsconfig.base.json` at the workspace level.

### Example

If you add a utility function in `libs/shared/utils/helper.ts`, you can import it into your backend or frontend as:

```typescript
import { myHelperFunction } from '@shared/utils/helper';
```

## 📊 **Nx Workspace Essentials**

✨ Your Nx workspace is almost ready! Here’s how to make the most of it:

### 🎯 Running Tasks

To run the development server for your app (assuming the app name is backend-boilerplate):

```sh
npx nx serve backend-boilerplate
```

To create a production bundle:

```sh
npx nx build backend-boilerplate
```

To view all available targets for a project, use:

```sh
npx nx show project backend-boilerplate
```

### 🔍 Explore Your Workspace

Run `npx nx graph` to visualize the project and dependencies graph within your Nx workspace, helping you understand how different parts of your workspace interconnect.

## 🚀 **Nx Console**

Enhance your Nx experience with the **Nx Console**, an editor extension that makes development smoother. It allows you to run tasks, generate code, and provides improved code autocompletion in your IDE. It’s available for **VSCode** and **IntelliJ**.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## 🤝 **Contribution Guidelines**

1. **Branch Naming**: Use meaningful branch names like `feature/add-auth`, `fix/bug-fix-description`.
2. **Commit Messages**: Follow conventional commit messages like `feat: add user authentication`, `fix: resolve login issue`.
3. **Code Reviews**: Submit all code changes via pull requests for proper code review.

---

✨ We hope this Nx-powered app boilerplate serves as an effective foundation for your next project. Enjoy building! 🎉
