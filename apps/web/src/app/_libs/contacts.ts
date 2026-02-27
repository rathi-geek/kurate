export interface Contact {
  name: string;
  handle: string;
  online: boolean;
}

export interface TrustedCurator {
  name: string;
  handle: string;
  mutualTrust: boolean;
}

export const MOCK_CONTACTS: Contact[] = [
  { name: "Suchet", handle: "@suchet", online: true },
  { name: "Naman", handle: "@naman", online: true },
  { name: "Arshia", handle: "@arshia", online: false },
  { name: "Priya R.", handle: "@priya", online: false },
  { name: "Aditya", handle: "@aditya", online: false },
  { name: "Shreya M.", handle: "@shreya", online: true },
];

export const MOCK_TRUSTED_CURATORS: TrustedCurator[] = [
  { name: "Suchet", handle: "@suchet", mutualTrust: true },
  { name: "Naman", handle: "@naman", mutualTrust: true },
  { name: "Arshia", handle: "@arshia", mutualTrust: true },
  { name: "Priya R.", handle: "@priya", mutualTrust: false },
  { name: "Aditya", handle: "@aditya", mutualTrust: true },
  { name: "Shreya M.", handle: "@shreya", mutualTrust: true },
];

export interface Group {
  name: string;
  members: number;
  color: string;
  slug: string;
  memberHandles: string[];
}

export const MOCK_GROUPS: Group[] = [
  {
    name: "The Reading Club",
    members: 3,
    color: "#1A5C4B",
    slug: "the-reading-club",
    memberHandles: ["@suchet", "@arshia", "@priya"],
  },
  {
    name: "Product Team",
    members: 5,
    color: "#D8C9F0",
    slug: "product-team",
    memberHandles: ["@naman", "@arshia", "@priya", "@aditya", "@shreya"],
  },
  {
    name: "AI Research",
    members: 4,
    color: "#F0C27A",
    slug: "ai-research",
    memberHandles: ["@suchet", "@naman", "@aditya", "@shreya"],
  },
  {
    name: "Design Critique",
    members: 6,
    color: "rgba(26,26,26,0.4)",
    slug: "design-critique",
    memberHandles: ["@suchet", "@naman", "@arshia", "@priya", "@aditya", "@shreya"],
  },
  {
    name: "Book Club",
    members: 3,
    color: "#1A5C4B",
    slug: "book-club",
    memberHandles: ["@suchet", "@priya", "@shreya"],
  },
];

export function getMembersForGroup(group: Group): Contact[] {
  return group.memberHandles
    .map((h) => MOCK_CONTACTS.find((c) => c.handle === h))
    .filter((c): c is Contact => c !== undefined);
}
