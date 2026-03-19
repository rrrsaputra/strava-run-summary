import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStravaActivities, Activity } from "@/lib/strava";
import Link from "next/link";
import CalendarView from "@/components/CalendarView";

export default async function KalenderPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-black min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
        <p className="mb-4 text-gray-600 dark:text-gray-400">Silakan login melalui halaman utama terlebih dahulu.</p>
        <Link href="/" className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  let allActivities: Activity[] = [];
  try {
    allActivities = await getStravaActivities(session.accessToken as string);
  } catch (error) {
    console.error("Gagal mengambil aktivitas:", error);
  }

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-orange-600 mb-4 inline-flex items-center gap-1 transition">
            &larr; Kembali
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Kalender <span className="text-orange-600">Terbuka</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Lihat semua progres aktivitas secara bulanan.
          </p>
        </div>
      </div>

      <CalendarView activities={allActivities} />
    </main>
  );
}
