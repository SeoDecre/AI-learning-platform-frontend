<template>
  <div class="login-wrapper">
    <Toast
      v-if="showToast"
      message="Profile is available only for logged in users."
      type="error"
    />

    <!-- Left Side Waves -->
    <div class="box left">
      <div class="wave -one"></div>
      <div class="wave -two"></div>
      <div class="wave -three"></div>
    </div>

    <!-- Right Side Waves -->
    <div class="box right">
      <div class="wave -one"></div>
      <div class="wave -two"></div>
      <div class="wave -three"></div>
    </div>

    <!-- Login Card -->
    <div class="container">
      <img
        src="/src/assets/images/full-SEW-logo.png"
        alt="Logo"
        class="full-logo-image"
      />
      <div class="card">
        <p>Your AI-powered learning companion</p>
        <button @click="login">
          <img
            src="/src/assets/images/USI-Logo.png"
            alt="icon"
            class="USI-icon"
          />
          Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import Toast from "@/components/Toast.vue";

const isLoginPage = ref(true);
const showToast = ref(false);

const login = () => {
  window.location.href =
    "http://localhost:8080/oauth2/authorization/switch-edu-id";
};

onMounted(() => {
  if (isLoginPage.value) {
    document.body.classList.add("login-page-body");
  }

  // Show toast if redirected
  if (sessionStorage.getItem("redirectedDueToAuth")) {
    showToast.value = true;
    sessionStorage.removeItem("redirectedDueToAuth");
  }
});

onUnmounted(() => {
  document.body.classList.remove("login-page-body");
});
</script>

<style scoped>
/* General Styling */
.login-wrapper {
  width: 100%;
  height: 100vh;
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  overflow: hidden;
  background: var(--vt-c-purple);
  color: var(--vt-c-white);
  margin: 0;
  padding: 0;
  top: 0;
  left: 0;
}

/* LEFT SIDE WAVES */
.box.left {
  position: fixed;
  transform: rotate(95deg);
  top: 0;
  left: 0;
}

/* RIGHT SIDE WAVES */
.box.right {
  position: fixed;
  transform: rotate(19deg);
  top: 0;
  right: 0;
}

/* Waves */
.wave {
  position: fixed;
  top: 0;
  opacity: 0.4;
  background: var(--vt-c-black);
  width: 1500px;
  height: 1300px;
  margin-left: -150px;
  margin-top: -250px;
  transform-origin: 50% 48%;
  border-radius: 43%;
  animation: drift 7000ms infinite linear;
}

.wave.-two {
  animation: drift 3000ms infinite linear;
  opacity: 0.1;
  background: var(--vt-c-black);
}

.wave.-three {
  animation: drift 7500ms infinite linear;
  background-color: var(--vt-c-black);
}

/* Waves Animation */
@keyframes drift {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* Card image */
.full-logo-image {
  width: 400px;
  height: auto;
  margin-bottom: 5px;
}

/* Description */
p {
  font-size: 1.5rem;
  margin-bottom: 40px;
  color: var(--vt-c-purple-dark);
}

/* Card Container */
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Login Button */
button {
  font-family: "Circular", sans-serif;
  margin-top: 23px;
  padding: 10px 30px;
  border: 2px solid var(--vt-c-black);
  font-size: 1.75rem;
  border-radius: 20px;
  cursor: pointer;
  background: var(--vt-c-black);
  color: var(--vt-c-white);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  transition: all 0.3s ease;
}

/* Image inside the login button */
button .USI-icon {
  width: 25px;
  height: 25px;
  object-fit: cover;
}

button:hover {
  border: 2px solid var(--vt-c-white);
}
</style>
