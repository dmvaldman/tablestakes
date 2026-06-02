import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Me } from "./identity";
import type { MealView } from "./stats";

// All meals you're a participant in (timeline + friend stats). `undefined`
// while loading. Centralizes the one cast both tabs need.
export function useMyMeals(me: Me): MealView[] | undefined {
  return useQuery(api.meals.mealsForUser, { userId: me.id }) as
    | MealView[]
    | undefined;
}
