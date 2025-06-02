---
sidebar_position: 3
---

# 📚 Add Shared Libraries

The `libs` folder serves as the central hub for **shared libraries** and **reusable code** that can be utilized across multiple applications in your workspace. This makes it easy to maintain a clean, modular, and efficient codebase.

## 🏗️ **Structure**

- Organize different **sub-folders** for each shared functionality or module.
- For example:
  - `shared`: For utility functions, common helpers, constants, and data models.
  - `common-components`: For reusable UI components or widgets that might be used across different frontend applications.
  - `services`: For shared services like authentication, API handling, caching, etc.

## 📌 **Guidelines**

- Ensure that the code within this folder is **framework-agnostic** and can be effortlessly integrated into any application within the workspace.
- Use **meaningful and descriptive** names for each sub-folder to clearly indicate its purpose.

## 🔄 **Integration with Applications**

You can easily import these shared libraries into any application using **path aliases** defined in `tsconfig.base.json`.

### Example Configuration

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["libs/shared/*"],
      "@components/*": ["libs/common-components/*"],
      "@services/*": ["libs/services/*"]
    }
  }
}
```

### 🌟 **Why Use the Libs Folder?**

- Promotes **code reusability** and prevents duplication.
- Helps maintain a **clean and organized** codebase.
- Makes the workspace **scalable** by allowing multiple applications to leverage the same functionality.

## 💡 **Best Practices**

1. **Modularization**: Create individual modules for distinct functionalities, ensuring each module does one thing well.
2. **Consistency**: Maintain consistent coding standards, naming conventions, and folder structures across all libraries.
3. **Documentation**: Add clear documentation/comments within your shared modules for better understanding and usage.
