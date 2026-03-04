import { createNavigation } from "next-intl/navigation";

import { routing } from "./config";

// Use these instead of next/link and next/navigation in app code.
// They handle locale context automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
