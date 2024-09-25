---
sidebar_position: 1
---

# 🗂️ Add Backend Apps

You can use different backend frameworks such as **NestJS**, **ExpressJS**, **Laravel**, **Spring Boot**, and others.

## 📋 **Guidelines**

- You can name your backend application(s) with relevant names, like:
  - Examples:
    - `nestjs-app` for NestJS
    - `laravel-app` for Laravel
    - `expressjs-app` for ExpressJS
    - `springboot-app` for Spring Boot
- For multiple backend applications, create separate folders inside the `apps/` directory with relevant names, like:
  - `nest-dashboard-app`
  - `laravel-auth-app`
  - `springboot-service-app`

Make sure to follow the structure and naming conventions consistently for better maintainability.

## 📚 **Quick Start: Adding Backend Frameworks**

You can follow the detailed documentation provided in this workspace to integrate your preferred backend framework seamlessly.

### 🔄 **Adding Backend Applications to Your Workspace**

We provide boilerplates for various backend frameworks to make your integration process smoother. You can download and add these frameworks to your workspace `apps/` folder.

#### 🚀 **Available Backend Boilerplates**

- **NestJS**: [Download NestJS Boilerplate](https://git.geekyants.com/geekyants/coe-grp/boilerplates/backend/nestjs)
- **Laravel**: [To be added](https://git.geekyants.com/geekyants/coe-grp/boilerplates/backend)
- **ExpressJS**: [To be added](https://git.geekyants.com/geekyants/coe-grp/boilerplates/backend)
- **Spring Boot**: [To be added](https://git.geekyants.com/geekyants/coe-grp/boilerplates/backend)

> **Note**: Download the repositories as a **ZIP file** to avoid git reference issues.

### 🛠️ **Updating `tsconfig.json`**

Ensure that your `tsconfig.json` in each app extends the base `tsconfig` from the workspace level for a unified setup.

**Example:**

```json
{
  "extends": "../../tsconfig.base.json", // Use the correct relative path
  "compilerOptions": {
    // Your existing options
  }
}
```

### 🔧 **Updating `package.json` Scripts**

To manage the backend apps easily, update the workspace-level `package.json` scripts with your actual application names.

**Example:**

```json
{
  "nestjs:start": "npm run start --workspace=nestjs-app", // Replace 'nestjs-app' with your app name
  "laravel:start": "npm run start --workspace=laravel-app"  // Replace 'laravel-app' with your app name
}
```

> **Note**: Application name is present in `package.json` of your backedn application (It's not the folder-name)

### 📝 **Configuring `project.json`**

- Ensure that each backend application has its own `project.json` file configured with necessary scripts and settings.
- This will allow you to leverage Nx for running your applications effectively from the workspace level.
