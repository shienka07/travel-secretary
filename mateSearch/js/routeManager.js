// routeManager.js
import { supabase, mateTable } from "./config.js";

export async function saveRouteData(postingId) {
  try {
    const { routes, locations } = collectRouteData();

    if (routes.length === 0) {
      throw new Error("저장할 경로가 없습니다.");
    }

    const { error } = await supabase
      .from(mateTable)
      .update({
        routes: routes,
        locations: locations,
      })
      .eq("id", postingId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("경로 저장 중 오류:", error);
    return { success: false, error };
  }
}

export async function loadRouteData(postingId) {
  try {
    const { data, error } = await supabase
      .from(mateTable)
      .select("routes, locations")
      .eq("id", postingId)
      .single();

    if (error) throw error;

    if (data?.routes) {
      displayRouteData(data.routes);
      drawAllRoutes();
    }

    return { success: true, data };
  } catch (error) {
    console.error("경로 불러오기 중 오류:", error);
    return { success: false, error };
  }
}

function collectRouteData() {
  const routes = [];
  const locations = [];

  const daySections = document.querySelectorAll(".day-section");

  daySections.forEach((section, dayIndex) => {
    const dayInputs = section.querySelectorAll(".place-input");
    const dayPlaces = Array.from(dayInputs)
      .map((input) => input.value.trim())
      .filter((value) => value !== "");

    if (dayPlaces.length > 0) {
      routes.push({
        day: dayIndex + 1,
        places: dayPlaces,
      });

      dayPlaces.forEach((place) => {
        locations.push({
          name: place,
          day: dayIndex + 1,
        });
      });
    }
  });

  return { routes, locations };
}
