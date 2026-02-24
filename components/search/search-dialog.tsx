"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";

interface StateEntry {
  id: string;
  name: string;
  region: string;
}

interface CategoryEntry {
  id: string;
  name: string;
}

const STATES: StateEntry[] = [
  { id: "andhra-pradesh", name: "Andhra Pradesh", region: "South" },
  { id: "arunachal-pradesh", name: "Arunachal Pradesh", region: "Northeast" },
  { id: "assam", name: "Assam", region: "Northeast" },
  { id: "bihar", name: "Bihar", region: "East" },
  { id: "chhattisgarh", name: "Chhattisgarh", region: "Central" },
  { id: "goa", name: "Goa", region: "West" },
  { id: "gujarat", name: "Gujarat", region: "West" },
  { id: "haryana", name: "Haryana", region: "North" },
  { id: "himachal-pradesh", name: "Himachal Pradesh", region: "North" },
  { id: "jharkhand", name: "Jharkhand", region: "East" },
  { id: "karnataka", name: "Karnataka", region: "South" },
  { id: "kerala", name: "Kerala", region: "South" },
  { id: "madhya-pradesh", name: "Madhya Pradesh", region: "Central" },
  { id: "maharashtra", name: "Maharashtra", region: "West" },
  { id: "manipur", name: "Manipur", region: "Northeast" },
  { id: "meghalaya", name: "Meghalaya", region: "Northeast" },
  { id: "mizoram", name: "Mizoram", region: "Northeast" },
  { id: "nagaland", name: "Nagaland", region: "Northeast" },
  { id: "odisha", name: "Odisha", region: "East" },
  { id: "punjab", name: "Punjab", region: "North" },
  { id: "rajasthan", name: "Rajasthan", region: "West" },
  { id: "sikkim", name: "Sikkim", region: "Northeast" },
  { id: "tamil-nadu", name: "Tamil Nadu", region: "South" },
  { id: "telangana", name: "Telangana", region: "South" },
  { id: "tripura", name: "Tripura", region: "Northeast" },
  { id: "uttar-pradesh", name: "Uttar Pradesh", region: "North" },
  { id: "uttarakhand", name: "Uttarakhand", region: "North" },
  { id: "west-bengal", name: "West Bengal", region: "East" },
  { id: "andaman-nicobar", name: "Andaman & Nicobar Islands", region: "Islands" },
  { id: "chandigarh", name: "Chandigarh", region: "North" },
  { id: "dadra-nagar-haveli-daman-diu", name: "Dadra & Nagar Haveli and Daman & Diu", region: "West" },
  { id: "delhi", name: "Delhi", region: "North" },
  { id: "jammu-kashmir", name: "Jammu & Kashmir", region: "North" },
  { id: "ladakh", name: "Ladakh", region: "North" },
  { id: "lakshadweep", name: "Lakshadweep", region: "Islands" },
  { id: "puducherry", name: "Puducherry", region: "South" },
];

const CATEGORIES: CategoryEntry[] = [
  { id: "economy", name: "Economy & Income" },
  { id: "employment", name: "Employment & Labour" },
  { id: "education", name: "Education" },
  { id: "health", name: "Health & Healthcare" },
  { id: "women-gender", name: "Women & Gender" },
  { id: "children-youth", name: "Children & Youth" },
  { id: "elderly", name: "Elderly" },
  { id: "prices", name: "Prices & Cost of Living" },
  { id: "agriculture", name: "Agriculture & Food" },
  { id: "industry", name: "Industry & Manufacturing" },
  { id: "infrastructure", name: "Infrastructure" },
  { id: "energy-environment", name: "Energy & Environment" },
  { id: "crime-justice", name: "Crime & Justice" },
  { id: "governance", name: "Governance & Public Services" },
  { id: "financial-inclusion", name: "Financial Inclusion" },
  { id: "sports", name: "Sports & Fitness" },
  { id: "culture-tourism", name: "Culture, Tourism & Heritage" },
  { id: "demographics", name: "Demographics & Social" },
  { id: "digital-tech", name: "Digital & Technology" },
  { id: "transport", name: "Transport & Mobility" },
  { id: "media", name: "Media & Information" },
  { id: "migration", name: "Migration & Diaspora" },
  { id: "civil-society", name: "Civil Society" },
  { id: "urban-quality", name: "Urban Quality of Life" },
  { id: "mental-health", name: "Mental Health & Well-being" },
  { id: "disability", name: "Disability & Inclusion" },
  { id: "telecom", name: "Telecom & Connectivity" },
];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(url: string) {
    setOpen(false);
    router.push(url);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border bg-popover shadow-xl">
          <Command className="flex flex-col" label="Search">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder="Search states and categories..."
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              <Command.Group heading="States" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {STATES.map((s) => (
                  <Command.Item
                    key={s.id}
                    value={s.name}
                    onSelect={() => navigate(`/states/${s.id}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                  >
                    <span>{s.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{s.region}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Categories" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {CATEGORIES.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={c.name}
                    onSelect={() => navigate(`/rankings/${c.id}`)}
                    className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm aria-selected:bg-accent"
                  >
                    {c.name}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-background px-1.5 text-[10px] font-medium">
        ⌘K
      </kbd>
    </button>
  );
}
