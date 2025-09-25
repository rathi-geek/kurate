# Documentation Style Guide

## ISO Markdown Standards

This guide ensures consistent, build-safe documentation across the monorepo.

## File Organization

### Directory Structure

All documentation must follow the app-based organization:

```plaintext
docs/
├── backend/              # Backend application documentation
├── frontend/             # Frontend application documentation
├── shared/               # Shared libraries documentation
└── meta/                 # Project-wide documentation
```

### File Naming

- **Format**: Use kebab-case for all files
- **Examples**: `api-reference.md`, `user-guide.md`, `setup-instructions.md`
- **Avoid**: CamelCase, snake_case, or spaces in filenames

## Markdown Formatting Rules

### Headers

Use proper heading hierarchy without skipping levels:

```markdown
# H1 - Document Title (only one per document)
## H2 - Main Sections
### H3 - Subsections
#### H4 - Sub-subsections (use sparingly)
```

### Lists

Always add blank lines before and after lists:

```markdown
This is a paragraph.

- List item one
- List item two
- List item three

This is another paragraph.
```

### Code Blocks

Always specify the language for syntax highlighting:

````markdown
```javascript
const example = 'Always specify language';
```

```bash
pnpm install
```

```json
{
  "example": "JSON configuration"
}
```
````

### Links

Use proper markdown link syntax:

```markdown
[Link Text](https://example.com)
[Internal Link](./other-document.md)
```

### Images

Use descriptive alt text and relative paths:

```markdown
![Descriptive alt text](../assets/image-name.png)
```

## Content Guidelines

### Writing Style

- **Clear and Concise**: Use simple, direct language
- **Active Voice**: Prefer active over passive voice
- **Present Tense**: Use present tense for instructions
- **Consistent Terminology**: Use the same terms throughout

### Code Examples

- **Complete**: Provide working, complete examples
- **Commented**: Add comments to explain complex code
- **Tested**: Ensure all code examples work correctly
- **Language-Specific**: Use appropriate syntax highlighting

### Structure Standards

Each document should include:

1. **Title**: Clear, descriptive H1 header
2. **Overview**: Brief description of the content
3. **Prerequisites**: What readers need to know/have
4. **Main Content**: Organized with clear sections
5. **Examples**: Practical usage examples
6. **Next Steps**: What to do after reading

## Build Validation

### Critical Requirements

These rules prevent build failures:

- ✅ **Single H1**: Only one H1 header per document
- ✅ **Heading Sequence**: No skipped heading levels
- ✅ **Code Languages**: All fenced code blocks must specify language
- ✅ **List Spacing**: Blank lines before and after all lists
- ✅ **Trailing Newline**: Single newline at end of file
- ✅ **No Trailing Spaces**: Remove trailing whitespace

### Common Errors

Avoid these build-breaking mistakes:

- ❌ Fenced code without language: ````
- ❌ Jumping heading levels: H1 → H3
- ❌ Lists without spacing
- ❌ Multiple H1 headers
- ❌ Missing trailing newline

## Review Process

### Before Publishing

1. **Spell Check**: Use spell checker for accuracy
2. **Grammar Check**: Ensure proper grammar and punctuation
3. **Link Verification**: Test all internal and external links
4. **Build Test**: Run `pnpm docs:dev` to verify rendering
5. **Format Validation**: Check for markdown linting errors

### Maintenance

- **Regular Updates**: Keep content current with code changes
- **Broken Link Checks**: Periodically verify all links work
- **User Feedback**: Incorporate feedback from documentation users
- **Version Control**: Track changes and maintain history

## AI Assistant Guidelines

When working with AI assistants on documentation:

- **Provide Context**: Reference this style guide
- **Validate Output**: Always check AI-generated content for compliance
- **Test Builds**: Verify documentation builds successfully
- **Human Review**: Have humans review AI-generated documentation

---

*Follow these guidelines to ensure consistent, professional documentation that serves both human readers and AI assistants effectively.*