import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStravaActivities, getAthleteProfile, Activity } from "@/lib/strava";
import { Dashboard } from "@/components/Dashboard";
import { LoginButton } from "@/components/LoginButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-black">
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

  try {
    const [activitiesData, athleteData] = await Promise.all([
      getStravaActivities(session.accessToken as string),
      getAthleteProfile(session.accessToken as string)
    ]);
    activities = activitiesData;
    athlete = athleteData;
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
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
          </div>
        )}
      </header>

      <Dashboard activities={activities} shoes={athlete?.shoes || []} />
    </main>
  );
}
