export async function getStravaActivities(accessToken: string) {
    let page = 1;
    let allActivities: Activity[] = [];
    const perPage = 200;

    while (true) {
        const res = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                next: { revalidate: 3600 }, // Cache for 1 hour
            }
        );

        if (!res.ok) {
            // If one page fails, we might still want to return what we have, but throwing is safer to indicate issue
            console.error(`Failed to fetch activities page ${page}: ${res.statusText}`);
            break;
        }

        const activities: Activity[] = await res.json();

        if (activities.length === 0) {
            break;
        }

        allActivities.push(...activities);

        // Optimization: If we got fewer than perPage, it's the last page
        if (activities.length < perPage) {
            break;
        }

        page++;

        // Safety limit: 30 pages * 200 = 6000 activities. 
        // Increase if user is a super heavy user, but this prevents infinite loops.
        if (page > 30) break;
    }

    return allActivities;
}

export type Activity = {
    id: number;
    name: string;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    total_elevation_gain: number;
    type: string;
    sport_type: string;
    start_date: string;
    start_date_local: string;
    average_speed: number;
    max_speed: number;
    kudos_count: number;
    achievement_count: number;
    map: {
        id: string;
        summary_polyline: string;
    };
    description?: string;
    gear?: {
        id: string;
        primary: boolean;
        name: string;
        distance: number;
    };
    splits_metric?: {
        distance: number;
        elapsed_time: number;
        elevation_difference: number;
        moving_time: number;
        split: number;
        average_speed: number;
        pace_zone: number;
        average_heartrate?: number;
    }[];
    gear_id: string;
};

export async function getAthleteProfile(accessToken: string) {
    const res = await fetch("https://www.strava.com/api/v3/athlete", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch athlete profile");
    }

    return res.json();
}

export async function getActivityById(accessToken: string, id: string) {
    const res = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch activity");
    }

    return res.json();
}
