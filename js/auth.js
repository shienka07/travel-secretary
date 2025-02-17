import { supabase } from "./supabase.js";

async function login(email, password) {

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return false;
  }
  window.location.href="../../index.html";
}

async function checkProfile() {
  const { data, error: auth } = await supabase.auth.getUser();

  const { data: user, error } = await supabase
    .from("userinfo")
    .select("gender")
    .eq("id", data.user.id);

  if (error) {
    return error;
  }
  return user[0].gender;
}

async function setProfile_auth(gender, phone_number, age, live = null) {
  const { data, error: auth } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("userinfo")
    .update({ gender, phone_number, age, live })
    .eq("id", data.user.id);

  if (error) {
    return;
  }
  return true;
}

async function signup(email, password, username) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return false;
  }

  const user = data.user;
  if (!user) {
    return;
  }

  const { error: insertError } = await supabase
    .from("userinfo")
    .insert([{ id: user.id, email: user.email, username: username }]);
  if (insertError) {
    console.log("닉네임 등록 실패: " + insertError.message);
    return;
  }
  await supabase.auth.signOut();
}
async function getNickname() {
  const { data } = await supabase.auth.getUser();

  const { data: user, error } = await supabase
    .from("userinfo")
    .select("username")
    .eq("id", data.user.id);

  if (error) {
    return error;
  }
  return user[0].username;
}

async function getProfile() {
  const { data } = await supabase.auth.getUser();

  const { data: user, error } = await supabase
    .from("userinfo")
    .select("*")
    .eq("id", data.user.id);

  if (error) {
    return error;
  }
  const { id, ...profile } = user[0];
  return profile;
}

async function checkNickname(username) {
  // 닉네임 중복 확인 함수 >> alert 말고 대체
  const { data, error } = await supabase
    .from("userinfo")
    .select("username")
    .eq("username", username);

  if (error) {
    return;
  }

  if (data.length > 0) {
    return false;
  } else {
    return true;
  }
}

async function checkLogin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }
  return true;
}

async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem("username");
  localStorage.removeItem("profile_img");
}

async function createPost(title, content) {
  const { data: user, error: authError } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("posts")
    .insert([{ title: title, content: content, user_id: user.id }]);
  if (error) {
    return error;
  }
}

async function loadPosts() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`*, userinfo : userinfo(username)`)
    .order("id", { ascending: false });
  if (error) {
    console.error("게시물 불러오기 실패:", error);
    return error;
  }
  return posts;
}

async function editPost_auth(postId, newTitle, newContent) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .update({ title: newTitle, content: newContent })
      .eq("id", postId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("게시물 수정 실패:", error);
    return { error };
  }
}

async function deletePost_auth(postId) {
  try {
    // 'posts' 테이블에서 해당 postId에 맞는 게시물을 삭제합니다.
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("게시물 삭제 실패:", error);
    return { error };
  }
}

async function updatePost_auth(postId, newTitle, newContent) {
  const { data, error } = await supabase
    .from("posts")
    .update({
      title: newTitle,
      content: newContent,
      created_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    console.error("게시물 수정 실패:", error);
    return error;
  }

  return data;
}
async function createPost_Recommend_auth(title, content, url, place) {
  const { data, error } = await supabase
    .from("posts_recommend")
    .insert([{ title, content, url, place }]);
  if (error) {
    return error;
  }
}

async function loadPosts_Recommend_auth() {
    // posts 테이블과 userinfo 테이블을 조인하여 username 가져오기
    const { data: posts, error } = await supabase
      .from('posts_recommend')
      .select(`*, userinfo : userinfo(username)`)
      .order('id', { ascending: false });
    if (error){
      return error;
    }

  return posts;
}

async function uploadImage_auth(filePath, imagefile) {
  const { error } = await supabase.storage
    .from("mate-bucket")
    .upload(filePath, imagefile);
  if (error) {
    return;
  }
  const { data, error: auth } = await supabase.auth.getUser();
  const { error: insertError } = await supabase
    .from("userinfo")
    .update({ image_url: filePath })
    .eq("id", data.user.id);

  if (insertError) {
    return;
  }
  
  return true;
}

function getImagePath(url) {
  const { data } = supabase.storage.from("mate-bucket").getPublicUrl(url);
  return data.publicUrl;
}

async function fetchLatestPosts_auth() {
  try {
    const response = await supabase
      .from("MATE_POSTING")
      .select("*")
      .order("id", { ascending: false })
      .limit(9);

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error) {
    console.error("게시글 불러오기 실패:", error);
    throw error;
  }
}

async function setAnswer(text){
    const { data, error: auth } = await supabase.auth.getUser();
    if(auth){
        return auth;
    }

    const { error: insertError } = await supabase
        .from("userinfo")
        .update({ answer: text })
        .eq("id", data.user.id);

  if (insertError) {
    return insertError;
  }
}

async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://aibe-chill-team.github.io/travel-secretary/html/account/resetPassword.html', // 비밀번호 변경 페이지 URL
  });

  if (error) {
    console.error('비밀번호 재설정 요청 오류:', error.message);
    return;
  }
  
  Swal.fire({
    position: "center",
    icon: "success",
    title: "비밀번호 재설정\n 이메일이 전송되었습니다.",
    showConfirmButton: false,
    timer: 1500
  });
  console.log('비밀번호 재설정 이메일이 전송되었습니다.');
}


async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.log('비밀번호 변경 오류:', error.message);
    Swal.fire({
      icon: "error",
      title: "오류",
      text: "비밀번호 변경 오류",
    });
    return;
  }
  await supabase.auth.signOut();
  window.location.href="./login.html";
}


export {
  loadPosts,
  createPost,
  signup,
  login,
  logout,
  checkLogin,
  checkNickname,
  editPost_auth,
  deletePost_auth,
  updatePost_auth,
  createPost_Recommend_auth,
  loadPosts_Recommend_auth,
  uploadImage_auth,
  getImagePath,
  checkProfile,
  getNickname,
  getProfile,
  setProfile_auth,
  fetchLatestPosts_auth,
  setAnswer,
  updatePassword,
  resetPassword
};
