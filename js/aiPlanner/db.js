import { supabase } from "../supabase.js"

const tableName = "travel_planner";

// 삽입 - 데이터 타입 검증 추가
async function addDBData(userId, name, content, location, dailyPlaces) {
  // 입력값 검증
  if (!userId || !name) {
    console.error("❌ userId와 name은 필수값입니다.");
    return;
  }

  // 데이터 형식 확인
  const insertData = {
    user_id: userId,
    list_name: name,
    list_content: content || null,
    list_location: location || null,
    list_daily_places: dailyPlaces || null,
  };

  const { data, error } = await supabase
    .from(tableName)
    .insert([insertData])
    .select(); // 삽입 후 데이터 반환을 위해 select() 추가

  if (error) {
    console.error("❌ 데이터 삽입 실패:", error);
    throw error;
  } else {
    console.log("✅ 데이터 삽입 성공:", data);
    return data;
  }
}

// userId로 조회
async function getDBDataByUserId(user_id) {
  if (!user_id) {
    console.error("❌ user_id는 필수값입니다.");
    return;
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("user_id", user_id);

  if (error) {
    console.error("❌ 데이터 조회 실패:", error);
    throw error;
  }

  return data;
}

// 로그인된 id 조회
async function getId() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) {
      console.log("❌ 로그인된 유저가 없습니다.");
      return null;
    }

    const { data: userInfo, error: userError } = await supabase
      .from("userinfo")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) throw userError;
    if (!userInfo) {
      console.log("❌ 해당 ID의 유저 정보가 없습니다.");
      return null;
    }

    return userInfo.id;
  } catch (error) {
    console.error("❌ 유저 정보 조회 실패:", error);
    return null;
  }
}

// 삭제
async function deleteDBData(id) {
  if (!id) {
    console.error("❌ id는 필수값입니다.");
    return;
  }

  const { data, error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", id)
    .select(); // 삭제된 데이터 반환을 위해 select() 추가

  if (error) {
    console.error("❌ 데이터 삭제 실패:", error);
    throw error;
  }

  return data;
}

export { addDBData, getDBDataByUserId, getId, deleteDBData };
