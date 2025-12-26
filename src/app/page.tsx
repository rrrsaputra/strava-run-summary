import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStravaActivities, getAthleteProfile, getGearById, Activity } from "@/lib/strava";
import { Dashboard, Gear } from "@/components/Dashboard";
import { LoginButton } from "@/components/LoginButton";
import { LogoutButton } from "@/components/LogoutButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return (
      <main className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-black h-full min-h-[calc(100vh-6rem)]">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Strava <span className="text-orange-600">Summary</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mb-8">
          Visualize your activity history with a GitHub-style contribution graph.
          Connect your Strava account to get started.
        </p>
        <LoginButton />
      </main>
    );
  }

  // Fetch data
  let activities: Activity[] = [];
  let athlete: any = null;
  let allShoes: Gear[] = [];
  let fetchError: string | null = null;

  try {
    const [activitiesData, athleteData] = await Promise.all([
      getStravaActivities(session.accessToken as string),
      getAthleteProfile(session.accessToken as string)
    ]);
    activities = activitiesData;
    athlete = athleteData;

    // Identify active shoes
    const activeShoes = athlete?.shoes || [];
    const activeShoeIds = new Set(activeShoes.map((s: Gear) => s.id));

    // Identify missing (retired) gear from activities
    const usedGearIds = new Set<string>();
    activities.forEach(a => {
      if (a.gear_id) usedGearIds.add(a.gear_id);
    });

    const missingGearIds = Array.from(usedGearIds).filter(id => !activeShoeIds.has(id));

    // Fetch missing gear details
    const missingGearPromises = missingGearIds.map(id => getGearById(session.accessToken as string, id));
    const fetchedGear = await Promise.all(missingGearPromises);

    // Filter out nulls (failed fetches)
    const retiredShoes = fetchedGear.filter(g => g !== null) as Gear[];

    // Combined list
    allShoes = [...activeShoes, ...retiredShoes];

  } catch (error) {
    console.error("Error fetching data:", error);
    fetchError = "Failed to synchronize data from Strava. Your session may have expired.";
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            Strava <span className="text-orange-600">Summary</span>
          </h1>
        </div>

        {athlete && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{athlete.firstname} {athlete.lastname}</p>
              <p className="text-xs text-gray-500">{activities.length} activities</p>
            </div>
            <img src={athlete.profile} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200" />
            <div className="ml-2 border-l pl-4 border-gray-200 dark:border-zinc-800">
              <LogoutButton />
            </div>
          </div>
        )}
      </header>

      {fetchError && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
          <div className="text-red-600 dark:text-red-400 text-sm">
            <strong>Sync Error:</strong> {fetchError}
          </div>
          <LogoutButton />
        </div>
      )}

      <Dashboard activities={activities} shoes={allShoes} />
    </main>
  );
}
